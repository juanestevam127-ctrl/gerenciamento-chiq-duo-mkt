import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Cliente, ControlePostagem, WebhookRetryLog } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * Returns the required post types for a client based on whether they have Facebook.
 */
type TipoPostagem = 'FEED' | 'STORIES' | 'FEED FACEBOOK' | 'STORIES FACEBOOK';

function getRequiredTypes(cliente: Cliente): TipoPostagem[] {
    if (cliente.id_pagina_facebook && cliente.token_facebook) {
        return ['STORIES FACEBOOK', 'STORIES', 'FEED FACEBOOK', 'FEED'];
    }
    return ['STORIES', 'FEED'];
}

function isPostingComplete(postagens: ControlePostagem[], required: TipoPostagem[]): boolean {
    const posted = new Set(postagens.map(p => p.tipo_postagem));
    return required.every(t => posted.has(t));
}

/** POST /api/auto-retry
 * Checks all clients scheduled for today, finds incomplete postings,
 * and triggers webhooks up to 3 times (every 5 minutes).
 */
export async function POST(request: NextRequest) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const nowUtc = new Date();

        // 1. Fetch all clients with a schedule
        const { data: clientes, error: clientesError } = await supabase
            .from('Clientes Chiquinho')
            .select('*')
            .not('horario_postagem', 'is', null)
            .not('webhook', 'is', null);

        if (clientesError) throw clientesError;
        if (!clientes || clientes.length === 0) {
            return NextResponse.json({ message: 'Nenhum cliente configurado', results: [] });
        }

        // 2. Fetch today's postagens and scheduled content
        const [postagensResult, contentsResult] = await Promise.all([
            supabase
                .from('Controle de Postagens - Clientes Chiquinho')
                .select('*')
                .eq('data_postagem', today),
            supabase
                .from('Conteúdos Chiquinho Sorvetes')
                .select('id_instagram')
                .eq('data_postagem', today)
        ]);

        if (postagensResult.error) throw postagensResult.error;
        if (contentsResult.error) throw contentsResult.error;

        const allPostagens: ControlePostagem[] = postagensResult.data || [];
        const clientsWithContent = new Set((contentsResult.data || []).map(c => c.id_instagram));

        const results: any[] = [];

        for (const cliente of clientes as Cliente[]) {
            // 2.1 Check if client has content for today
            if (!clientsWithContent.has(cliente.id_instagram)) {
                results.push({
                    cliente: cliente.nome_cliente,
                    username_instagram: cliente.username_instagram,
                    action: 'pulado',
                    reason: 'Sem conteudo cadastrado para hoje'
                });
                continue;
            }

            // Parse scheduled time (format: "HH:MM:SS" or "HH:MM")
            const [hh, mm] = (cliente.horario_postagem || '').split(':').map(Number);
            if (isNaN(hh) || isNaN(mm)) continue;

            // Build the scheduled time in today's local date (server timezone)
            const scheduledTime = new Date(nowUtc);
            scheduledTime.setUTCHours(hh + 3, mm, 0, 0); // convert BR time to UTC

            // Check if scheduled time has passed
            if (nowUtc < scheduledTime) {
                results.push({ 
                    cliente: cliente.nome_cliente, 
                    username_instagram: cliente.username_instagram,
                    action: 'aguardando', 
                    reason: 'Horario ainda nao passou' 
                });
                continue;
            }

            // Check if posting is complete
            const clientePostagens = allPostagens.filter(p => p.id_instagram === cliente.id_instagram);
            const required = getRequiredTypes(cliente);
            if (isPostingComplete(clientePostagens, required)) {
                results.push({ 
                    cliente: cliente.nome_cliente, 
                    username_instagram: cliente.username_instagram,
                    action: 'completo', 
                    tipos: required 
                });
                continue;
            }

            // 3. Fetch retry logs for THIS specific client IN REAL TIME
            // This prevents race conditions where multiple requests see the same cached state
            const { data: clienteRetries, error: retryError } = await supabase
                .from('webhook_retry_log')
                .select('*')
                .eq('id_instagram', cliente.id_instagram)
                .eq('data_postagem', today)
                .order('disparado_em', { ascending: true });

            if (retryError) {
                console.error(`Error fetching retries for ${cliente.id_instagram}:`, retryError);
                continue;
            }

            const logs = clienteRetries || [];
            const tentativasCount = logs.length;

            // Max retries reached
            if (tentativasCount >= 3) {
                results.push({ 
                    cliente: cliente.nome_cliente, 
                    username_instagram: cliente.username_instagram,
                    action: 'max_tentativas', 
                    tentativas: tentativasCount 
                });
                continue;
            }

            // CHECK INTERVAL: Ensure 30 minutes have passed since last attempt
            const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
            if (tentativasCount > 0) {
                const lastRetry = logs[logs.length - 1];
                const lastRetryTime = new Date(lastRetry.disparado_em);
                const nextAllowedTime = new Date(lastRetryTime.getTime() + INTERVAL_MS);
                
                if (nowUtc < nextAllowedTime) {
                    results.push({
                        cliente: cliente.nome_cliente,
                        username_instagram: cliente.username_instagram,
                        action: 'aguardando_intervalo',
                        tentativa_atual: tentativasCount,
                        proximo_disparo: nextAllowedTime.toISOString()
                    });
                    continue;
                }
            } else {
                // For the first attempt, also ensure we are at least at the scheduled time
                // (Already checked above, but keep it logic-tight)
            }

            // Fire the webhook
            const nextTentativa = tentativasCount + 1;
            let webhookStatus: 'success' | 'failed' = 'failed';

            try {
                // Pre-log to minimize race condition window (optional, but good practice)
                // For now, we fetch in-loop which is already much safer than before.
                
                const webhookRes = await fetch(cliente.webhook!, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trigger: 'auto_retry',
                        clienteId: cliente.id,
                        id_instagram: cliente.id_instagram,
                        tentativa: nextTentativa,
                        timestamp: nowUtc.toISOString()
                    }),
                });
                webhookStatus = webhookRes.ok ? 'success' : 'failed';
            } catch (err) {
                console.error(`Webhook fetch failed for ${cliente.nome_cliente}:`, err);
                webhookStatus = 'failed';
            }

            // Log the retry attempt
            await supabase.from('webhook_retry_log').insert({
                id_instagram: cliente.id_instagram,
                data_postagem: today,
                tentativa: nextTentativa,
                disparado_em: nowUtc.toISOString(),
                status: webhookStatus
            });

            results.push({
                cliente: cliente.nome_cliente,
                username_instagram: cliente.username_instagram,
                action: 'webhook_disparado',
                tentativa: nextTentativa,
                status: webhookStatus,
                faltam: required.filter(t => !clientePostagens.some(p => p.tipo_postagem === t))
            });
        }


        return NextResponse.json({ success: true, date: today, results });
    } catch (error: any) {
        console.error('Error in auto-retry:', error);
        return NextResponse.json(
            { error: 'Erro no auto-retry', details: error.message },
            { status: 500 }
        );
    }
}
