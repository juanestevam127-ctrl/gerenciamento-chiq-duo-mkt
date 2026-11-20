import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

// GET all content
export async function GET() {
    try {
        console.log('API GET /api/conteudos: Fetching from NocoDB...');
        const conteudos = await nocodb.conteudos.list();
        console.log('API GET /api/conteudos: Success, found', conteudos.length, 'items');
        return NextResponse.json(conteudos);
    } catch (error: any) {
        console.error('Error fetching content from NocoDB:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar conteúdos', details: error.message },
            { status: 500 }
        );
    }
}

// POST new content
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('API POST /api/conteudos: Creating new content:', body.data_postagem);

        if (!body.data_postagem) {
            return NextResponse.json(
                { error: 'Data de postagem é obrigatória' },
                { status: 400 }
            );
        }

        const newContent = await nocodb.conteudos.create({
            data_postagem: body.data_postagem,
            descricao: body.descricao || null,
            imagem_estatica: body.imagem_estatica || null,
            carrossel: body.carrossel || null,
            reels: body.reels || null,
            stories: body.stories || null,
            id_instagram: body.id_instagram || null,
        });

        console.log('API POST /api/conteudos: Success, created item:', newContent.id);
        return NextResponse.json(newContent, { status: 201 });
    } catch (error: any) {
        console.error('Error creating content in NocoDB:', error);
        return NextResponse.json(
            { error: 'Erro ao criar conteúdo', details: error.message },
            { status: 500 }
        );
    }
}
