"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Cliente {
    id: string;
    nome_cliente: string;
    username_instagram: string;
    id_instagram: string;
    horario_postagem: string | null;
}

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            const response = await fetch("/api/clientes");
            if (response.ok) {
                const data = await response.json();
                setClientes(data);
            }
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setClientes(clientes.filter((c) => c.id !== id));
            } else {
                alert("Erro ao excluir cliente");
            }
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            alert("Erro ao excluir cliente");
        }
    };

    return (
        <div className="bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Clientes</h1>
                <Link
                    href="/clientes/novo"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/90 text-white font-medium rounded-lg hover:bg-purple-600 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] border border-purple-500/50"
                >
                    <Plus className="h-5 w-5" />
                    Novo Cliente
                </Link>
            </div>

            {isLoading ? (
                <p className="text-slate-400 text-sm">Carregando clientes...</p>
            ) : clientes.length === 0 ? (
                <div className="text-center py-10 glass-card rounded-lg">
                    <p className="text-slate-400 mb-4 text-sm">Nenhum cliente cadastrado ainda.</p>
                    <Link
                        href="/clientes/novo"
                        className="text-purple-400 hover:text-purple-300 font-medium text-sm"
                    >
                        Cadastrar primeiro cliente
                    </Link>
                </div>
            ) : (
                <div className="glass-card rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700/50">
                        <thead className="bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    ID Instagram
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Horário Postagem
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 bg-transparent">
                            {clientes.map((cliente) => (
                                <tr key={cliente.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-white">
                                                {cliente.nome_cliente}
                                            </div>
                                            <div className="text-xs text-purple-400">
                                                @{cliente.username_instagram}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-400">
                                            {cliente.id_instagram}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-300">
                                            {cliente.horario_postagem || "-"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/clientes/${cliente.id}/editar`}
                                            className="text-purple-400 hover:text-purple-300 mr-4 inline-block transition-colors"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(cliente.id)}
                                            className="text-red-400 hover:text-red-300 inline-block transition-colors"
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
