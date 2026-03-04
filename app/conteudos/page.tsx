"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conteudo {
    id: string;
    data_postagem: string;
    descricao: string | null;
    tipo_conteudo: string; // Helper for display, logic needs to check columns
    imagem_estatica: string | null;
    carrossel: any | null;
    reels: string | null;
    stories: string | null;
}

export default function ConteudosPage() {
    const [conteudos, setConteudos] = useState<Conteudo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchConteudos();
    }, []);

    const fetchConteudos = async () => {
        try {
            const response = await fetch("/api/conteudos");
            if (response.ok) {
                const data = await response.json();
                // Determine type for display
                const processedData = data.map((item: any) => {
                    let tipo = "Desconhecido";
                    if (item.imagem_estatica) tipo = "Imagem";
                    else if (item.carrossel) tipo = "Carrossel";
                    else if (item.reels) tipo = "Reels";
                    else if (item.stories) tipo = "Stories";
                    return { ...item, tipo_conteudo: tipo };
                });
                setConteudos(processedData);
            }
        } catch (error) {
            console.error("Erro ao buscar conteúdos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;

        try {
            const response = await fetch(`/api/conteudos/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setConteudos(conteudos.filter((c) => c.id !== id));
            } else {
                alert("Erro ao excluir conteúdo");
            }
        } catch (error) {
            console.error("Erro ao excluir conteúdo:", error);
            alert("Erro ao excluir conteúdo");
        }
    };

    return (
        <div className="min-h-screen text-slate-200 bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Conteúdos
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">Gerencie os conteúdos agendados para seus clientes.</p>
                </div>
                <Link
                    href="/conteudos/novo"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/20"
                >
                    <Plus className="h-5 w-5" />
                    Novo Conteúdo
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : conteudos.length === 0 ? (
                <div className="text-center py-16 glass-card rounded-xl border-dashed border-slate-700">
                    <p className="text-slate-400 mb-4 text-sm md:text-lg">Nenhum conteúdo agendado ainda.</p>
                    <Link
                        href="/conteudos/novo"
                        className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4 text-sm"
                    >
                        Agendar primeiro conteúdo
                    </Link>
                </div>
            ) : (
                <div className="glass-card rounded-xl overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {conteudos.map((conteudo) => (
                                <tr key={conteudo.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">
                                            {(() => {
                                                const dateStr = conteudo.data_postagem;
                                                const date = dateStr ? new Date(dateStr + 'T12:00:00') : null;
                                                return date && !isNaN(date.getTime())
                                                    ? format(date, "dd/MM/yyyy", { locale: ptBR })
                                                    : '-';
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${conteudo.tipo_conteudo === 'Imagem' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                            conteudo.tipo_conteudo === 'Carrossel' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                                                conteudo.tipo_conteudo === 'Reels' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                            }`}>
                                            {conteudo.tipo_conteudo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-400 truncate max-w-xs">
                                            {conteudo.descricao || "-"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/conteudos/${conteudo.id}/editar`}
                                            className="text-purple-400 hover:text-purple-300 mr-4 inline-block transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(conteudo.id)}
                                            className="text-red-400 hover:text-red-300 inline-block transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
