import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

const WEBHOOK_ENVIA_NAO_POSTAGENS = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/envia-nao-postagens';

function isClientOnlyInstagram(cliente: any): boolean {
    if (!cliente) return true;
    return !(cliente.id_pagina_facebook && cliente.token_facebook);
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

        const onlyInstagram = isClientOnlyInstagram(cliente);
        const targetUrl = onlyInstagram ? WEBHOOK_ENVIA_NAO_POSTAGENS : (webhookUrl || cliente?.webhook);

        if (!targetUrl) {
            return NextResponse.json(
                { error: 'Nenhum webhook configurado para este cliente' },
                { status: 400 }
            );
        }

        const payload = onlyInstagram ? {
            id_instagram: cliente?.id_instagram || id_instagram,
            clienteId: cliente?.id || clienteId,
            nome_cliente: cliente?.nome_cliente,
            username_instagram: cliente?.username_instagram,
            trigger: 'nao_postado',
            timestamp: new Date().toISOString()
        } : {
            trigger: 'manual_start',
            clienteId: cliente?.id || clienteId,
            id_instagram: cliente?.id_instagram || id_instagram,
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

        return NextResponse.json({ success: true, clienteId, targetUrl });
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

        // Buscar lista de clientes para checar quem tem apenas Instagram
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
                const onlyInstagram = isClientOnlyInstagram(cliente);
                const targetUrl = onlyInstagram ? WEBHOOK_ENVIA_NAO_POSTAGENS : (target.webhookUrl || cliente?.webhook);

                if (!targetUrl) {
                    throw new Error('Sem webhook configurado');
                }

                const payload = onlyInstagram ? {
                    id_instagram: cliente?.id_instagram || target.id_instagram,
                    clienteId: cliente?.id || target.clienteId,
                    nome_cliente: cliente?.nome_cliente,
                    username_instagram: cliente?.username_instagram,
                    trigger: 'nao_postado',
                    timestamp: new Date().toISOString()
                } : {
                    trigger: 'bulk_start',
                    clienteId: cliente?.id || target.clienteId,
                    id_instagram: cliente?.id_instagram || target.id_instagram,
                    timestamp: new Date().toISOString()
                };

                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                return { clienteId: target.clienteId, targetUrl, status: res.status, ok: res.ok };
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
