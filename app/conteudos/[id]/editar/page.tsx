"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conteudoSchema, type ConteudoFormData } from "@/lib/validations";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { TipoConteudo, CarouselItem } from "@/types/database";

export default function EditarConteudoPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // States for each type
    const [staticFile, setStaticFile] = useState<File | null>(null);
    const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
    const [reelsFile, setReelsFile] = useState<File | null>(null);
    const [storiesFile, setStoriesFile] = useState<File | null>(null);

    // Existing URLs (to keep track of what's already on the server)
    const [existingStaticUrl, setExistingStaticUrl] = useState<string>("");
    const [existingCarouselUrls, setExistingCarouselUrls] = useState<string[]>([]);
    const [existingReelsUrl, setExistingReelsUrl] = useState<string>("");
    const [existingStoriesUrl, setExistingStoriesUrl] = useState<string>("");

    // Previews (combined existing + new)
    const [staticPreview, setStaticPreview] = useState<string>("");
    const [carouselPreviews, setCarouselPreviews] = useState<string[]>([]);
    const [reelsPreview, setReelsPreview] = useState<string>("");
    const [storiesPreview, setStoriesPreview] = useState<string>("");

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ConteudoFormData>({
        resolver: zodResolver(conteudoSchema),
    });

    useEffect(() => {
        const fetchConteudo = async () => {
            try {
                const response = await fetch(`/api/conteudos/${resolvedParams.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setValue("data_postagem", data.data_postagem);
                    setValue("descricao", data.descricao || "");

                    if (data.imagem_estatica) {
                        setExistingStaticUrl(data.imagem_estatica);
                        setStaticPreview(data.imagem_estatica);
                    }
                    if (data.carrossel) {
                        const urls = data.carrossel
                            .sort((a: any, b: any) => a.posicao - b.posicao)
                            .map((item: any) => item.imagem_url);
                        setExistingCarouselUrls(urls);
                        setCarouselPreviews(urls);
                    }
                    if (data.reels) {
                        setExistingReelsUrl(data.reels);
                        setReelsPreview(data.reels);
                    }
                    if (data.stories) {
                        setExistingStoriesUrl(data.stories);
                        setStoriesPreview(data.stories);
                    }
                } else {
                    setError("Conteúdo não encontrado");
                }
            } catch (err) {
                setError("Erro ao carregar conteúdo");
            } finally {
                setIsFetching(false);
            }
        };

        fetchConteudo();
    }, [resolvedParams.id, setValue]);

    const handleFileChange = (type: TipoConteudo, e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        if (type === 'imagem_estatica') {
            setStaticFile(selectedFiles[0]);
            setExistingStaticUrl(""); // Overwriting existing
            setStaticPreview(URL.createObjectURL(selectedFiles[0]));
        } else if (type === 'carrossel') {
            setCarouselFiles(prev => [...prev, ...selectedFiles]);
            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setCarouselPreviews(prev => [...prev, ...newPreviews]);
        } else if (type === 'reels') {
            setReelsFile(selectedFiles[0]);
            setExistingReelsUrl(""); // Overwriting existing
            setReelsPreview(URL.createObjectURL(selectedFiles[0]));
        } else if (type === 'stories') {
            setStoriesFile(selectedFiles[0]);
            setExistingStoriesUrl(""); // Overwriting existing
            setStoriesPreview(URL.createObjectURL(selectedFiles[0]));
        }
    };

    const removeFile = (type: TipoConteudo, index?: number) => {
        if (type === 'imagem_estatica') {
            setStaticFile(null);
            setExistingStaticUrl("");
            setStaticPreview("");
        } else if (type === 'carrossel' && index !== undefined) {
            const numExisting = existingCarouselUrls.length;
            if (index < numExisting) {
                setExistingCarouselUrls(prev => prev.filter((_, i) => i !== index));
            } else {
                setCarouselFiles(prev => prev.filter((_, i) => i !== (index - numExisting)));
            }
            setCarouselPreviews(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'reels') {
            setReelsFile(null);
            setExistingReelsUrl("");
            setReelsPreview("");
        } else if (type === 'stories') {
            setStoriesFile(null);
            setExistingStoriesUrl("");
            setStoriesPreview("");
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
        if (!staticPreview && carouselPreviews.length === 0 && !reelsPreview && !storiesPreview) {
            setError("Por favor, selecione pelo menos um arquivo");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            let contentData: any = {
                data_postagem: data.data_postagem,
                descricao: data.descricao || null,
                imagem_estatica: existingStaticUrl || null,
                carrossel: null,
                reels: existingReelsUrl || null,
                stories: existingStoriesUrl || null,
                id_instagram: data.id_instagram || null,
            };

            // Process static
            if (staticFile) {
                contentData.imagem_estatica = await uploadFile(staticFile);
            }

            // Process carousel
            const newCarouselUrls = await Promise.all(carouselFiles.map(file => uploadFile(file)));
            const allCarouselUrls = [...existingCarouselUrls, ...newCarouselUrls];
            if (allCarouselUrls.length > 0) {
                contentData.carrossel = allCarouselUrls.map((url, index) => ({
                    posicao: index + 1,
                    imagem_url: url,
                }));
            }

            // Process reels
            if (reelsFile) {
                contentData.reels = await uploadFile(reelsFile);
            }

            // Process stories
            if (storiesFile) {
                contentData.stories = await uploadFile(storiesFile);
            }

            const response = await fetch(`/api/conteudos/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contentData),
            });

            if (response.ok) {
                router.push("/conteudos");
            } else {
                const result = await response.json();
                setError(result.error || "Erro ao atualizar conteúdo");
            }
        } catch (err: any) {
            setError(err.message || "Erro ao atualizar conteúdo. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="p-8">Carregando...</div>;
    }

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
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    Editar Conteúdo
                </h1>

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
                                <textarea
                                    {...register('descricao')}
                                    id="descricao"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 resize-y min-h-[100px]"
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
                                    <video src={storiesPreview} className="w-full h-40 object-cover" controls />
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
                                    {carouselPreviews.length} arquivos
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
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
