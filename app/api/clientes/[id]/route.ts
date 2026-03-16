import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET single client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('Clientes Chiquinho')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Erro ao buscar cliente' },
            { status: 500 }
        );
    }
}

// PUT update client
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from('Clientes Chiquinho')
            .update({
                nome_cliente: body.nome_cliente,
                username_instagram: body.username_instagram,
                id_instagram: body.id_instagram,
                horario_postagem: body.horario_postagem || null,
                token: body.token || null,
                webhook: body.webhook || null,
                id_pagina_facebook: body.id_pagina_facebook || null,
                token_facebook: body.token_facebook || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar cliente' },
            { status: 500 }
        );
    }
}

// DELETE client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('Clientes Chiquinho')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Cliente excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir cliente' },
            { status: 500 }
        );
    }
}
