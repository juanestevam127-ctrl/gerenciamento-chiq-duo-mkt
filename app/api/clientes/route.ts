import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

// GET all clients
export async function GET() {
    try {
        console.log('API GET /api/clientes: Fetching from NocoDB...');
        const clientes = await nocodb.clientes.list();
        console.log('API GET /api/clientes: Success, found', clientes.length, 'clients');
        return NextResponse.json(clientes);
    } catch (error: any) {
        console.error('Error fetching clients from NocoDB:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar clientes', details: error.message },
            { status: 500 }
        );
    }
}

// POST new client
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.nome_cliente || !body.username_instagram || !body.id_instagram) {
            return NextResponse.json(
                { error: 'Nome, Username e ID do Instagram são obrigatórios' },
                { status: 400 }
            );
        }

        const newClient = await nocodb.clientes.create({
            nome_cliente: body.nome_cliente,
            username_instagram: body.username_instagram,
            id_instagram: body.id_instagram,
            horario_postagem: body.horario_postagem || null,
            token: body.token || null,
            webhook: body.webhook || null,
            id_pagina_facebook: body.id_pagina_facebook || null,
            token_facebook: body.token_facebook || null,
        });

        return NextResponse.json(newClient, { status: 201 });
    } catch (error: any) {
        console.error('Error creating client in NocoDB:', error);
        return NextResponse.json(
            { error: 'Erro ao criar cliente', details: error.message },
            { status: 500 }
        );
    }
}
