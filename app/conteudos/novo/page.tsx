'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { conteudoSchema, type ConteudoFormData } from '@/lib/validations';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { TipoConteudo, CarouselItem } from '@/types/database';

export default function NovoConteudoPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [tipoConteudo, setTipoConteudo] = useState<TipoConteudo>('imagem_estatica');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ConteudoFormData>({
        resolver: zodResolver(conteudoSchema),
        defaultValues: {
            tipo_conteudo: 'imagem_estatica',
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (tipoConteudo === 'carrossel') {
            setFiles(selectedFiles);
            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setPreviews(newPreviews);
        } else {
            setFiles([selectedFiles[0]]);
            setPreviews([URL.createObjectURL(selectedFiles[0])]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const uploadFile = async (file: File): Promise<string> => {
        const fileName = `${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const onSubmit = async (data: ConteudoFormData) => {
        if (files.length === 0) {
            setError('Por favor, selecione pelo menos um arquivo');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let contentData: any = {
                data_postagem: data.data_postagem,
                descricao: data.descricao || null,
            };

            // Upload files based on content type
            if (tipoConteudo === 'imagem_estatica') {
                const url = await uploadFile(files[0]);
                contentData.imagem_estatica = url;
            } else if (tipoConteudo === 'carrossel') {
                const uploadPromises = files.map(file => uploadFile(file));
                const urls = await Promise.all(uploadPromises);
                const carouselData: CarouselItem[] = urls.map((url, index) => ({
                    posicao: index + 1,
                    imagem_url: url,
                }));
                contentData.carrossel = carouselData;
            } else if (tipoConteudo === 'reels') {
                const url = await uploadFile(files[0]);
                contentData.reels = url;
            } else if (tipoConteudo === 'stories') {
                const url = await uploadFile(files[0]);
                contentData.stories = url;
            }

            const response = await fetch('/api/conteudos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contentData),
            });

            if (response.ok) {
                router.push('/conteudos');
            } else {
                const result = await response.json();
                setError(result.error || 'Erro ao criar conteúdo');
            }
        } catch (err: any) {
            console.error(err);
            setError('Erro ao criar conteúdo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 min-h-screen">
            <div className="mb-6">
                <Link
                    href="/conteudos"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Voltar
                </Link>
            </div>

            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-white mb-6">Novo Conteúdo</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 rounded-xl space-y-6">
                    <div>
                        <label htmlFor="data_postagem" className="block text-sm font-medium text-slate-300 mb-2">
                            Data da Postagem *
                        </label>
                        <input
                            {...register('data_postagem')}
                            type="date"
                            id="data_postagem"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                        />
                        {errors.data_postagem && (
                            <p className="mt-1 text-sm text-red-400">{errors.data_postagem.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-slate-300 mb-2">
                            Descrição (Opcional)
                        </label>
                        <textarea
                            {...register('descricao')}
                            id="descricao"
                            rows={4}
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="Descrição do conteúdo..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Tipo de Conteúdo *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { id: 'imagem_estatica', label: 'Imagem Static' },
                                { id: 'carrossel', label: 'Carrossel' },
                                { id: 'reels', label: 'Reels' },
                                { id: 'stories', label: 'Stories' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => {
                                        setTipoConteudo(type.id as TipoConteudo);
                                        setFiles([]);
                                        setPreviews([]);
                                    }}
                                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${tipoConteudo === type.id
                                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                        : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Upload de Arquivo(s) *
                        </label>
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500/70 hover:bg-slate-800/30 transition-all group">
                            <Upload className="h-12 w-12 text-slate-500 mx-auto mb-3 group-hover:text-purple-400 transition-colors" />
                            <input
                                type="file"
                                accept={tipoConteudo === 'reels' ? 'video/*' : 'image/*'}
                                multiple={tipoConteudo === 'carrossel'}
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium"
                            >
                                Clique para selecionar {tipoConteudo === 'carrossel' ? 'imagens' : 'arquivo'}
                            </label>
                            <p className="text-sm text-slate-500 mt-1">
                                {tipoConteudo === 'carrossel' ? 'Você pode selecionar múltiplos arquivos' : 'Selecione um único arquivo'}
                            </p>
                        </div>
                    </div>

                    {/* File Previews */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    {tipoConteudo === 'reels' || preview.includes('video') ? (
                                        <video src={preview} className="w-full h-32 object-cover rounded-lg border border-slate-700" />
                                    ) : (
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-slate-700"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                    {tipoConteudo === 'carrossel' && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded border border-white/10">
                                            {index + 1}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

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
                            {isLoading ? 'Salvando...' : 'Agendar Conteúdo'}
                        </button>
                        <Link
                            href="/conteudos"
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
