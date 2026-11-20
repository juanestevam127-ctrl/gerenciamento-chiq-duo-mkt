import { NextRequest, NextResponse } from 'next/server';
import { nocodb } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const targetStartDate = startDate || date || new Date().toISOString().split('T')[0];
        const targetEndDate = endDate || date || new Date().toISOString().split('T')[0];

        console.log(`API GET /api/dashboard/data: Fetching for ${targetStartDate} to ${targetEndDate} from NocoDB...`);

        // Fetch in parallel: clients, content for date range, and posts for date range
        const [clientes, conteudos, postagens] = await Promise.all([
            nocodb.clientes.list(),
            nocodb.conteudos.list({
                startDate: targetStartDate,
                endDate: targetEndDate,
            }),
            nocodb.controlePostagens.list({
                startDate: targetStartDate,
                endDate: targetEndDate,
            }),
        ]);

        console.log(`API GET /api/dashboard/data: Success! Clientes: ${clientes.length}, Conteudos: ${conteudos.length}, Postagens: ${postagens.length}`);

        return NextResponse.json({
            clientes,
            conteudos,
            postagens,
        });
    } catch (error: any) {
        console.error('Error in dashboard data API:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do dashboard', details: error.message },
            { status: 500 }
        );
    }
}
