'use client';

import { useState } from 'react';
import { Send, Loader2, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { Cliente } from '@/types/database';

interface DelayedClient {
    cliente: Cliente;
    horaProgramada: string | null;
    conteudos: string[];
}

export function DelayedWebhookTrigger({ clients }: { clients: DelayedClient[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [firing, setFiring] = useState(false);
    const [result, setResult] = useState<{ success: number; total: number; summary?: any[] } | null>(null);
    const [error, setError] = useState('');

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === clients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(clients.map(c => c.cliente.id)));
        }
    };

    const handleTrigger = async () => {
        if (selectedIds.size === 0) return;

        setFiring(true);
        setResult(null);
        setError('');

        const targets = clients
            .filter(c => selectedIds.has(c.cliente.id) && c.cliente.webhook)
            .map(c => ({ clienteId: c.cliente.id, webhookUrl: c.cliente.webhook! }));

        if (targets.length === 0) {
            setError('Nenhum dos clientes selecionados possui webhook configurado.');
            setFiring(false);
            return;
        }

        try {
            const res = await fetch('/api/webhook-trigger', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ success: data.successCount, total: data.total, summary: data.summary });
                // Limpar seleção após sucesso parcial ou total
                if (data.successCount > 0) {
                    setSelectedIds(new Set());
                }
            } else {
                setError(data.error || 'Erro ao disparar webhooks');
            }
        } catch {
            setError('Erro de conexão');
        } finally {
            setFiring(false);
        }
    };

    if (clients.length === 0) {
        return (
            <div className="glass-card rounded-xl p-6 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Nenhum lead em atraso no momento.</p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-white/10 bg-slate-900/30 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white">Webhook (Atrasados)</h3>
                    <p className="text-xs text-slate-400 mt-1">Dispare webhooks em massa para leads atrasados</p>
                </div>
                <button
                    onClick={handleTrigger}
                    disabled={firing || selectedIds.size === 0}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                >
                    {firing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Disparar Selecionados ({selectedIds.size})
                </button>
            </div>

            {error && (
                <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400">
                    {error}
                </div>
            )}

            {result && (
                <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 text-xs text-green-400">
                    ✓ Sucesso: {result.success}/{result.total} webhooks disparados.
                </div>
            )}

            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <button onClick={toggleSelectAll} className="text-slate-500 hover:text-purple-400 transition-colors">
                                    {selectedIds.size === clients.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                            </th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Horário</th>
                            <th className="px-4 py-3">Webhook</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {clients.map(({ cliente, horaProgramada }) => {
                            const rowResult = result?.summary?.find(s => s.clienteId === cliente.id);

                            return (
                                <tr
                                    key={cliente.id}
                                    className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedIds.has(cliente.id) ? 'bg-purple-500/5' : ''}`}
                                    onClick={() => toggleSelect(cliente.id)}
                                >
                                    <td className="px-4 py-3">
                                        <div className={`transition-colors ${selectedIds.has(cliente.id) ? 'text-purple-400' : 'text-slate-600'}`}>
                                            {selectedIds.has(cliente.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-white font-medium">{cliente.nome_cliente}</div>
                                        <div className="text-xs text-purple-400">@{cliente.username_instagram}</div>
                                    </td>
                                    <td className="px-4 py-3 text-red-400 text-xs font-mono">
                                        {horaProgramada}
                                    </td>
                                    <td className="px-4 py-3">
                                        {cliente.webhook ? (
                                            <div className="text-[10px] text-slate-500 truncate max-w-[120px]" title={cliente.webhook}>
                                                {cliente.webhook}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-red-500/60 italic">Não configurado</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {rowResult ? (
                                            <span className={`text-[10px] font-bold ${rowResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                                                {rowResult.ok ? 'OK' : `Falha (${rowResult.status || '?'})`}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-600">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
