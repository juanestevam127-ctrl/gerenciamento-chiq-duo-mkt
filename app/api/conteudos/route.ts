import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all content
export async function GET() {
    try {
        console.log('API GET /api/conteudos: Fetching from Supabase...');
        const { data, error } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .select('*')
            .order('data_postagem', { ascending: false });

        if (error) {
            console.error('Supabase error fetching content:', error);
            throw error;
        }

        console.log('API GET /api/conteudos: Success, found', data?.length || 0, 'items');
        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching content:', error);
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
        console.log('API POST /api/conteudos: Creating new content with body:', JSON.stringify(body, null, 2));

        const { data, error } = await supabase
            .from('Conteúdos Chiquinho Sorvetes')
            .insert([{
                data_postagem: body.data_postagem,
                descricao: body.descricao || null,
                imagem_estatica: body.imagem_estatica || null,
                carrossel: body.carrossel || null,
                reels: body.reels || null,
                stories: body.stories || null,
                id_instagram: body.id_instagram || null,
            }])
            .select();

        if (error) {
            console.error('Supabase error creating content:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('Nenhum dado retornado após a inserção');
        }

        console.log('API POST /api/conteudos: Success, created item:', data[0].id);
        return NextResponse.json(data[0], { status: 201 });
    } catch (error: any) {
        console.error('Error creating content:', error);
        return NextResponse.json(
            { error: 'Erro ao criar conteúdo', details: error.message },
            { status: 500 }
        );
    }
}
