'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema, type ClienteFormData } from '@/lib/validations';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditarClientePage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFetching, setIsFetching] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ClienteFormData>({
        resolver: zodResolver(clienteSchema),
    });

    useEffect(() => {
        fetchCliente();
    }, []);

    const fetchCliente = async () => {
        try {
            const response = await fetch(`/api/clientes/${params.id}`);
            const data = await response.json();
            reset(data);
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const onSubmit = async (data: ClienteFormData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/clientes/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push('/clientes');
            } else {
                const result = await response.json();
                setError(result.error || 'Erro ao atualizar cliente');
            }
        } catch (err) {
            setError('Erro ao atualizar cliente. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <Link
                    href="/clientes"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Voltar
                </Link>
            </div>

            <div className="max-w-2xl">
                <h1 className="text-3xl font-bold text-white mb-6">Editar Cliente</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 rounded-xl space-y-6">
                    <div>
                        <label htmlFor="nome_cliente" className="block text-sm font-medium text-slate-300 mb-2">
                            Nome do Cliente *
                        </label>
                        <input
                            {...register('nome_cliente')}
                            type="text"
                            id="nome_cliente"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                        />
                        {errors.nome_cliente && (
                            <p className="mt-1 text-sm text-red-400">{errors.nome_cliente.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="username_instagram" className="block text-sm font-medium text-slate-300 mb-2">
                            Username do Instagram *
                        </label>
                        <input
                            {...register('username_instagram')}
                            type="text"
                            id="username_instagram"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                        />
                        {errors.username_instagram && (
                            <p className="mt-1 text-sm text-red-400">{errors.username_instagram.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="id_instagram" className="block text-sm font-medium text-slate-300 mb-2">
                            ID do Instagram *
                        </label>
                        <input
                            {...register('id_instagram')}
                            type="text"
                            id="id_instagram"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                        />
                        {errors.id_instagram && (
                            <p className="mt-1 text-sm text-red-400">{errors.id_instagram.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="horario_postagem" className="block text-sm font-medium text-slate-300 mb-2">
                            Horário de Postagem
                        </label>
                        <input
                            {...register('horario_postagem')}
                            type="time"
                            id="horario_postagem"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                        />
                        {errors.horario_postagem && (
                            <p className="mt-1 text-sm text-red-400">{errors.horario_postagem.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-2">
                            Token (Opcional)
                        </label>
                        <textarea
                            {...register('token')}
                            id="token"
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 font-mono text-sm"
                            placeholder="Deixe em branco para manter o token atual"
                        />
                        {errors.token && (
                            <p className="mt-1 text-sm text-red-400">{errors.token.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="webhook" className="block text-sm font-medium text-slate-300 mb-2">
                            Webhook (Opcional)
                        </label>
                        <input
                            {...register('webhook')}
                            type="url"
                            id="webhook"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="https://..."
                            autoComplete="off"
                        />
                        {errors.webhook && (
                            <p className="mt-1 text-sm text-red-400">{errors.webhook.message}</p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <Link
                            href="/clientes"
                            className="px-4 py-2 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
