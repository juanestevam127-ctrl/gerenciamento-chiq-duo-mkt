import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Cliente, Conteudo, ControlePostagem } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Logic:
        // If 'date' is provided, we fetch data for that specific day.
        // If range is provided, we fetch for the range.
        // Default to today if nothing provided.

        const targetStartDate = startDate || date || new Date().toISOString().split('T')[0];
        const targetEndDate = endDate || date || new Date().toISOString().split('T')[0];

        console.log(`API GET /api/dashboard/data: Fetching for ${targetStartDate} to ${targetEndDate}`);

        // 1. Fetch ALL Clients
        const { data: clientes, error: clientesError } = await supabase
            .from('Clientes Chiquinho')
            .select('*')
            .order('nome_cliente');

        if (clientesError) throw clientesError;

        // 2. Fetch Content for the period
        // Note: We need content that matches the date link OR if it's generic (id_instagram is null? No, user wants per client)
        // User logic: "Verificar se existe registro na tabela Controle... E verificar se tem conteúdo disponível na tabela Conteúdos"
        // So we just fetch all content for the date range.
        const { data: conteudos, error: conteudosError } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .select('*')
            .gte('data_postagem', targetStartDate)
            .lte('data_postagem', targetEndDate);

        if (conteudosError) throw conteudosError;

        // 3. Fetch Posts (Controle) for the period
        const { data: postagens, error: postagensError } = await supabase
            .from('Controle de Postagens - Clientes Chiquinho')
            .select('*')
            .gte('data_postagem', targetStartDate)
            .lte('data_postagem', targetEndDate);

        if (postagensError) throw postagensError;

        console.log(`Fetched: ${clientes?.length} clients, ${conteudos?.length} contents, ${postagens?.length} posts`);

        return NextResponse.json({
            clientes: clientes || [],
            conteudos: conteudos || [],
            postagens: postagens || []
        });

    } catch (error: any) {
        console.error('Error in dashboard data API:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do dashboard', details: error.message },
            { status: 500 }
        );
    }
}
