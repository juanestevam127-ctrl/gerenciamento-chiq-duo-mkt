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

        // 2. Fetch today's postagens and retry logs
        const [postagensResult, retryLogsResult] = await Promise.all([
            supabase
                .from('Controle de Postagens - Clientes Chiquinho')
                .select('*')
                .eq('data_postagem', today),
            supabase
                .from('webhook_retry_log')
                .select('*')
                .eq('data_postagem', today)
                .order('disparado_em', { ascending: true })
        ]);

        if (postagensResult.error) throw postagensResult.error;
        if (retryLogsResult.error) throw retryLogsResult.error;

        const allPostagens: ControlePostagem[] = postagensResult.data || [];
        const allRetryLogs: WebhookRetryLog[] = retryLogsResult.data || [];

        const results: any[] = [];

        for (const cliente of clientes as Cliente[]) {
            // Parse scheduled time (format: "HH:MM:SS" or "HH:MM")
            const [hh, mm] = (cliente.horario_postagem || '').split(':').map(Number);
            if (isNaN(hh) || isNaN(mm)) continue;

            // Build the scheduled time in today's local date (server timezone)
            // horario_postagem is stored in UTC-3 (Brazil)
            const scheduledTime = new Date(nowUtc);
            scheduledTime.setUTCHours(hh + 3, mm, 0, 0); // convert BR time to UTC

            // Check if 5 minutes have passed since scheduled time
            const fiveMinAfterSchedule = new Date(scheduledTime.getTime() + 5 * 60 * 1000);
            if (nowUtc < fiveMinAfterSchedule) {
                results.push({ cliente: cliente.nome_cliente, action: 'aguardando', reason: 'Horario ainda nao passou' });
                continue;
            }

            // Check if posting is complete
            const clientePostagens = allPostagens.filter(p => p.id_instagram === cliente.id_instagram);
            const required = getRequiredTypes(cliente);
            if (isPostingComplete(clientePostagens, required)) {
                results.push({ cliente: cliente.nome_cliente, action: 'completo', tipos: required });
                continue;
            }

            // Check retry log for this client today
            const clienteRetries = allRetryLogs
                .filter(r => r.id_instagram === cliente.id_instagram)
                .sort((a, b) => new Date(a.disparado_em).getTime() - new Date(b.disparado_em).getTime());

            const tentativasCount = clienteRetries.length;

            // Max retries reached
            if (tentativasCount >= 3) {
                results.push({ cliente: cliente.nome_cliente, action: 'max_tentativas', tentativas: tentativasCount });
                continue;
            }

            // For retry 2 and 3, check that 5 minutes have passed since last attempt
            if (tentativasCount > 0) {
                const lastRetry = clienteRetries[clienteRetries.length - 1];
                const lastRetryTime = new Date(lastRetry.disparado_em);
                const nextRetryTime = new Date(lastRetryTime.getTime() + 5 * 60 * 1000);
                if (nowUtc < nextRetryTime) {
                    results.push({
                        cliente: cliente.nome_cliente,
                        action: 'aguardando_retry',
                        tentativa_atual: tentativasCount,
                        proximo_retry: nextRetryTime.toISOString()
                    });
                    continue;
                }
            }

            // Fire the webhook
            const nextTentativa = tentativasCount + 1;
            let webhookStatus: 'success' | 'failed' = 'failed';

            try {
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
            } catch {
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
