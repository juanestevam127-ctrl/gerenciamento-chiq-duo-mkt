'use client';

import { Users, CheckCircle, Clock, AlertTriangle, XCircle, PieChart, Copy } from 'lucide-react';

interface Stats {
    totalClientes: number;
    postados: number;
    atrasados: number;
    pendentes: number;
    semConteudo: number;
    taxaPostagem: number;
    isHoje: boolean;
    duplicados?: number;
    storiesIncompletos?: number;
}

export function KPICards({ stats }: { stats: Stats }) {
    const hasDuplicates = (stats.duplicados ?? 0) > 0;

    return (
        <div className={`grid grid-cols-2 md:grid-cols-3 ${hasDuplicates ? 'xl:grid-cols-7' : 'xl:grid-cols-6'} gap-4 mb-6`}>
            <div className="glass-card p-4 rounded-xl flex flex-col justify-between h-28">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Clientes</p>
                    <Users className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalClientes}</p>
            </div>

            <div className="glass-card p-4 rounded-xl border-t-2 border-t-green-500 flex flex-col justify-between h-28">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-green-400 uppercase tracking-wider">Postados</p>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-green-100">{stats.postados}</p>
                    <span className="text-xs text-green-400 font-medium">({stats.taxaPostagem}%)</span>
                </div>
            </div>

            <div className="glass-card p-4 rounded-xl border-t-2 border-t-red-500 flex flex-col justify-between h-28">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-red-400 uppercase tracking-wider">Atrasados</p>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-100">{stats.atrasados}</p>
            </div>

            {stats.isHoje && (
                <div className="glass-card p-4 rounded-xl border-t-2 border-t-blue-500 flex flex-col justify-between h-28">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Pendentes</p>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-blue-100">{stats.pendentes}</p>
                </div>
            )}

            {!stats.isHoje && (
                <div className="glass-card p-4 rounded-xl border-t-2 border-t-orange-500 flex flex-col justify-between h-28">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-orange-400 uppercase tracking-wider">Não Postado</p>
                        <XCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-100">{stats.pendentes + stats.atrasados}</p>
                </div>
            )}

            <div className="glass-card p-4 rounded-xl border-t-2 border-t-slate-500 flex flex-col justify-between h-28">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sem Conteúdo</p>
                    <PieChart className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-3xl font-bold text-slate-200">{stats.semConteudo}</p>
            </div>

            {hasDuplicates && (
                <div className="glass-card p-4 rounded-xl border-t-2 border-t-amber-500 bg-amber-500/5 flex flex-col justify-between h-28 animate-pulse">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Duplicados</p>
                        <Copy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-amber-300">{stats.duplicados}</p>
                        <span className="text-[10px] text-amber-400 font-medium">loja(s)</span>
                    </div>
                </div>
            )}
        </div>
    );
}
