'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isSameDay, isAfter, isBefore, parseISO, eachDayOfInterval, addMinutes, startOfDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilterBar } from './components/FilterBar';
import { AlertCircle } from 'lucide-react';
import { KPICards } from './components/KPICards';
import { StatusChart } from './components/StatusChart';
import { HistoryChart } from './components/HistoryChart';
import { AlertsList } from './components/AlertsList';
import { AutoRetryMonitor } from './components/AutoRetryMonitor';
import { DetailedTable } from './components/DetailedTable';
import { Cliente, Conteudo, ControlePostagem, StoryProgressItem, DuplicidadeInfo } from '@/types/database';
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
            
            if (jsonData.error) {
                console.error("API Error:", jsonData.error, jsonData.details);
                setData({ clientes: [], conteudos: [], postagens: [] });
                // We could also set an error state here to show to the user
            } else {
                setData(jsonData);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setData({ clientes: [], conteudos: [], postagens: [] });
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIC CORE ---
    const processedData = useMemo(() => {
        if (!data?.clientes?.length) return null;

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
            isHoje: dateRange.label === 'Hoje',
            duplicados: 0,
            storiesIncompletos: 0,
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

                // Extract all scheduled story URLs
                const scheduledStories: string[] = [];
                clientContents.forEach(c => {
                    if (c.stories) {
                        let parsed: any = null;
                        try {
                            parsed = typeof c.stories === 'string' ? JSON.parse(c.stories) : c.stories;
                        } catch {
                            parsed = c.stories;
                        }
                        if (Array.isArray(parsed)) {
                            parsed.forEach(url => {
                                if (typeof url === 'string' && url.trim() && !scheduledStories.includes(url.trim())) {
                                    scheduledStories.push(url.trim());
                                }
                            });
                        } else if (typeof parsed === 'string' && parsed.trim() && !scheduledStories.includes(parsed.trim())) {
                            scheduledStories.push(parsed.trim());
                        }
                    }
                });
                const storiesTotal = scheduledStories.length;

                // 2. Find Posts
                const clientPosts = data.postagens.filter(p =>
                    p.data_postagem === dateStr && p.id_instagram === cliente.id_instagram
                );

                const igFeedPosts = clientPosts.filter(p => p.tipo_postagem === 'FEED');
                const fbFeedPosts = clientPosts.filter(p => p.tipo_postagem === 'FEED FACEBOOK');
                const igStoryPosts = clientPosts.filter(p => p.tipo_postagem === 'STORIES');
                const fbStoryPosts = clientPosts.filter(p => p.tipo_postagem === 'STORIES FACEBOOK');

                const hasFeedPost = igFeedPosts.length > 0;
                const hasStoriesPost = igStoryPosts.length > 0;
                const hasFeedFbPost = fbFeedPosts.length > 0;
                const hasStoriesFbPost = fbStoryPosts.length > 0;

                const hasFacebook = !!(cliente.id_pagina_facebook && cliente.token_facebook);

                // 3. Match Stories item-by-item
                const storiesItems: StoryProgressItem[] = scheduledStories.map((url, idx) => {
                    const matchIg = igStoryPosts.find(p => p.conteudo_postado && p.conteudo_postado.trim() === url.trim())
                        || (!igStoryPosts.some(p => p.conteudo_postado) && igStoryPosts.length > idx ? igStoryPosts[idx] : undefined);

                    const matchFb = fbStoryPosts.find(p => p.conteudo_postado && p.conteudo_postado.trim() === url.trim())
                        || (!fbStoryPosts.some(p => p.conteudo_postado) && fbStoryPosts.length > idx ? fbStoryPosts[idx] : undefined);

                    return {
                        index: idx + 1,
                        url,
                        postedIg: !!matchIg,
                        postedFb: !!matchFb,
                        postRecordIdIg: matchIg?.id,
                        postRecordIdFb: matchFb?.id,
                    };
                });

                const storiesPostedIgCount = storiesTotal > 0
                    ? storiesItems.filter(i => i.postedIg).length
                    : igStoryPosts.length;

                const storiesPostedFbCount = storiesTotal > 0
                    ? storiesItems.filter(i => i.postedFb).length
                    : fbStoryPosts.length;

                // 4. Duplicate Detection
                const duplicidades: DuplicidadeInfo[] = [];

                if (igFeedPosts.length > 1) {
                    duplicidades.push({
                        tipo: 'FEED',
                        descricao: `${igFeedPosts.length}x posts de FEED no Instagram`,
                        ids: igFeedPosts.map(p => p.id),
                    });
                }

                if (fbFeedPosts.length > 1) {
                    duplicidades.push({
                        tipo: 'FEED FACEBOOK',
                        descricao: `${fbFeedPosts.length}x posts de FEED no Facebook`,
                        ids: fbFeedPosts.map(p => p.id),
                    });
                }

                // Check duplicate Stories URLs in IG
                const igStoriesByUrl = new Map<string, ControlePostagem[]>();
                igStoryPosts.forEach(p => {
                    const key = (p.conteudo_postado || '').trim();
                    if (key) {
                        if (!igStoriesByUrl.has(key)) igStoriesByUrl.set(key, []);
                        igStoriesByUrl.get(key)!.push(p);
                    }
                });
                igStoriesByUrl.forEach((plist, url) => {
                    if (plist.length > 1) {
                        duplicidades.push({
                            tipo: 'STORIES',
                            descricao: `${plist.length}x o mesmo Story no Instagram`,
                            ids: plist.map(p => p.id),
                            conteudo_postado: url,
                        });
                    }
                });

                if (storiesTotal > 0 && igStoryPosts.length > storiesTotal && !duplicidades.some(d => d.tipo === 'STORIES')) {
                    duplicidades.push({
                        tipo: 'STORIES',
                        descricao: `${igStoryPosts.length} stories postados para ${storiesTotal} agendados (${igStoryPosts.length - storiesTotal} a mais no IG)`,
                        ids: igStoryPosts.map(p => p.id),
                    });
                }

                // Check duplicate Stories URLs in FB
                const fbStoriesByUrl = new Map<string, ControlePostagem[]>();
                fbStoryPosts.forEach(p => {
                    const key = (p.conteudo_postado || '').trim();
                    if (key) {
                        if (!fbStoriesByUrl.has(key)) fbStoriesByUrl.set(key, []);
                        fbStoriesByUrl.get(key)!.push(p);
                    }
                });
                fbStoriesByUrl.forEach((plist, url) => {
                    if (plist.length > 1) {
                        duplicidades.push({
                            tipo: 'STORIES FACEBOOK',
                            descricao: `${plist.length}x o mesmo Story no Facebook`,
                            ids: plist.map(p => p.id),
                            conteudo_postado: url,
                        });
                    }
                });

                if (hasFacebook && storiesTotal > 0 && fbStoryPosts.length > storiesTotal && !duplicidades.some(d => d.tipo === 'STORIES FACEBOOK')) {
                    duplicidades.push({
                        tipo: 'STORIES FACEBOOK',
                        descricao: `${fbStoryPosts.length} stories postados para ${storiesTotal} agendados (${fbStoryPosts.length - storiesTotal} a mais no FB)`,
                        ids: fbStoryPosts.map(p => p.id),
                    });
                }

                const hasDuplicates = duplicidades.length > 0;
                if (hasDuplicates) {
                    stats.duplicados = (stats.duplicados || 0) + 1;
                }

                // Partial stories check
                const isPartialStories = needsStories && storiesTotal > 0 && (
                    (storiesPostedIgCount > 0 && storiesPostedIgCount < storiesTotal) ||
                    (hasFacebook && storiesPostedFbCount > 0 && storiesPostedFbCount < storiesTotal)
                );
                if (isPartialStories) {
                    stats.storiesIncompletos = (stats.storiesIncompletos || 0) + 1;
                }

                // Determine if all required content is posted
                const isFeedDone = !needsFeed || (hasFeedPost && (!hasFacebook || hasFeedFbPost));
                const isStoriesDone = !needsStories || (
                    storiesTotal > 0
                        ? (storiesPostedIgCount >= storiesTotal && (!hasFacebook || storiesPostedFbCount >= storiesTotal))
                        : (hasStoriesPost && (!hasFacebook || hasStoriesFbPost))
                );
                const isAllDone = isFeedDone && isStoriesDone;

                // 5. Determine Status
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
                        status = 'missed';
                        stats.atrasados++;
                        dayAtrasados++;
                        statusDistribution[1].value++;
                    } else if (isToday) {
                        if (cliente.horario_postagem) {
                            const [hours, minutes] = cliente.horario_postagem.split(':').map(Number);
                            const postTime = new Date(day);
                            postTime.setHours(hours, minutes, 0, 0);

                            if (isAfter(now, postTime)) {
                                status = isPartialStories ? 'partial' : 'late';
                                stats.atrasados++;
                                statusDistribution[1].value++;
                            } else {
                                status = isPartialStories ? 'partial' : 'pending';
                                stats.pendentes++;
                                statusDistribution[2].value++;
                            }
                        } else {
                            status = isPartialStories ? 'partial' : 'pending';
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
                    horaProgramada: cliente.horario_postagem,
                    hasFacebook,
                    needsFeed,
                    needsStories,
                    feedIgCount: igFeedPosts.length,
                    feedFbCount: fbFeedPosts.length,
                    hasFeedPost,
                    hasFeedFbPost,
                    storiesTotal,
                    storiesPostedIgCount,
                    storiesPostedFbCount,
                    storiesItems,
                    duplicidades,
                    hasDuplicates,
                    isPartialStories,
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

    const expiredTokens = useMemo(() => {
        if (!data?.clientes) return [];
        const currentMonthStart = startOfMonth(new Date());
        return data.clientes.filter(cliente => {
            if (!cliente.data_atualizacao_token) return true;
            const dataToken = parseISO(cliente.data_atualizacao_token);
            return isBefore(dataToken, currentMonthStart);
        });
    }, [data.clientes]);

    return (
        <div className="min-h-screen bg-transparent text-white pb-20">
            {expiredTokens.length > 0 && (
                <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-full shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-red-400 font-medium text-sm">Atenção: Renovação de Token Pendente</h3>
                        <p className="text-slate-300 text-xs mt-1">
                            Os seguintes clientes precisam ter o token renovado este mês: 
                            <strong className="text-white ml-1">
                                {expiredTokens.map(c => c.username_instagram ? `@${c.username_instagram}` : c.nome_cliente).join(', ')}
                            </strong>
                        </p>
                    </div>
                </div>
            )}

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
                <div className="w-full sm:w-auto">
                    <FilterBar
                        onFilterChange={(start, end, label) => setDateRange({ start, end, label })}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {processedData && (
                <>
                    <KPICards stats={processedData.stats} />

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                        <div className="xl:col-span-1">
                            <StatusChart data={processedData.statusDistribution} />
                        </div>
                        <div className="xl:col-span-2">
                            <HistoryChart data={processedData.history} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                        <div className="xl:col-span-1">
                            <AlertsList alerts={alerts} />
                        </div>
                    <div className="xl:col-span-2">
                            <AutoRetryMonitor
                                lateClients={alerts
                                    .filter(a => a.status === 'late')
                                    .map(a => ({ cliente: a.cliente, horaProgramada: a.horaProgramada }))
                                }
                                onRefresh={fetchDashboardData}
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
