import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';
import { Cliente, ControlePostagem, WebhookRetryLog } from '@/types/database';

export const dynamic = 'force-dynamic';

const WEBHOOK_ENVIA_NAO_POSTAGENS = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/envia-nao-postagens';

/**
 * Returns true if client has Facebook page and token configured.
 */
function hasFacebook(cliente: Cliente): boolean {
    return !!(cliente.id_pagina_facebook && cliente.token_facebook);
}

/**
 * Returns the required post types for a client based on whether they have Facebook.
 */
type TipoPostagem = 'FEED' | 'STORIES' | 'FEED FACEBOOK' | 'STORIES FACEBOOK';

function getRequiredTypes(cliente: Cliente): TipoPostagem[] {
    if (hasFacebook(cliente)) {
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
 * and triggers webhooks up to 3 times (every 30 minutes).
 * 
 * Regra: Para clientes com apenas Instagram, o webhook sempre é enviado para:
 * https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/envia-nao-postagens
 * contendo o id_instagram do cliente. Se houver múltiplos clientes, envia 1 webhook por cliente.
 */
export async function POST(request: NextRequest) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const nowUtc = new Date();

        // 1. Fetch all clients from NocoDB
        const allClients = await nocodb.clientes.list();
        // Clientes que possuem horário programado e (webhook próprio OU são apenas Instagram)
        const clientes = allClients.filter(c => c.horario_postagem && (c.webhook || !hasFacebook(c)));

        if (!clientes || clientes.length === 0) {
            return NextResponse.json({ message: 'Nenhum cliente configurado', results: [] });
        }

        // 2. Fetch today's postagens and scheduled content from NocoDB
        const [postagensResult, contentsResult] = await Promise.all([
            nocodb.controlePostagens.list({ date: today }),
            nocodb.conteudos.list({ date: today }),
        ]);

        const allPostagens: ControlePostagem[] = postagensResult || [];
        const clientsWithContent = new Set(
            contentsResult.map(c => c.id_instagram).filter(Boolean)
        );
        const hasGenericContent = contentsResult.some(c => !c.id_instagram);

        const results: any[] = [];

        for (const cliente of clientes) {
            // 2.1 Check if client has content for today
            if (!hasGenericContent && !clientsWithContent.has(cliente.id_instagram)) {
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

            // 3. Fetch retry logs for this client
            const logs = await nocodb.webhookRetryLog.list({ date: today, id_instagram: cliente.id_instagram });
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
            }

            // 4. Determina qual webhook e payload disparar (Regra de Apenas Instagram)
            const isOnlyInstagram = !hasFacebook(cliente);
            const targetWebhookUrl = isOnlyInstagram ? WEBHOOK_ENVIA_NAO_POSTAGENS : cliente.webhook!;

            if (!targetWebhookUrl) {
                results.push({
                    cliente: cliente.nome_cliente,
                    username_instagram: cliente.username_instagram,
                    action: 'erro',
                    reason: 'Cliente sem webhook configurado'
                });
                continue;
            }

            const nextTentativa = tentativasCount + 1;
            let webhookStatus: 'success' | 'failed' = 'failed';

            const payload = isOnlyInstagram ? {
                id_instagram: cliente.id_instagram,
                clienteId: cliente.id,
                nome_cliente: cliente.nome_cliente,
                username_instagram: cliente.username_instagram,
                trigger: 'nao_postado',
                tentativa: nextTentativa,
                data_postagem: today,
                timestamp: nowUtc.toISOString(),
                faltam: required.filter(t => !clientePostagens.some(p => p.tipo_postagem === t)),
            } : {
                trigger: 'auto_retry',
                clienteId: cliente.id,
                id_instagram: cliente.id_instagram,
                tentativa: nextTentativa,
                timestamp: nowUtc.toISOString(),
            };

            try {
                const webhookRes = await fetch(targetWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                webhookStatus = webhookRes.ok ? 'success' : 'failed';
            } catch (err) {
                console.error(`Webhook fetch failed for ${cliente.nome_cliente}:`, err);
                webhookStatus = 'failed';
            }

            // Log the retry attempt in NocoDB
            await nocodb.webhookRetryLog.create({
                id_instagram: cliente.id_instagram,
                data_postagem: today,
                tentativa: nextTentativa,
                disparado_em: nowUtc.toISOString(),
                status: webhookStatus,
            });

            results.push({
                cliente: cliente.nome_cliente,
                username_instagram: cliente.username_instagram,
                id_instagram: cliente.id_instagram,
                webhook_url: targetWebhookUrl,
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
