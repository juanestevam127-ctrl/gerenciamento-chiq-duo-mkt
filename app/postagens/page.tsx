'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { Cliente } from '@/types/database';

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

const today = new Date().toISOString().split('T')[0];

export default function PostagensPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [postagens, setPostagens] = useState<PostagemRow[]>([]);
    const [selectedCliente, setSelectedCliente] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClientes();
    }, []);

    useEffect(() => {
        fetchPostagens();
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

    const hasFilters = selectedCliente || startDate || endDate;

    return (
        <div className="min-h-screen text-slate-200 bg-transparent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Controle de Postagens
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">Histórico de todas as postagens realizadas.</p>
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

            {/* Results Table */}
            <div className="glass-card rounded-xl overflow-x-auto">
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
                        <div className="px-6 py-3 bg-slate-900/30 border-b border-white/5 text-xs text-slate-500">
                            {postagens.length} postagem{postagens.length !== 1 ? 'ns' : ''} encontrada{postagens.length !== 1 ? 's' : ''}
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs font-medium border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Descrição do Conteúdo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {postagens.map((post) => (
                                    <tr key={post.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                            {format(new Date(post.data_postagem + 'T12:00:00'), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-purple-400 font-medium">
                                            @{resolveUsername(post)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${post.tipo_postagem === 'FEED'
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                                : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                                                }`}>
                                                {post.tipo_postagem}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                                            {post.conteudo?.descricao
                                                ? <span title={post.conteudo.descricao}>{post.conteudo.descricao}</span>
                                                : <span className="text-slate-600 italic">Sem descrição</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}
