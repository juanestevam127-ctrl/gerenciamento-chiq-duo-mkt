'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Send, Loader2 } from 'lucide-react';
import { Cliente } from '@/types/database';

interface AlertItemProps {
    cliente: Cliente;
    status: 'late' | 'pending';
    horaProgramada: string | null;
    conteudos: string[];
}

function AlertItem({
    cliente,
    status,
    horaProgramada,
    conteudos,
    onWebhookSent,
}: AlertItemProps & { onWebhookSent: (id: string) => void }) {
    const [firing, setFiring] = useState(false);
    const [fired, setFired] = useState(false);
    const [error, setError] = useState('');

    const fireWebhook = async () => {
        if (!cliente.webhook) return;
        setFiring(true);
        setError('');
        try {
            const res = await fetch('/api/webhook-trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clienteId: cliente.id,
                    webhookUrl: cliente.webhook,
                    trigger: 'manual_start',
                    timestamp: new Date().toISOString()
                }),
            });
            if (res.ok) {
                setFired(true);
                onWebhookSent(cliente.id);
            } else {
                const data = await res.json();
                setError(data.error || 'Erro ao disparar');
            }
        } catch {
            setError('Erro de conexão');
        } finally {
            setFiring(false);
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border mb-2 ${status === 'late'
            ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
            : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15'
            } transition-colors`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-full shrink-0 ${status === 'late' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {status === 'late' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                    <h4 className="text-white font-medium text-sm truncate">{cliente.nome_cliente}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        {status === 'late' ? (
                            <span className="text-red-300">Atrasado (Era às {horaProgramada})</span>
                        ) : (
                            <span className="text-blue-300">Aguardando {horaProgramada}</span>
                        )}
                        {conteudos.length > 0 && (
                            <>
                                <span>•</span>
                                <span>{conteudos.join(', ')}</span>
                            </>
                        )}
                    </div>
                    {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
                </div>
            </div>

            {status === 'late' && cliente.webhook && (
                <button
                    onClick={fireWebhook}
                    disabled={firing || fired}
                    title={fired ? 'Webhook disparado!' : 'Disparar webhook'}
                    className={`ml-2 shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${fired
                        ? 'bg-green-600/30 text-green-300 border border-green-500/30 cursor-default'
                        : 'bg-red-600/80 text-white hover:bg-red-600 border border-red-500/50 disabled:opacity-60'
                        }`}
                >
                    {firing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : fired ? (
                        <>✓ Enviado</>
                    ) : (
                        <>
                            <Send className="w-3.5 h-3.5" />
                            Start
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export function AlertsList({ alerts }: { alerts: AlertItemProps[] }) {
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [bulkFiring, setBulkFiring] = useState(false);
    const [bulkResult, setBulkResult] = useState('');

    const late = alerts.filter(a => a.status === 'late');
    const pending = alerts.filter(a => a.status === 'pending');

    const lateWithWebhook = late.filter(a => a.cliente.webhook);

    const markSent = (id: string) => setSentIds(prev => new Set([...prev, id]));

    const fireAllWebhooks = async () => {
        const targets = lateWithWebhook
            .filter(a => !sentIds.has(a.cliente.id))
            .map(a => ({ clienteId: a.cliente.id, webhookUrl: a.cliente.webhook! }));

        if (targets.length === 0) return;

        setBulkFiring(true);
        setBulkResult('');
        try {
            const res = await fetch('/api/webhook-trigger', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets }),
            });
            const data = await res.json();
            if (res.ok) {
                targets.forEach(t => markSent(t.clienteId));
                setBulkResult(`✓ ${data.successCount}/${data.total} webhooks disparados`);
            } else {
                setBulkResult(`Erro: ${data.error}`);
            }
        } catch {
            setBulkResult('Erro de conexão');
        } finally {
            setBulkFiring(false);
        }
    };

    return (
        <div className="glass-card rounded-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-white/10 bg-slate-900/30">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Alertas e Pendências</h3>
                    {lateWithWebhook.length > 1 && (
                        <button
                            onClick={fireAllWebhooks}
                            disabled={bulkFiring || lateWithWebhook.every(a => sentIds.has(a.cliente.id))}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white border border-red-500/50 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {bulkFiring ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                            Disparar todos ({lateWithWebhook.length})
                        </button>
                    )}
                </div>
                {bulkResult && (
                    <p className={`text-xs mt-1 ${bulkResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                        {bulkResult}
                    </p>
                )}
            </div>

            <div className="overflow-y-auto p-4 flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {late.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            🔴 Ação Necessária ({late.length})
                        </h4>
                        {late.map((alert, idx) => (
                            <AlertItem
                                key={idx}
                                {...alert}
                                onWebhookSent={markSent}
                            />
                        ))}
                    </div>
                )}

                {pending.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            🟡 Próximos Horários ({pending.length})
                        </h4>
                        {pending.map((alert, idx) => (
                            <AlertItem
                                key={idx}
                                {...alert}
                                onWebhookSent={markSent}
                            />
                        ))}
                    </div>
                )}

                {late.length === 0 && pending.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <p>Nenhum alerta no momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
