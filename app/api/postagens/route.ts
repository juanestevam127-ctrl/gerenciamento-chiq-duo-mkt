import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cliente_id = searchParams.get('cliente_id');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('API GET /api/postagens: Fetching from NocoDB...', { cliente_id, startDate, endDate });

        // 1. Fetch posts and clients in parallel
        const [posts, clients, contents] = await Promise.all([
            nocodb.controlePostagens.list({
                id_instagram: cliente_id || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 500,
            }),
            nocodb.clientes.list(),
            nocodb.conteudos.list({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 500,
            }),
        ]);

        // 2. Build fast lookup maps
        const clientMap = new Map<string, { username_instagram: string; nome_cliente: string }>();
        for (const c of clients) {
            clientMap.set(c.id_instagram, {
                username_instagram: c.username_instagram,
                nome_cliente: c.nome_cliente,
            });
        }

        const contentByIdMap = new Map<string, string>();
        const contentByDateMap = new Map<string, string>();
        for (const c of contents) {
            if (c.id && c.descricao) contentByIdMap.set(String(c.id), c.descricao);
            if (c.data_postagem && c.descricao) contentByDateMap.set(c.data_postagem, c.descricao);
        }

        // 3. Assemble enriched posts
        const enrichedPosts = posts.map(post => {
            const clienteInfo = clientMap.get(post.id_instagram);
            let descricao: string | undefined = undefined;

            if (post.conteudo_id && contentByIdMap.has(String(post.conteudo_id))) {
                descricao = contentByIdMap.get(String(post.conteudo_id));
            } else if (contentByDateMap.has(post.data_postagem)) {
                descricao = contentByDateMap.get(post.data_postagem);
            }

            return {
                ...post,
                cliente: clienteInfo || undefined,
                conteudo: descricao ? { descricao } : undefined,
            };
        });

        console.log('API GET /api/postagens: Success, returned', enrichedPosts.length, 'posts');
        return NextResponse.json(enrichedPosts);
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar postagens', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const searchParams = request.nextUrl.searchParams;
        const idFromQuery = searchParams.get('id');

        const ids: (string | number)[] = [];
        if (body.ids && Array.isArray(body.ids)) {
            ids.push(...body.ids);
        } else if (body.id) {
            ids.push(body.id);
        } else if (idFromQuery) {
            ids.push(idFromQuery);
        }

        if (ids.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum ID de postagem informado para exclusão' },
                { status: 400 }
            );
        }

        console.log(`API DELETE /api/postagens: Excluindo ${ids.length} postagem(ns)...`, ids);

        if (ids.length === 1) {
            await nocodb.controlePostagens.delete(ids[0]);
        } else {
            await nocodb.controlePostagens.deleteMany(ids);
        }

        return NextResponse.json({
            success: true,
            deletedCount: ids.length,
            ids,
        });
    } catch (error: any) {
        console.error('Error deleting postagens:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir postagem(ns)', details: error.message },
            { status: 500 }
        );
    }
}
