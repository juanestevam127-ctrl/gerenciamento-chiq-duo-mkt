'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isSameDay, isAfter, isBefore, parseISO, eachDayOfInterval, addMinutes, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilterBar } from './components/FilterBar';
import { KPICards } from './components/KPICards';
import { StatusChart } from './components/StatusChart';
import { HistoryChart } from './components/HistoryChart';
import { AlertsList } from './components/AlertsList';
import { DelayedWebhookTrigger } from './components/DelayedWebhookTrigger';
import { DetailedTable } from './components/DetailedTable';
import { Cliente, Conteudo, ControlePostagem } from '@/types/database';
import { parseLocalDate } from '@/lib/utils';

interface DashboardData {
    clientes: Cliente[];
    conteudos: Conteudo[];
    postagens: ControlePostagem[];
}

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        label: 'Hoje'
    });
    const [data, setData] = useState<DashboardData>({ clientes: [], conteudos: [], postagens: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            if (dateRange.label === 'Hoje') {
                fetchDashboardData(); // Auto-refresh for "Hoje"
            }
            setLastUpdated(new Date()); // Always update "Last Updated" time for relative time calcs
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [dateRange]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            const res = await fetch(`/api/dashboard/data?${params}`);
            const jsonData = await res.json();
            setData(jsonData);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIC CORE ---
    const processedData = useMemo(() => {
        if (!data.clientes.length) return null;

        const days = eachDayOfInterval({
            start: parseLocalDate(dateRange.start) || new Date(),
            end: parseLocalDate(dateRange.end) || new Date()
        });

        const rows: any[] = [];
        let stats = {
            totalClientes: data.clientes.length,
            postados: 0,
            atrasados: 0,
            pendentes: 0,
            semConteudo: 0,
            taxaPostagem: 0,
            isHoje: dateRange.label === 'Hoje'
        };

        const history: any[] = [];
        const statusDistribution = [
            { name: 'Postado', value: 0, color: '#22c55e' },
            { name: 'Atrasado', value: 0, color: '#ef4444' }, // Red
            { name: 'Pendente', value: 0, color: '#3b82f6' }, // Blue
            { name: 'Sem Conteúdo', value: 0, color: '#64748b' } // Slate
        ];

        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            let dayPostados = 0;
            let dayAtrasados = 0;

            data.clientes.forEach(cliente => {
                // 1. Find Content for this Client on this Day
                // Logic: Matches date AND (id_instagram is linked OR id_instagram is null/generic).
                const clientContents = data.conteudos.filter(c =>
                    c.data_postagem === dateStr && (c.id_instagram === cliente.id_instagram || !c.id_instagram)
                );

                const needsFeed = clientContents.some(c => !!c.imagem_estatica || !!c.carrossel || !!c.reels);
                const needsStories = clientContents.some(c => !!c.stories);
                const hasContent = needsFeed || needsStories;

                const contentTypes: string[] = [];
                clientContents.forEach(c => {
                    if (c.imagem_estatica && !contentTypes.includes('IMAGEM')) contentTypes.push('IMAGEM');
                    if (c.carrossel && !contentTypes.includes('CARROSSEL')) contentTypes.push('CARROSSEL');
                    if (c.reels && !contentTypes.includes('REELS')) contentTypes.push('REELS');
                    if (c.stories && !contentTypes.includes('STORIES')) contentTypes.push('STORIES');
                });

                // 2. Find Posts (Multiple possible: Feed and Stories)
                const clientPosts = data.postagens.filter(p =>
                    p.data_postagem === dateStr && p.id_instagram === cliente.id_instagram
                );

                const hasFeedPost = clientPosts.some(p => p.tipo_postagem === 'FEED');
                const hasStoriesPost = clientPosts.some(p => p.tipo_postagem === 'STORIES');

                // Determine if everything required is done
                const isAllDone = (!needsFeed || hasFeedPost) && (!needsStories || hasStoriesPost);

                // 3. Determine Status
                let status = 'no_content';
                const now = new Date();
                const isToday = isSameDay(day, now);
                const isPast = isBefore(day, startOfDay(now));

                if (isAllDone && hasContent) {
                    status = 'posted';
                    stats.postados++;
                    dayPostados++;
                    statusDistribution[0].value++;
                } else if (!hasContent) {
                    status = 'no_content';
                    stats.semConteudo++;
                    statusDistribution[3].value++;
                } else {
                    // Has Content, but NOT all done
                    if (isPast) {
                        status = 'missed'; // Considered "Atrasado" for history, effectively missed
                        stats.atrasados++;
                        dayAtrasados++;
                        statusDistribution[1].value++;
                    } else if (isToday) {
                        // Check time
                        if (cliente.horario_postagem) {
                            const [hours, minutes] = cliente.horario_postagem.split(':').map(Number);
                            const postTime = new Date(day);
                            postTime.setHours(hours, minutes, 0, 0);

                            if (isAfter(now, postTime)) {
                                status = 'late';
                                stats.atrasados++;
                                statusDistribution[1].value++;
                            } else {
                                status = 'pending';
                                stats.pendentes++;
                                statusDistribution[2].value++;
                            }
                        } else {
                            status = 'pending';
                            stats.pendentes++;
                            statusDistribution[2].value++;
                        }
                    } else {
                        // Future
                        status = 'pending';
                        stats.pendentes++;
                        statusDistribution[2].value++;
                    }
                }

                // Get most recent post for the table display
                const latestPost = clientPosts.length > 0
                    ? [...clientPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                    : null;

                rows.push({
                    cliente,
                    status,
                    conteudos: contentTypes,
                    horaPostagem: latestPost?.created_at,
                    tipoPostado: latestPost?.tipo_postagem,
                    date: dateStr,
                    horaProgramada: cliente.horario_postagem
                });
            });

            history.push({
                date: dateStr,
                postados: dayPostados,
                atrasados: dayAtrasados
            });
        });

        // Calculate rates logic (simplified for aggregate)
        const totalExpected = stats.postados + stats.atrasados + stats.pendentes + (stats.isHoje ? 0 : 0); // Denom is valid tasks
        if (totalExpected > 0) {
            stats.taxaPostagem = Math.round((stats.postados / totalExpected) * 100);
        }

        return { stats, rows, history, statusDistribution };
    }, [data, dateRange]);


    const alerts = useMemo(() => {
        if (!processedData || !mounted) return [];
        const todayStr = new Date().toISOString().split('T')[0];
        // Filter rows for "Today" alerts mainly, or all active alerts in range
        return processedData.rows
            .filter(r => r.status === 'late' || (r.status === 'pending' && (!r.date || r.date === todayStr)))
            .sort((a, b) => {
                if (a.status === 'late' && b.status !== 'late') return -1;
                if (a.status !== 'late' && b.status === 'late') return 1;
                // Sort by time
                return (a.horaProgramada || '').localeCompare(b.horaProgramada || '');
            });
    }, [processedData, mounted]);

    return (
        <div className="min-h-screen bg-transparent text-white pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="w-full sm:w-auto">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Dashboard de Postagens
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Acompanhamento em tempo real</span>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-500"></span>
                        <span className="text-[10px] sm:text-xs">
                            {mounted ? `Atualizado às ${format(lastUpdated, 'HH:mm:ss')}` : 'Carregando...'}
                        </span>
                    </p>
                </div>
                <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <FilterBar
                        onFilterChange={(start, end, label) => setDateRange({ start, end, label })}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {processedData && (
                <>
                    <KPICards stats={processedData.stats} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-1">
                            <StatusChart data={processedData.statusDistribution} />
                        </div>
                        <div className="lg:col-span-2">
                            <HistoryChart data={processedData.history} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-1">
                            <AlertsList alerts={alerts} />
                        </div>
                        <div className="lg:col-span-2">
                            <DelayedWebhookTrigger
                                clients={alerts
                                    .filter(a => a.status === 'late')
                                    .map(a => ({ cliente: a.cliente, horaProgramada: a.horaProgramada, conteudos: a.conteudos }))
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        <DetailedTable data={processedData.rows} />
                    </div>
                </>
            )}

            {isLoading && !processedData && (
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            )}
        </div>
    );
}
