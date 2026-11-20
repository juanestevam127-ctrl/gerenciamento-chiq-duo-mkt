import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

// GET single content
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const conteudo = await nocodb.conteudos.getById(id);

        if (!conteudo) {
            return NextResponse.json(
                { error: 'Conteúdo não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(conteudo);
    } catch (error: any) {
        console.error('Error fetching content:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar conteúdo', details: error.message },
            { status: 500 }
        );
    }
}

// PUT update content
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = await nocodb.conteudos.update(id, {
            data_postagem: body.data_postagem,
            descricao: body.descricao,
            imagem_estatica: body.imagem_estatica,
            carrossel: body.carrossel,
            reels: body.reels,
            stories: body.stories,
            id_instagram: body.id_instagram,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating content:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar conteúdo', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE content
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await nocodb.conteudos.delete(id);
        return NextResponse.json({ message: 'Conteúdo excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting content:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir conteúdo', details: error.message },
            { status: 500 }
        );
    }
}
