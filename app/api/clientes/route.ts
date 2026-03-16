import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all clients
export async function GET() {
    try {
        console.log('API GET /api/clientes: Fetching from Supabase...');
        const { data, error } = await supabase
            .from('Clientes Chiquinho')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching clients:', error);
            throw error;
        }

        console.log('API GET /api/clientes: Success, found', data?.length || 0, 'clients');
        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching clients:', error);
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

        const { data, error } = await supabase
            .from('Clientes Chiquinho')
            .insert([{
                nome_cliente: body.nome_cliente,
                username_instagram: body.username_instagram,
                id_instagram: body.id_instagram,
                horario_postagem: body.horario_postagem || null,
                token: body.token || null,
                webhook: body.webhook || null,
                id_pagina_facebook: body.id_pagina_facebook || null,
                token_facebook: body.token_facebook || null,
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('Error creating client:', error);

        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'ID do Instagram já cadastrado' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erro ao criar cliente' },
            { status: 500 }
        );
    }
}
