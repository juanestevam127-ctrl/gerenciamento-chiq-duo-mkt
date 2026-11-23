import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';
import { getTodayBrazil } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const WEBHOOK_ENVIA_NAO_POSTAGENS_INSTAGRAM = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/envia-nao-postagens';
const WEBHOOK_ENVIA_NAO_POSTAGENS_FACEBOOK = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/envia-nao-postagens-facebook';

function clientHasFacebook(cliente: any): boolean {
    if (!cliente) return false;
    return !!(cliente.token_facebook || (cliente.id_pagina_facebook && cliente.token_facebook));
}

function resolveWebhookUrl(cliente: any, fallbackUrl?: string): string {
    if (clientHasFacebook(cliente)) {
        return WEBHOOK_ENVIA_NAO_POSTAGENS_FACEBOOK;
    }
    return WEBHOOK_ENVIA_NAO_POSTAGENS_INSTAGRAM;
}

// Disparo individual
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clienteId, id_instagram, webhookUrl } = body;

        let cliente = null;
        if (clienteId) {
            cliente = await nocodb.clientes.getById(clienteId);
        } else if (id_instagram) {
            cliente = await nocodb.clientes.getByInstagramId(id_instagram);
        }

        const finalIdInstagram = cliente?.id_instagram || id_instagram;
        const today = getTodayBrazil();

        // Intervalo de segurança: 5 minutos entre disparos manuais por cliente
        const INTERVAL_MS = 5 * 60 * 1000;
        let logs: any[] = [];
        if (finalIdInstagram) {
            logs = await nocodb.webhookRetryLog.list({ date: today, id_instagram: finalIdInstagram });
            if (logs.length > 0) {
                const lastRetry = logs.reduce((latest, current) => {
                    return new Date(current.disparado_em).getTime() > new Date(latest.disparado_em).getTime() ? current : latest;
                }, logs[0]);
                const lastTime = new Date(lastRetry.disparado_em).getTime();
                if (Date.now() - lastTime < INTERVAL_MS) {
                    const remainingSec = Math.ceil((INTERVAL_MS - (Date.now() - lastTime)) / 1000);
                    const remainingMin = Math.ceil(remainingSec / 60);
                    return NextResponse.json(
                        { error: `Aguarde ${remainingMin} min (${remainingSec}s) para disparar novamente para este cliente.` },
                        { status: 429 }
                    );
                }
            }
        }

        const hasFb = clientHasFacebook(cliente);
        const targetUrl = resolveWebhookUrl(cliente, webhookUrl);

        const payload = {
            id_instagram: finalIdInstagram,
            clienteId: cliente?.id || clienteId,
            nome_cliente: cliente?.nome_cliente,
            username_instagram: cliente?.username_instagram,
            id_pagina_facebook: cliente?.id_pagina_facebook || null,
            token_facebook: cliente?.token_facebook || null,
            tem_facebook: hasFb,
            trigger: 'nao_postado',
            timestamp: new Date().toISOString()
        };

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook error: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Webhook retornou status ${response.status}` },
                { status: 502 }
            );
        }

        // Registrar tentativa no log do NocoDB
        if (finalIdInstagram) {
            await nocodb.webhookRetryLog.create({
                id_instagram: finalIdInstagram,
                data_postagem: today,
                tentativa: logs.length + 1,
                disparado_em: new Date().toISOString(),
                status: 'success',
            });
        }

        return NextResponse.json({ success: true, clienteId, targetUrl, tem_facebook: hasFb });
    } catch (error: any) {
        console.error('Error triggering webhook:', error);
        return NextResponse.json(
            { error: 'Erro ao disparar webhook', details: error.message },
            { status: 500 }
        );
    }
}

// Disparo em lote (envia 1 webhook por cliente)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { targets } = body as { targets: { clienteId: string; id_instagram?: string; webhookUrl?: string }[] };

        if (!targets || targets.length === 0) {
            return NextResponse.json({ error: 'Nenhum cliente para disparar' }, { status: 400 });
        }

        // Buscar lista de clientes para checar quem tem Facebook
        const allClients = await nocodb.clientes.list();
        const clientMap = new Map<string, any>();
        for (const c of allClients) {
            clientMap.set(String(c.id), c);
            if (c.id_instagram) clientMap.set(String(c.id_instagram), c);
        }

        const today = getTodayBrazil();
        const INTERVAL_MS = 5 * 60 * 1000;
        const now = Date.now();

        // Envia 1 webhook separado para cada cliente respeitando os 5 minutos de intervalo
        const results = await Promise.allSettled(
            targets.map(async (target) => {
                const cliente = clientMap.get(String(target.clienteId)) || (target.id_instagram ? clientMap.get(String(target.id_instagram)) : null);
                const finalIdInstagram = cliente?.id_instagram || target.id_instagram;

                if (finalIdInstagram) {
                    const logs = await nocodb.webhookRetryLog.list({ date: today, id_instagram: finalIdInstagram });
                    if (logs.length > 0) {
                        const lastRetry = logs.reduce((latest, current) => {
                            return new Date(current.disparado_em).getTime() > new Date(latest.disparado_em).getTime() ? current : latest;
                        }, logs[0]);
                        const lastTime = new Date(lastRetry.disparado_em).getTime();
                        if (now - lastTime < INTERVAL_MS) {
                            return { clienteId: target.clienteId, ok: false, status: 429, error: 'Aguardando intervalo de 5 min' };
                        }
                    }
                }

                const hasFb = clientHasFacebook(cliente);
                const targetUrl = resolveWebhookUrl(cliente, target.webhookUrl);

                const payload = {
                    id_instagram: finalIdInstagram,
                    clienteId: cliente?.id || target.clienteId,
                    nome_cliente: cliente?.nome_cliente,
                    username_instagram: cliente?.username_instagram,
                    id_pagina_facebook: cliente?.id_pagina_facebook || null,
                    token_facebook: cliente?.token_facebook || null,
                    tem_facebook: hasFb,
                    trigger: 'nao_postado',
                    timestamp: new Date().toISOString()
                };

                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok && finalIdInstagram) {
                    const logs = await nocodb.webhookRetryLog.list({ date: today, id_instagram: finalIdInstagram });
                    await nocodb.webhookRetryLog.create({
                        id_instagram: finalIdInstagram,
                        data_postagem: today,
                        tentativa: logs.length + 1,
                        disparado_em: new Date().toISOString(),
                        status: 'success',
                    });
                }

                return { clienteId: target.clienteId, targetUrl, status: res.status, ok: res.ok, tem_facebook: hasFb };
            })
        );

        const summary = results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return { clienteId: targets[i].clienteId, ok: false, status: 500, error: r.reason?.message };
        });

        const successCount = summary.filter(s => s.ok).length;
        return NextResponse.json({ success: true, successCount, total: targets.length, summary });
    } catch (error: any) {
        console.error('Error bulk triggering webhooks:', error);
        return NextResponse.json(
            { error: 'Erro ao disparar webhooks em massa', details: error.message },
            { status: 500 }
        );
    }
}
