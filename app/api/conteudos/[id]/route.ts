import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        // Only update fields that are provided in the body
        // We use !== undefined to allow explicit null values (to clear a field)
        if (body.data_postagem !== undefined) updateData.data_postagem = body.data_postagem;
        if (body.descricao !== undefined) updateData.descricao = body.descricao;
        if (body.imagem_estatica !== undefined) updateData.imagem_estatica = body.imagem_estatica;
        if (body.carrossel !== undefined) updateData.carrossel = body.carrossel;
        if (body.reels !== undefined) updateData.reels = body.reels;
        if (body.stories !== undefined) updateData.stories = body.stories;
        if (body.id_instagram !== undefined) updateData.id_instagram = body.id_instagram;

        const { data, error } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating content:', error);
            return NextResponse.json(
                { 
                    error: 'Erro ao atualizar conteúdo no banco de dados', 
                    details: error.message,
                    code: error.code
                },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
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
