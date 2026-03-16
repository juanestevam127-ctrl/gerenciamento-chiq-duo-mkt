'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Send, CheckCircle2, AlertCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Cliente } from '@/types/database';

interface RetryResult {
    cliente: string;
    username_instagram?: string;
    action: 'completo' | 'webhook_disparado' | 'aguardando' | 'aguardando_retry' | 'max_tentativas';
    tentativa?: number;
    status?: 'success' | 'failed';
    faltam?: string[];
    proximo_retry?: string;
    tentativas?: number;
}

interface AutoRetryMonitorProps {
    /** Clients from the dashboard that are late today */
    lateClients: { cliente: Cliente; horaProgramada: string | null }[];
    /** Called after a retry cycle to refresh dashboard data */
    onRefresh?: () => void;
}

function RetryBadge({ tentativa, status }: { tentativa?: number; status?: string }) {
    if (!tentativa) return null;
    const configs: Record<number, { label: string; cls: string }> = {
        1: { label: '1ª tentativa', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
        2: { label: '2ª tentativa', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
        3: { label: '3ª tentativa', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
    };
    const cfg = configs[tentativa] || { label: `Tentativa ${tentativa}`, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
            {cfg.label}
            {status === 'success' && ' ✓'}
            {status === 'failed' && ' ✗'}
        </span>
    );
}

function ActionIcon({ action }: { action: RetryResult['action'] }) {
    switch (action) {
        case 'completo': return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
        case 'webhook_disparado': return <Send className="w-4 h-4 text-purple-400 shrink-0" />;
        case 'aguardando': return <Clock className="w-4 h-4 text-blue-400 shrink-0" />;
        case 'aguardando_retry': return <RefreshCw className="w-4 h-4 text-orange-400 shrink-0" />;
        case 'max_tentativas': return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
        default: return <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />;
    }
}

function ActionLabel({ result }: { result: RetryResult }) {
    switch (result.action) {
        case 'completo': return <span className="text-green-400">Postagem completa</span>;
        case 'webhook_disparado':
            return (
                <span className={result.status === 'success' ? 'text-purple-300' : 'text-red-300'}>
                    Webhook disparado ({result.status === 'success' ? 'OK' : 'Falhou'})
                    {result.faltam && result.faltam.length > 0 && (
                        <span className="ml-1 text-slate-500">— faltava: {result.faltam.join(', ')}</span>
                    )}
                </span>
            );
        case 'aguardando': return <span className="text-blue-400">Aguardando horário</span>;
        case 'aguardando_retry':
            return (
                <span className="text-orange-400">
                    Aguardando próxima tentativa ({result.tentativa}/3)
                </span>
            );
        case 'max_tentativas':
            return <span className="text-red-400">Máx. tentativas atingido (3/3)</span>;
        default: return <span className="text-slate-400">{result.action}</span>;
    }
}

export function AutoRetryMonitor({ lateClients, onRefresh }: AutoRetryMonitorProps) {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<RetryResult[]>([]);
    const [lastRun, setLastRun] = useState<Date | null>(null);
    const [autoEnabled, setAutoEnabled] = useState(true);
    const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const runAutoRetry = useCallback(async () => {
        if (running) return;
        setRunning(true);
        try {
            const res = await fetch('/api/auto-retry', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.results) {
                setResults(data.results);
                setLastRun(new Date());
                // If any webhook was dispatched, refresh dashboard data
                const hasDispatched = data.results.some((r: RetryResult) => r.action === 'webhook_disparado');
                if (hasDispatched && onRefresh) {
                    setTimeout(() => onRefresh(), 3000); // Slight delay for n8n to process
                }
            }
        } catch (err) {
            console.error('Auto-retry error:', err);
        } finally {
            setRunning(false);
        }
    }, [running, onRefresh]);

    // Auto-run every 1 minute when there are late clients and auto is enabled
    useEffect(() => {
        if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);

        if (autoEnabled && lateClients.length > 0) {
            autoIntervalRef.current = setInterval(runAutoRetry, 60 * 1000);
        }

        return () => {
            if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
        };
    }, [autoEnabled, lateClients.length, runAutoRetry]);

    // Auto-run on mount if there are late clients
    useEffect(() => {
        if (lateClients.length > 0) {
            runAutoRetry();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dispatched = results.filter(r => r.action === 'webhook_disparado');
    const maxed = results.filter(r => r.action === 'max_tentativas');
    const complete = results.filter(r => r.action === 'completo');

    return (
        <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-slate-900/30">
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <RefreshCw className={`w-4 h-4 text-purple-400 ${running ? 'animate-spin' : ''}`} />
                            Auto-Retry Monitor
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {autoEnabled ? 'Verificação automática a cada 1 min' : 'Automático pausado'}{' '}
                            {lastRun && `• Última: ${lastRun.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Toggle auto */}
                        <button
                            onClick={() => setAutoEnabled(v => !v)}
                            title={autoEnabled ? 'Pausar automático' : 'Ativar automático'}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                                autoEnabled
                                    ? 'bg-green-600/20 text-green-300 border-green-500/30 hover:bg-green-600/30'
                                    : 'bg-slate-700/50 text-slate-400 border-slate-600/30 hover:bg-slate-700'
                            }`}
                        >
                            {autoEnabled ? '🟢 Auto' : '⏸ Paused'}
                        </button>
                        {/* Manual trigger */}
                        <button
                            onClick={runAutoRetry}
                            disabled={running}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white border border-purple-500/50 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Verificar Agora
                        </button>
                    </div>
                </div>

                {/* Summary badges */}
                {results.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {complete.length > 0 && (
                            <span className="text-[10px] bg-green-500/15 border border-green-500/25 text-green-300 px-2 py-0.5 rounded-full">
                                ✓ {complete.length} completo(s)
                            </span>
                        )}
                        {dispatched.length > 0 && (
                            <span className="text-[10px] bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded-full">
                                ↑ {dispatched.length} webhook(s) disparado(s)
                            </span>
                        )}
                        {maxed.length > 0 && (
                            <span className="text-[10px] bg-red-500/15 border border-red-500/25 text-red-300 px-2 py-0.5 rounded-full">
                                ✗ {maxed.length} esgotado(s)
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Results list */}
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {results.length === 0 && !running && (
                    <div className="text-center py-10 text-slate-500">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma verificação executada ainda.</p>
                        <p className="text-xs mt-1">
                            {lateClients.length > 0
                                ? 'Clique em "Verificar Agora" ou aguarde a execução automática.'
                                : 'Não há clientes atrasados no momento.'}
                        </p>
                    </div>
                )}

                {running && results.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                        <span className="text-sm">Verificando postagens...</span>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="p-3 space-y-2">
                        {results.map((result, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    result.action === 'completo'
                                        ? 'bg-green-500/5 border-green-500/15'
                                        : result.action === 'webhook_disparado'
                                        ? result.status === 'success'
                                            ? 'bg-purple-500/5 border-purple-500/15'
                                            : 'bg-red-500/5 border-red-500/15'
                                        : result.action === 'max_tentativas'
                                        ? 'bg-red-500/5 border-red-500/15'
                                        : 'bg-slate-800/50 border-white/5'
                                }`}
                            >
                                <ActionIcon action={result.action} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white leading-tight">{result.cliente}</span>
                                            {result.username_instagram && (
                                                <span className="text-[11px] text-purple-400 font-medium">@{result.username_instagram}</span>
                                            )}
                                        </div>
                                        {result.action === 'webhook_disparado' && (
                                            <RetryBadge tentativa={result.tentativa} status={result.status} />
                                        )}
                                        {result.action === 'max_tentativas' && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-500/20 text-slate-400 border-slate-500/30">
                                                Máximo atingido
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs mt-0.5">
                                        <ActionLabel result={result} />
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
