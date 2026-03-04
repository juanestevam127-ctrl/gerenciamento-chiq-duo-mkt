'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryData {
    date: string;
    postados: number;
    atrasados: number;
}

export function HistoryChart({ data }: { data: HistoryData[] }) {
    const formattedData = data.map(item => ({
        ...item,
        displayDate: format(parseISO(item.date), 'dd/MM', { locale: ptBR })
    }));

    return (
        <div className="glass-card p-6 rounded-xl h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Diária</h3>
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={formattedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend />
                        <Bar dataKey="postados" name="Postados" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="atrasados" name="Atrasados/Não Postados" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
