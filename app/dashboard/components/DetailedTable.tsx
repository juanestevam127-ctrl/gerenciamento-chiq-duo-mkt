'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, CheckCircle, Clock, AlertTriangle, XCircle, FileImage, Layers, Video } from 'lucide-react';
import { Cliente, Conteudo } from '@/types/database';
import { format } from 'date-fns';

interface RowData {
    cliente: Cliente;
    status: 'posted' | 'late' | 'pending' | 'missed' | 'no_content';
    conteudos: string[];
    horaPostagem?: string;
    tipoPostado?: string;
}

export function DetailedTable({ data }: { data: RowData[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredData = useMemo(() => {
        return data.filter(row => {
            const matchesSearch = row.cliente.nome_cliente.toLowerCase().includes(search.toLowerCase()) ||
                row.cliente.id_instagram.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, search, statusFilter]);

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'posted': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 flex w-fit items-center gap-1"><CheckCircle className="w-3 h-3" /> Postado</span>;
            case 'late': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex w-fit items-center gap-1"><AlertTriangle className="w-3 h-3" /> Atrasado</span>;
            case 'pending': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex w-fit items-center gap-1"><Clock className="w-3 h-3" /> Pendente</span>;
            case 'missed': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 flex w-fit items-center gap-1"><XCircle className="w-3 h-3" /> Não Postou</span>;
            default: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30">-</span>;
        }
    };

    return (
        <div className="glass-card rounded-xl overflow-hidden mt-6">
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-white">Detalhamento Geral</h3>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="posted">Postados</option>
                        <option value="late">Atrasados</option>
                        <option value="pending">Pendentes</option>
                        <option value="missed">Não Postados</option>
                        <option value="no_content">Sem Conteúdo</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs font-medium">
                        <tr>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Horário</th>
                            <th className="px-6 py-3">Conteúdo Disp.</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Postado às</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredData.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                        ) : (
                            filteredData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div>{row.cliente.nome_cliente}</div>
                                        <div className="text-xs text-purple-400">@{row.cliente.username_instagram}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-300">{row.cliente.horario_postagem || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {row.conteudos.includes('IMAGEM') && <div title="Imagem"><FileImage className="w-4 h-4 text-slate-400" /></div>}
                                            {row.conteudos.includes('CARROSSEL') && <div title="Carrossel"><Layers className="w-4 h-4 text-slate-400" /></div>}
                                            {row.conteudos.includes('REELS') && <div title="Reels"><Video className="w-4 h-4 text-slate-400" /></div>}
                                            {row.conteudos.length === 0 && <span className="text-xs text-slate-600">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={row.status} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {row.horaPostagem ? format(new Date(row.horaPostagem), 'HH:mm') : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-white/10 text-center text-xs text-slate-500">
                Mostrando {filteredData.length} registros
            </div>
        </div>
    );
}
