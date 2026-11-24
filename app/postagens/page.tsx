'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, X, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Cliente } from '@/types/database';
import { getTodayBrazil } from '@/lib/utils';

interface PostagemRow {
    id: string;
    data_postagem: string;
    id_instagram: string;
    tipo_postagem: 'FEED' | 'STORIES';
    conteudo_id?: string;
    created_at: string;
    // From content join (if available)
    conteudo?: { descricao?: string };
    // From Supabase FK join (if configured), or manually matched
    cliente?: { username_instagram: string; nome_cliente: string };
}

const today = getTodayBrazil();

export default function PostagensPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [postagens, setPostagens] = useState<PostagemRow[]>([]);
    const [selectedCliente, setSelectedCliente] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Multi-selection & delete states
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchClientes();
    }, []);

    useEffect(() => {
        fetchPostagens();
        setSelectedIds(new Set()); // Reset selections on filter change
    }, [selectedCliente, startDate, endDate]);

    const fetchClientes = async () => {
        try {
            const response = await fetch('/api/clientes');
            const data = await response.json();
            if (Array.isArray(data)) setClientes(data);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    const fetchPostagens = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCliente) params.set('cliente_id', selectedCliente);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const url = params.toString() ? `/api/postagens?${params}` : '/api/postagens';
            const response = await fetch(url);
            const data = await response.json();
            if (Array.isArray(data)) setPostagens(data);
        } catch (error) {
            console.error('Erro ao carregar postagens:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Resolve username: prefer joined data, else look up from clientes list
    const resolveUsername = (post: PostagemRow): string => {
        if (post.cliente?.username_instagram) return post.cliente.username_instagram;
        const match = clientes.find(c => c.id_instagram === post.id_instagram);
        return match?.username_instagram || post.id_instagram;
    };

    const clearFilters = () => {
        setSelectedCliente('');
        setStartDate('');
        setEndDate('');
    };

    const formatPostDate = (dateStr: string) => {
        try {
            if (!dateStr) return '-';
            return format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy');
        } catch {
            return dateStr;
        }
    };

    // Selection handlers
    const isAllSelected = postagens.length > 0 && postagens.every(p => selectedIds.has(p.id));

    const handleToggleAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(postagens.map(p => p.id)));
        }
    };

    const handleToggleOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Delete single postagem
    const handleDeleteOne = async (post: PostagemRow) => {
        const clientName = post.cliente?.nome_cliente || `@${resolveUsername(post)}`;
        const dateFormatted = formatPostDate(post.data_postagem);

        if (!confirm(`Deseja realmente excluir a postagem de ${post.tipo_postagem} da loja "${clientName}" (${dateFormatted})?\n\nEsta postagem será removida permanentemente do controle.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/postagens', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: post.id }),
            });
            const data = await res.json();
            if (res.ok) {
                setPostagens(prev => prev.filter(p => p.id !== post.id));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(post.id);
                    return next;
                });
                setFeedback({
                    type: 'success',
                    text: `Postagem de ${post.tipo_postagem} (${clientName}) excluída com sucesso!`,
                });
                setTimeout(() => setFeedback(null), 4000);
            } else {
                alert(data.error || 'Erro ao excluir postagem');
            }
        } catch (err) {
            console.error('Erro ao excluir postagem:', err);
            alert('Erro de conexão ao excluir postagem');
        } finally {
            setIsDeleting(false);
        }
    };

    // Delete multiple selected postagens
    const handleDeleteSelected = async () => {
        const count = selectedIds.size;
        if (count === 0) return;

        if (!confirm(`Deseja realmente excluir as ${count} postagem(ns) selecionada(s)?\n\nEssa ação removerá os registros do banco de dados e não pode ser desfeita.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/postagens', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });
            const data = await res.json();
            if (res.ok) {
                setPostagens(prev => prev.filter(p => !selectedIds.has(p.id)));
                setSelectedIds(new Set());
                setFeedback({
                    type: 'success',
                    text: `${count} postagem(ns) excluída(s) com sucesso!`,
                });
                setTimeout(() => setFeedback(null), 4000);
            } else {
                alert(data.error || 'Erro ao excluir postagens');
            }
        } catch (err) {
            console.error('Erro ao excluir selecionadas:', err);
            alert('Erro de conexão ao excluir postagens selecionadas');
        } finally {
            setIsDeleting(false);
        }
    };

    const hasFilters = selectedCliente || startDate || endDate;

    return (
        <div className="min-h-screen text-slate-200 bg-transparent">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Controle de Postagens
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                        Histórico de todas as postagens realizadas. Você pode selecionar e excluir registros individuais ou em lote.
                    </p>
                </div>
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors w-full sm:w-auto justify-center"
                    >
                        <X className="h-3.5 w-3.5" />
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Feedback Toast Banner */}
            {feedback && (
                <div className={`p-4 rounded-xl mb-6 flex items-center justify-between gap-3 border shadow-lg animate-in fade-in ${
                    feedback.type === 'success'
                        ? 'bg-green-500/15 border-green-500/30 text-green-300'
                        : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        {feedback.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <span>{feedback.text}</span>
                    </div>
                    <button 
                        onClick={() => setFeedback(null)} 
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card p-4 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter className="h-5 w-5" />
                    <span className="text-sm font-medium">Filtrar:</span>
                </div>

                <div className="grid grid-cols-1 md:flex md:items-center gap-3 w-full">
                    {/* Client filter */}
                    <select
                        value={selectedCliente}
                        onChange={(e) => setSelectedCliente(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:min-w-[200px]"
                    >
                        <option value="">Todos os Clientes</option>
                        {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id_instagram}>
                                @{cliente.username_instagram}
                            </option>
                        ))}
                    </select>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Date range filter */}
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-slate-400 text-xs sm:text-sm whitespace-nowrap">De:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark] w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-slate-400 text-xs sm:text-sm whitespace-nowrap">Até:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark] w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Action Bar (Visible when 1 or more items are selected) */}
            {selectedIds.size > 0 && (
                <div className="bg-purple-900/40 border border-purple-500/40 rounded-xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-sm animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <span className="bg-purple-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {selectedIds.size}
                        </span>
                        <span className="text-sm font-semibold text-white">
                            postagem{selectedIds.size > 1 ? 'ns' : ''} selecionada{selectedIds.size > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            disabled={isDeleting}
                            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors font-medium"
                        >
                            Desmarcar todas
                        </button>
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
                        >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Excluir {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="glass-card rounded-xl overflow-x-auto border border-white/5">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
                        Carregando...
                    </div>
                ) : postagens.length === 0 ? (
                    <div className="p-16 text-center">
                        <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">Nenhuma postagem encontrada.</p>
                        {hasFilters && (
                            <p className="text-slate-500 text-sm mt-2">Tente ajustar os filtros.</p>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-3 bg-slate-900/30 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                {postagens.length} postagem{postagens.length !== 1 ? 'ns' : ''} encontrada{postagens.length !== 1 ? 's' : ''}
                            </span>
                            {selectedIds.size > 0 && (
                                <span className="text-purple-300 font-medium">
                                    {selectedIds.size} de {postagens.length} selecionada(s)
                                </span>
                            )}
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs font-medium border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleToggleAll}
                                            title={isAllSelected ? "Desmarcar todas" : "Selecionar todas as visíveis"}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                        />
                                    </th>
                                    <th className="px-4 py-4">Data</th>
                                    <th className="px-4 py-4">Cliente</th>
                                    <th className="px-4 py-4">Tipo</th>
                                    <th className="px-4 py-4">Descrição do Conteúdo</th>
                                    <th className="px-4 py-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {postagens.map((post) => {
                                    const isSelected = selectedIds.has(post.id);

                                    return (
                                        <tr 
                                            key={post.id} 
                                            className={`transition-colors ${
                                                isSelected 
                                                    ? 'bg-purple-600/10 hover:bg-purple-600/15' 
                                                    : 'hover:bg-white/5'
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleOne(post.id)}
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                                />
                                            </td>

                                            {/* Data */}
                                            <td className="px-4 py-4 whitespace-nowrap text-white font-medium">
                                                {formatPostDate(post.data_postagem)}
                                            </td>

                                            {/* Cliente */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{post.cliente?.nome_cliente || '-'}</span>
                                                    <span className="text-xs text-purple-400 font-medium">@{resolveUsername(post)}</span>
                                                </div>
                                            </td>

                                            {/* Tipo */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                                                    post.tipo_postagem === 'FEED'
                                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                                        : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                                                }`}>
                                                    {post.tipo_postagem}
                                                </span>
                                            </td>

                                            {/* Descrição do Conteúdo */}
                                            <td className="px-4 py-4 text-slate-300 max-w-xs truncate">
                                                {post.conteudo?.descricao
                                                    ? <span title={post.conteudo.descricao}>{post.conteudo.descricao}</span>
                                                    : <span className="text-slate-600 italic">Sem descrição</span>}
                                            </td>

                                            {/* Ação: Excluir */}
                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => handleDeleteOne(post)}
                                                    disabled={isDeleting}
                                                    title="Excluir esta postagem do controle"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all inline-flex items-center gap-1.5 text-xs font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                    <span className="text-red-300">Excluir</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}
