import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

// GET single client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cliente = await nocodb.clientes.getById(id);

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(cliente);
    } catch (error: any) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar cliente', details: error.message },
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

        const updated = await nocodb.clientes.update(id, {
            nome_cliente: body.nome_cliente,
            username_instagram: body.username_instagram,
            id_instagram: body.id_instagram,
            horario_postagem: body.horario_postagem || null,
            token: body.token || null,
            webhook: body.webhook || null,
            id_pagina_facebook: body.id_pagina_facebook || null,
            token_facebook: body.token_facebook || null,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar cliente', details: error.message },
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
        await nocodb.clientes.delete(id);
        return NextResponse.json({ message: 'Cliente excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir cliente', details: error.message },
            { status: 500 }
        );
    }
}
