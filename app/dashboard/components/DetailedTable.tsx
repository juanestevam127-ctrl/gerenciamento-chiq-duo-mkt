'use client';

import React, { useState, useMemo } from 'react';
import { 
    Search, ChevronUp, ChevronDown, CheckCircle, Clock, AlertTriangle, 
    XCircle, FileImage, Video, ExternalLink, Copy, AlertOctagon, Info, Layers
} from 'lucide-react';
import { Cliente, StoryProgressItem, DuplicidadeInfo } from '@/types/database';

export interface RowData {
    cliente: Cliente;
    status: 'posted' | 'partial' | 'late' | 'pending' | 'missed' | 'no_content';
    conteudos: string[];
    horaPostagem?: string;
    tipoPostado?: string;
    date: string;
    horaProgramada?: string;
    hasFacebook: boolean;
    // Feed & Stories detail
    needsFeed: boolean;
    needsStories: boolean;
    feedIgCount: number;
    feedFbCount: number;
    hasFeedPost: boolean;
    hasFeedFbPost: boolean;
    storiesTotal: number;
    storiesPostedIgCount: number;
    storiesPostedFbCount: number;
    storiesItems: StoryProgressItem[];
    // Duplicates
    duplicidades: DuplicidadeInfo[];
    hasDuplicates: boolean;
    isPartialStories: boolean;
}

