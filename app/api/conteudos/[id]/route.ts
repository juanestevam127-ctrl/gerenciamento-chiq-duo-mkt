import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET single content
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Erro ao buscar conteúdo' },
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
        console.log(`API PUT /api/conteudos/${id}: Updating content with body:`, JSON.stringify(body, null, 2));

        const { data, error } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .update({
                data_postagem: body.data_postagem,
                descricao: body.descricao || null,
                imagem_estatica: body.imagem_estatica || null,
                carrossel: body.carrossel || null,
                reels: body.reels || null,
                stories: body.stories || null,
                id_instagram: body.id_instagram || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating content:', error);
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating content:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar conteúdo' },
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

        const { error } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Conteúdo excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting content:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir conteúdo' },
            { status: 500 }
        );
    }
}
