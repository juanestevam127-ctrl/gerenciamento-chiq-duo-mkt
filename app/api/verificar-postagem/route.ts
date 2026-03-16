import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Cliente, ControlePostagem } from '@/types/database';

type TipoPostagem = 'FEED' | 'STORIES' | 'FEED FACEBOOK' | 'STORIES FACEBOOK';

export const dynamic = 'force-dynamic';

function getRequiredTypes(cliente: Cliente): TipoPostagem[] {
    if (cliente.id_pagina_facebook && cliente.token_facebook) {
        return ['STORIES FACEBOOK', 'STORIES', 'FEED FACEBOOK', 'FEED'];
    }
    return ['STORIES', 'FEED'];
}

/**
 * GET /api/verificar-postagem?id_instagram=X&date=YYYY-MM-DD
 * Returns the posting status for a specific client and date,
 * including which types are posted, which are missing, and retry count.
 */
export async function GET(request: NextRequest) {
    try {
        const id_instagram = request.nextUrl.searchParams.get('id_instagram');
        const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

        if (!id_instagram) {
            return NextResponse.json({ error: 'id_instagram is required' }, { status: 400 });
        }

        // Fetch client info
        const { data: cliente, error: clienteError } = await supabase
            .from('Clientes Chiquinho')
            .select('*')
            .eq('id_instagram', id_instagram)
            .single();

        if (clienteError || !cliente) {
            return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 });
        }

        // Fetch postagens for this client/date
        const { data: postagens, error: postagensError } = await supabase
            .from('Controle de Postagens - Clientes Chiquinho')
            .select('*')
            .eq('id_instagram', id_instagram)
            .eq('data_postagem', date);

        if (postagensError) throw postagensError;

        // Fetch retry logs for this client/date
        const { data: retryLogs, error: retryError } = await supabase
            .from('webhook_retry_log')
            .select('*')
            .eq('id_instagram', id_instagram)
            .eq('data_postagem', date)
            .order('disparado_em', { ascending: true });

        if (retryError) throw retryError;

        const required = getRequiredTypes(cliente as Cliente);
        const clientePostagens: ControlePostagem[] = postagens || [];
        const postedTypes = clientePostagens.map(p => p.tipo_postagem);
        const missingTypes = required.filter(t => !postedTypes.includes(t));
        const isComplete = missingTypes.length === 0;

        const logs = retryLogs || [];
        const lastRetry = logs.length > 0 ? logs[logs.length - 1] : null;

        return NextResponse.json({
            id_instagram,
            date,
            cliente: {
                nome: cliente.nome_cliente,
                username_instagram: cliente.username_instagram,
                horario_postagem: cliente.horario_postagem,
                tem_facebook: !!(cliente.id_pagina_facebook && cliente.token_facebook)
            },
            postagem: {
                completa: isComplete,
                tipos_necessarios: required,
                tipos_postados: postedTypes,
                tipos_faltando: missingTypes
            },
            retry: {
                tentativas: logs.length,
                max_tentativas: 3,
                ultima_tentativa: lastRetry?.disparado_em || null,
                ultimo_status: lastRetry?.status || null,
                pode_tentar_novamente: logs.length < 3 && !isComplete
            }
        });
    } catch (error: any) {
        console.error('Error in verificar-postagem:', error);
        return NextResponse.json(
            { error: 'Erro ao verificar postagem', details: error.message },
            { status: 500 }
        );
    }
}
