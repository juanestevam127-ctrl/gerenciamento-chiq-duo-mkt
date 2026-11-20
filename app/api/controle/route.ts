import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

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

        const data = await nocodb.controlePostagens.list({ date });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching control data from NocoDB:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados de controle', details: error.message },
            { status: 500 }
        );
    }
}
