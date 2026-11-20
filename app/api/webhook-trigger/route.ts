import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

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

        const hasFb = clientHasFacebook(cliente);
        const targetUrl = resolveWebhookUrl(cliente, webhookUrl);

        const payload = {
            id_instagram: cliente?.id_instagram || id_instagram,
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

        // Envia 1 webhook separado para cada cliente
        const results = await Promise.allSettled(
            targets.map(async (target) => {
                const cliente = clientMap.get(String(target.clienteId)) || (target.id_instagram ? clientMap.get(String(target.id_instagram)) : null);
                const hasFb = clientHasFacebook(cliente);
                const targetUrl = resolveWebhookUrl(cliente, target.webhookUrl);

                const payload = {
                    id_instagram: cliente?.id_instagram || target.id_instagram,
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
