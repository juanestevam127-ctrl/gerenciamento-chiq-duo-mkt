"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema, type ClienteFormData } from "@/lib/validations";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function EditarClientePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ClienteFormData>({
        resolver: zodResolver(clienteSchema),
    });

    useEffect(() => {
        const fetchCliente = async () => {
            try {
                const response = await fetch(`/api/clientes/${resolvedParams.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setValue("nome_cliente", data.nome_cliente);
                    setValue("username_instagram", data.username_instagram);
                    setValue("id_instagram", data.id_instagram);
                    setValue("token", data.token || "");
                    setValue("horario_postagem", data.horario_postagem || "");
                    setValue("webhook", data.webhook || "");
                    setValue("id_pagina_facebook", data.id_pagina_facebook || "");
                    setValue("token_facebook", data.token_facebook || "");
                } else {
                    setError("Cliente não encontrado");
                }
            } catch (err) {
                setError("Erro ao carregar dados do cliente");
            } finally {
                setIsFetching(false);
            }
        };

        fetchCliente();
    }, [resolvedParams.id, setValue]);

    const onSubmit = async (data: ClienteFormData) => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/clientes/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push("/clientes");
            } else {
                const result = await response.json();
                setError(result.error || "Erro ao atualizar cliente");
            }
        } catch (err) {
            setError("Erro ao atualizar cliente. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="p-4">Carregando...</div>;
    }

    return (
        <div className="bg-transparent">
            <div className="mb-6">
                <Link
                    href="/clientes"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Link>
            </div>

            <div className="max-w-2xl">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    Editar Cliente
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="glass-card p-6 rounded-xl space-y-6"
                >
                    <div>
                        <label
                            htmlFor="nome_cliente"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Nome do Cliente *
                        </label>
                        <input
                            {...register("nome_cliente")}
                            type="text"
                            id="nome_cliente"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="Ex: Chiquinho Sorvetes Centro"
                        />
                        {errors.nome_cliente && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.nome_cliente.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="username_instagram"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Username do Instagram *
                        </label>
                        <input
                            {...register("username_instagram")}
                            type="text"
                            id="username_instagram"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="Ex: chiquinhosorvetes"
                        />
                        {errors.username_instagram && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.username_instagram.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="id_instagram"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            ID do Instagram *
                        </label>
                        <input
                            {...register("id_instagram")}
                            type="text"
                            id="id_instagram"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="Ex: 123456789"
                        />
                        {errors.id_instagram && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.id_instagram.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="horario_postagem"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Horário de Postagem
                        </label>
                        <input
                            {...register("horario_postagem")}
                            type="time"
                            id="horario_postagem"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 [color-scheme:dark]"
                        />
                        {errors.horario_postagem && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.horario_postagem.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="token"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Token (Opcional)
                        </label>
                        <textarea
                            {...register("token")}
                            id="token"
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 font-mono text-sm"
                            placeholder="Token de acesso do Instagram"
                        />
                        {errors.token && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.token.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="webhook"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Webhook (Opcional)
                        </label>
                        <input
                            {...register("webhook")}
                            type="url"
                            id="webhook"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="https://..."
                            autoComplete="off"
                        />
                        {errors.webhook && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.webhook.message}
                            </p>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">Configuração Facebook (Opcional)</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="id_pagina_facebook" className="block text-sm font-medium text-slate-300 mb-2">
                                    ID da Página do Facebook
                                </label>
                                <input
                                    {...register('id_pagina_facebook')}
                                    type="text"
                                    id="id_pagina_facebook"
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                                    placeholder="ID da página vinculada"
                                />
                            </div>

                            <div>
                                <label htmlFor="token_facebook" className="block text-sm font-medium text-slate-300 mb-2">
                                    Token do Facebook
                                </label>
                                <textarea
                                    {...register('token_facebook')}
                                    id="token_facebook"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 font-mono text-sm"
                                    placeholder="Token de acesso da página"
                                />
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 italic">
                            Preencha estes campos apenas se o cliente possuir postagem no Facebook/Instagram vinculados.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                        >
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </button>
                        <Link
                            href="/clientes"
                            className="w-full py-2 px-4 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700/50 transition-colors text-center"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
