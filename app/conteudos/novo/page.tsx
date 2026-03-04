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

    // States for each type
    const [staticFile, setStaticFile] = useState<File | null>(null);
    const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
    const [reelsFile, setReelsFile] = useState<File | null>(null);
    const [storiesFile, setStoriesFile] = useState<File | null>(null);

    // Previews
    const [staticPreview, setStaticPreview] = useState<string>('');
    const [carouselPreviews, setCarouselPreviews] = useState<string[]>([]);
    const [reelsPreview, setReelsPreview] = useState<string>('');
    const [storiesPreview, setStoriesPreview] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ConteudoFormData>({
        resolver: zodResolver(conteudoSchema),
    });

    const handleFileChange = (type: TipoConteudo, e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        if (type === 'imagem_estatica') {
            setStaticFile(selectedFiles[0]);
            setStaticPreview(URL.createObjectURL(selectedFiles[0]));
        } else if (type === 'carrossel') {
            setCarouselFiles(prev => [...prev, ...selectedFiles]);
            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setCarouselPreviews(prev => [...prev, ...newPreviews]);
        } else if (type === 'reels') {
            setReelsFile(selectedFiles[0]);
            setReelsPreview(URL.createObjectURL(selectedFiles[0]));
        } else if (type === 'stories') {
            setStoriesFile(selectedFiles[0]);
            setStoriesPreview(URL.createObjectURL(selectedFiles[0]));
        }
    };

    const removeFile = (type: TipoConteudo, index?: number) => {
        if (type === 'imagem_estatica') {
            setStaticFile(null);
            setStaticPreview('');
        } else if (type === 'carrossel' && index !== undefined) {
            setCarouselFiles(prev => prev.filter((_, i) => i !== index));
            setCarouselPreviews(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'reels') {
            setReelsFile(null);
            setReelsPreview('');
        } else if (type === 'stories') {
            setStoriesFile(null);
            setStoriesPreview('');
        }
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
        if (!staticFile && carouselFiles.length === 0 && !reelsFile && !storiesFile) {
            setError('Por favor, selecione pelo menos um arquivo em qualquer uma das categorias');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let contentData: any = {
                data_postagem: data.data_postagem,
                descricao: data.descricao || null,
            };

            // Upload static
            if (staticFile) {
                contentData.imagem_estatica = await uploadFile(staticFile);
            }

            // Upload carousel
            if (carouselFiles.length > 0) {
                const uploadPromises = carouselFiles.map(file => uploadFile(file));
                const urls = await Promise.all(uploadPromises);
                const carouselData: CarouselItem[] = urls.map((url, index) => ({
                    posicao: index + 1,
                    imagem_url: url,
                }));
                contentData.carrossel = carouselData;
            }

            // Upload reels
            if (reelsFile) {
                contentData.reels = await uploadFile(reelsFile);
            }

            // Upload stories
            if (storiesFile) {
                contentData.stories = await uploadFile(storiesFile);
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
        <div className="min-h-screen text-slate-200 bg-transparent">
            <div className="mb-6">
                <Link
                    href="/conteudos"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Link>
            </div>

            <div className="max-w-4xl">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Novo Conteúdo</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
                    <div className="glass-card p-4 md:p-6 rounded-xl space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <input
                                    {...register('descricao')}
                                    id="descricao"
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                                    placeholder="Breve descrição..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Static Image Section */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Imagem Estática</h3>
                            {!staticPreview ? (
                                <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-purple-500/50 transition-all">
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange('imagem_estatica', e)} className="hidden" id="static-up" />
                                    <label htmlFor="static-up" className="cursor-pointer block">
                                        <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                        <span className="text-xs text-slate-400">Clique para subir</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative group rounded-lg overflow-hidden border border-slate-700">
                                    <img src={staticPreview} className="w-full h-40 object-cover" />
                                    <button onClick={() => removeFile('imagem_estatica')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Reels Section */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Reels</h3>
                            {!reelsPreview ? (
                                <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-orange-500/50 transition-all">
                                    <input type="file" accept="video/*" onChange={(e) => handleFileChange('reels', e)} className="hidden" id="reels-up" />
                                    <label htmlFor="reels-up" className="cursor-pointer block">
                                        <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                        <span className="text-xs text-slate-400">Clique para subir vídeo</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative group rounded-lg overflow-hidden border border-slate-700">
                                    <video src={reelsPreview} className="w-full h-40 object-cover" controls />
                                    <button onClick={() => removeFile('reels')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Stories Section */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider">Stories</h3>
                            {!storiesPreview ? (
                                <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-pink-500/50 transition-all">
                                    <input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange('stories', e)} className="hidden" id="stories-up" />
                                    <label htmlFor="stories-up" className="cursor-pointer block">
                                        <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                        <span className="text-xs text-slate-400">Clique para subir</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative group rounded-lg overflow-hidden border border-slate-700">
                                    {storiesFile?.type.startsWith('video') ? (
                                        <video src={storiesPreview} className="w-full h-40 object-cover" controls />
                                    ) : (
                                        <img src={storiesPreview} className="w-full h-40 object-cover" />
                                    )}
                                    <button onClick={() => removeFile('stories')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Carousel Section */}
                        <div className="glass-card p-4 rounded-xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Carrossel</h3>
                                <div className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                                    {carouselFiles.length} arquivos
                                </div>
                            </div>
                            <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-blue-500/50 transition-all">
                                <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange('carrossel', e)} className="hidden" id="carousel-up" />
                                <label htmlFor="carousel-up" className="cursor-pointer block">
                                    <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                    <span className="text-xs text-slate-400">Adicionar imagens</span>
                                </label>
                            </div>
                            {carouselPreviews.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {carouselPreviews.map((p, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded border border-slate-700 overflow-hidden">
                                            <img src={p} className="w-full h-full object-cover" />
                                            <button onClick={() => removeFile('carrossel', idx)} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full">
                                                <X className="h-2 w-2" />
                                            </button>
                                            <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1 rounded">{idx + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 sticky bottom-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-900/40"
                        >
                            {isLoading ? 'Salvando...' : 'Agendar Tudo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