export function DetailedTable({ data }: { data: RowData[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Counts for filter pills
    const counts = useMemo(() => {
        return {
            all: data.length,
            posted: data.filter(r => r.status === 'posted').length,
            late: data.filter(r => r.status === 'late' || r.status === 'missed').length,
            pending: data.filter(r => r.status === 'pending').length,
            partial: data.filter(r => r.isPartialStories || r.status === 'partial').length,
            duplicates: data.filter(r => r.hasDuplicates).length,
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(row => {
            const matchesSearch = 
                row.cliente.nome_cliente.toLowerCase().includes(search.toLowerCase()) ||
                row.cliente.username_instagram.toLowerCase().includes(search.toLowerCase()) ||
                row.cliente.id_instagram.toLowerCase().includes(search.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'posted') matchesStatus = row.status === 'posted';
            else if (statusFilter === 'late') matchesStatus = row.status === 'late' || row.status === 'missed';
            else if (statusFilter === 'pending') matchesStatus = row.status === 'pending';
            else if (statusFilter === 'partial') matchesStatus = row.isPartialStories || row.status === 'partial';
            else if (statusFilter === 'duplicates') matchesStatus = row.hasDuplicates;
            else matchesStatus = row.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [data, search, statusFilter]);

    const StatusBadge = ({ status, isPartial }: { status: string; isPartial?: boolean }) => {
        if (isPartial) {
            return (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex w-fit items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Stories Parciais
                </span>
            );
        }
        switch (status) {
            case 'posted':
                return (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 flex w-fit items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-400" /> Postado
                    </span>
                );
            case 'late':
                return (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex w-fit items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> Atrasado
                    </span>
                );
            case 'missed':
                return (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 flex w-fit items-center gap-1">
                        <XCircle className="w-3 h-3 text-orange-400" /> Não Postado
                    </span>
                );
            case 'pending':
                return (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex w-fit items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" /> Pendente
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 flex w-fit items-center gap-1">
                        Sem Conteúdo
                    </span>
                );
        }
    };

    return (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
            {/* Header & Filters */}
            <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Acompanhamento de Postagens por Loja
                            {counts.duplicates > 0 && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold animate-pulse flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" /> {counts.duplicates} duplicada(s)
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Controle individual de Stories e Feed, com detector de posts duplicados
                        </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar loja ou @username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            statusFilter === 'all'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        Todos ({counts.all})
                    </button>

                    <button
                        onClick={() => setStatusFilter('posted')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            statusFilter === 'posted'
                                ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        Postados ({counts.posted})
                    </button>

                    <button
                        onClick={() => setStatusFilter('late')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            statusFilter === 'late'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        Atrasados ({counts.late})
                    </button>

                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            statusFilter === 'pending'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        Pendentes ({counts.pending})
                    </button>

                    {counts.partial > 0 && (
                        <button
                            onClick={() => setStatusFilter('partial')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                                statusFilter === 'partial'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                        >
                            Stories Parciais ({counts.partial})
                        </button>
                    )}

                    <button
                        onClick={() => setStatusFilter('duplicates')}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                            statusFilter === 'duplicates'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : counts.duplicates > 0
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                                : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                        Duplicados ({counts.duplicates})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3.5">Cliente</th>
                            <th className="px-4 py-3.5">Feed (IG / FB)</th>
                            <th className="px-4 py-3.5">Stories (Imagens / Mídias)</th>
                            <th className="px-4 py-3.5">Horário / Status</th>
                            <th className="px-4 py-3.5 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-500">
                                    Nenhum cliente encontrado com os filtros atuais.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row) => {
                                const isExpanded = expandedRows.has(row.cliente.id);

                                return (
                                    <React.Fragment key={row.cliente.id}>
                                        <tr 
                                            onClick={() => toggleRow(row.cliente.id)}
                                            className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                                row.hasDuplicates ? 'bg-amber-500/[0.03]' : ''
                                            } ${isExpanded ? 'bg-white/[0.04]' : ''}`}
                                        >
                                            {/* Cliente */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="font-semibold text-white flex items-center gap-1.5">
                                                            {row.cliente.nome_cliente}
                                                            {row.hasFacebook && (
                                                                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono" title="Tem Facebook">
                                                                    FB
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-purple-400 font-medium">
                                                            @{row.cliente.username_instagram}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Alerta de Duplicidade na primeira coluna */}
                                                {row.hasDuplicates && (
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded w-fit">
                                                        <AlertOctagon className="w-3 h-3 text-amber-400 shrink-0" />
                                                        {row.duplicidades.length} alerta(s) de duplicado
                                                    </div>
                                                )}
                                            </td>

                                            {/* Feed */}
                                            <td className="px-4 py-3.5">
                                                {row.needsFeed ? (
                                                    <div className="flex flex-col gap-1">
                                                        {/* Feed Instagram */}
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-mono text-slate-400 w-5">IG:</span>
                                                            {row.feedIgCount > 0 ? (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                                                                    <CheckCircle className="w-2.5 h-2.5" /> Postado
                                                                    {row.feedIgCount > 1 && (
                                                                        <span className="bg-red-500 text-white px-1 rounded text-[9px] font-bold">
                                                                            {row.feedIgCount}x
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                                                                    Pendente
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Feed Facebook (se tiver) */}
                                                        {row.hasFacebook && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-mono text-blue-400 w-5">FB:</span>
                                                                {row.feedFbCount > 0 ? (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                                                                        <CheckCircle className="w-2.5 h-2.5" /> Postado
                                                                        {row.feedFbCount > 1 && (
                                                                            <span className="bg-red-500 text-white px-1 rounded text-[9px] font-bold">
                                                                                {row.feedFbCount}x
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                                                                        Pendente
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>

                                            {/* Stories Granular */}
                                            <td className="px-4 py-3.5">
                                                {row.needsStories ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        {/* Instagram Stories */}
                                                        <div>
                                                            <div className="flex items-center justify-between text-[10px] mb-1">
                                                                <span className="text-purple-400 font-mono flex items-center gap-1">
                                                                    Stories IG:
                                                                </span>
                                                                <span className={`font-bold ${
                                                                    row.storiesPostedIgCount >= row.storiesTotal && row.storiesTotal > 0
                                                                        ? 'text-green-400'
                                                                        : row.storiesPostedIgCount > 0
                                                                        ? 'text-amber-400'
                                                                        : 'text-slate-400'
                                                                }`}>
                                                                    {row.storiesPostedIgCount}/{row.storiesTotal}
                                                                </span>
                                                            </div>
                                                            <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all ${
                                                                        row.storiesPostedIgCount >= row.storiesTotal && row.storiesTotal > 0
                                                                            ? 'bg-green-500'
                                                                            : 'bg-purple-500'
                                                                    }`}
                                                                    style={{ 
                                                                        width: `${row.storiesTotal > 0 
                                                                            ? Math.min(100, (row.storiesPostedIgCount / row.storiesTotal) * 100) 
                                                                            : 0}%` 
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Facebook Stories (se tiver) */}
                                                        {row.hasFacebook && (
                                                            <div>
                                                                <div className="flex items-center justify-between text-[10px] mb-1">
                                                                    <span className="text-blue-400 font-mono flex items-center gap-1">
                                                                        Stories FB:
                                                                    </span>
                                                                    <span className={`font-bold ${
                                                                        row.storiesPostedFbCount >= row.storiesTotal && row.storiesTotal > 0
                                                                            ? 'text-green-400'
                                                                            : row.storiesPostedFbCount > 0
                                                                            ? 'text-amber-400'
                                                                            : 'text-slate-400'
                                                                    }`}>
                                                                        {row.storiesPostedFbCount}/{row.storiesTotal}
                                                                    </span>
                                                                </div>
                                                                <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all ${
                                                                            row.storiesPostedFbCount >= row.storiesTotal && row.storiesTotal > 0
                                                                                ? 'bg-green-500'
                                                                                : 'bg-blue-500'
                                                                        }`}
                                                                        style={{ 
                                                                            width: `${row.storiesTotal > 0 
                                                                                ? Math.min(100, (row.storiesPostedFbCount / row.storiesTotal) * 100) 
                                                                                : 0}%` 
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>

                                            {/* Horário / Status */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <StatusBadge status={row.status} isPartial={row.isPartialStories} />
                                                    {row.horaProgramada && (
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                                            <Clock className="w-2.5 h-2.5" /> Programado: {row.horaProgramada}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Ação (Expandir) */}
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRow(row.cliente.id);
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all inline-flex items-center gap-1 ${
                                                        isExpanded 
                                                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                                                            : row.hasDuplicates
                                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                                >
                                                    {isExpanded ? (
                                                        <>Fechar <ChevronUp className="w-3.5 h-3.5" /></>
                                                    ) : (
                                                        <>Conferir <ChevronDown className="w-3.5 h-3.5" /></>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* EXPANDED ROW: DETALHES DE STORIES E DUPLICADOS */}
                                        {isExpanded && (
                                            <tr className="bg-slate-900/90 border-t border-b border-purple-500/20">
                                                <td colSpan={5} className="p-4 sm:p-6">
                                                    <div className="flex flex-col gap-5">
                                                        
                                                        {/* ALERTA DE DUPLICADOS (Se houver) */}
                                                        {row.hasDuplicates && (
                                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2">
                                                                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                                                                    <AlertOctagon className="w-4 h-4 text-red-400" />
                                                                    Postagens Duplicadas Detectadas no Banco de Dados
                                                                </div>
                                                                <p className="text-xs text-slate-300">
                                                                    Esta loja possui registros repetidos na tabela de controle. Verifique os IDs abaixo no NocoDB:
                                                                </p>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                                                    {row.duplicidades.map((dup, dIdx) => (
                                                                        <div key={dIdx} className="p-2.5 rounded-lg bg-black/40 border border-red-500/20 flex flex-col gap-1 text-xs">
                                                                            <span className="font-semibold text-red-300">
                                                                                {dup.descricao}
                                                                            </span>
                                                                            <span className="text-[11px] text-slate-400">
                                                                                IDs no NocoDB: <strong className="text-white font-mono">{dup.ids.join(', ')}</strong>
                                                                            </span>
                                                                            {dup.conteudo_postado && (
                                                                                <a 
                                                                                    href={dup.conteudo_postado}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-[10px] text-purple-400 truncate hover:underline flex items-center gap-1"
                                                                                >
                                                                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                                                                    {dup.conteudo_postado}
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* CONFERÊNCIA DE STORIES MÍDIA POR MÍDIA */}
                                                        {row.storiesItems.length > 0 ? (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Layers className="w-4 h-4 text-purple-400" />
                                                                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                                                            Conferência dos Stories ({row.storiesItems.length} mídias agendadas)
                                                                        </h4>
                                                                    </div>
                                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                                        Postados: IG ({row.storiesPostedIgCount}/{row.storiesTotal})
                                                                        {row.hasFacebook && ` | FB (${row.storiesPostedFbCount}/{row.storiesTotal})`}
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                                                    {row.storiesItems.map((story) => {
                                                                        const isVideo = story.url.endsWith('.mp4') || story.url.endsWith('.mov') || story.url.includes('video');

                                                                        return (
                                                                            <div 
                                                                                key={story.index}
                                                                                className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                                                                                    story.postedIg && (!row.hasFacebook || story.postedFb)
                                                                                        ? 'bg-green-500/5 border-green-500/25'
                                                                                        : story.postedIg || story.postedFb
                                                                                        ? 'bg-amber-500/5 border-amber-500/25'
                                                                                        : 'bg-slate-800/40 border-white/5 opacity-80'
                                                                                }`}
                                                                            >
                                                                                {/* Top info */}
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[11px] font-bold text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">
                                                                                        #{story.index}
                                                                                    </span>
                                                                                    <a
                                                                                        href={story.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-slate-400 hover:text-purple-300"
                                                                                        title="Ver mídia original"
                                                                                    >
                                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                                    </a>
                                                                                </div>

                                                                                {/* Media icon or preview */}
                                                                                <div className="aspect-[9/16] bg-black/60 rounded-lg overflow-hidden flex items-center justify-center relative border border-white/5 group">
                                                                                    {isVideo ? (
                                                                                        <div className="flex flex-col items-center gap-1 text-slate-400">
                                                                                            <Video className="w-6 h-6 text-purple-400" />
                                                                                            <span className="text-[9px] uppercase font-bold">Vídeo</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <img
                                                                                            src={story.url}
                                                                                            alt={`Story ${story.index}`}
                                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                                            loading="lazy"
                                                                                        />
                                                                                    )}
                                                                                </div>

                                                                                {/* Status Badges */}
                                                                                <div className="flex flex-col gap-1 pt-1">
                                                                                    {/* Instagram */}
                                                                                    <div className="flex items-center justify-between text-[10px]">
                                                                                        <span className="text-purple-400 font-mono">IG:</span>
                                                                                        {story.postedIg ? (
                                                                                            <span className="text-green-400 font-bold flex items-center gap-0.5">
                                                                                                ✓ Postado
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-slate-500">
                                                                                                Pendente
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Facebook */}
                                                                                    {row.hasFacebook && (
                                                                                        <div className="flex items-center justify-between text-[10px]">
                                                                                            <span className="text-blue-400 font-mono">FB:</span>
                                                                                            {story.postedFb ? (
                                                                                                <span className="text-green-400 font-bold flex items-center gap-0.5">
                                                                                                    ✓ Postado
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-slate-500">
                                                                                                    Pendente
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : row.needsStories ? (
                                                            <div className="text-xs text-slate-400 italic">
                                                                Nenhum story individual cadastrado no array para conferência detalhada.
                                                            </div>
                                                        ) : null}

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
