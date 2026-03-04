import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('Controle de Postagens - Clientes Chiquinho')
            .select('*')
            .eq('data_postagem', date);

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching control data:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados de controle', details: error.message },
            { status: 500 }
        );
    }
}
