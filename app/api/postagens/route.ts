import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cliente_id = searchParams.get('cliente_id');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('API GET /api/postagens: Fetching...', { cliente_id, startDate, endDate });

        let query = supabase
            .from('Controle de Postagens - Clientes Chiquinho')
            .select(`
                *,
                cliente:id_instagram (
                    username_instagram,
                    nome_cliente
                ),
                conteudo:conteudo_id (
                    descricao
                )
            `)
            .order('data_postagem', { ascending: false });

        if (cliente_id) {
            query = query.eq('id_instagram', cliente_id);
        }

        if (startDate) {
            query = query.gte('data_postagem', startDate);
        }

        if (endDate) {
            query = query.lte('data_postagem', endDate);
        }

        const { data: postagensData, error: postagensError } = await query;

        if (postagensError) throw postagensError;

        // Fallback for missing descriptions: match by date and id_instagram
        const postsWithFallback = await Promise.all((postagensData || []).map(async (post) => {
            if (post.conteudo?.descricao) return post;

            // If no explicit conteudo_id or missing descricao, try to find by date and account
            const { data: contentData } = await supabase
                .from('Conteúdos Chiquinho Sorvetes')
                .select('descricao')
                .eq('data_postagem', post.data_postagem)
                .or(`id_instagram.eq.${post.id_instagram},id_instagram.is.null`)
                .maybeSingle();

            if (contentData?.descricao) {
                return {
                    ...post,
                    conteudo: { descricao: contentData.descricao }
                };
            }
            return post;
        }));

        console.log('API GET /api/postagens: Success, found', postsWithFallback.length, 'items');
        return NextResponse.json(postsWithFallback);
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar postagens', details: error.message },
            { status: 500 }
        );
    }
}
