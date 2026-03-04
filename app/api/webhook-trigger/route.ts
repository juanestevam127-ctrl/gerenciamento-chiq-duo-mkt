import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clienteId, webhookUrl } = body;

        if (!webhookUrl) {
            return NextResponse.json(
                { error: 'Este cliente não possui webhook configurado' },
                { status: 400 }
            );
        }

        // Fire the webhook (POST request is more standard for actions)
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trigger: 'manual_start',
                clienteId,
                timestamp: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            console.error(`Webhook error: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Webhook retornou status ${response.status}` },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true, clienteId });
    } catch (error: any) {
        console.error('Error triggering webhook:', error);
        return NextResponse.json(
            { error: 'Erro ao disparar webhook', details: error.message },
            { status: 500 }
        );
    }
}

// Bulk trigger: accepts array of { clienteId, webhookUrl }
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { targets } = body as { targets: { clienteId: string; webhookUrl: string }[] };

        if (!targets || targets.length === 0) {
            return NextResponse.json({ error: 'Nenhum cliente para disparar' }, { status: 400 });
        }

        const results = await Promise.allSettled(
            targets.map(async ({ clienteId, webhookUrl }) => {
                const res = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trigger: 'bulk_start',
                        clienteId,
                        timestamp: new Date().toISOString()
                    }),
                });
                return { clienteId, status: res.status, ok: res.ok };
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
