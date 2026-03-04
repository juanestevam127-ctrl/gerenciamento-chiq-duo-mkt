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
    const [tipoConteudo, setTipoConteudo] =
        useState<TipoConteudo>("imagem_estatica");
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    // Store existing URLs to handle updates correctly (add vs keep)
    const [existingUrls, setExistingUrls] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
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

                    // Determine type and set previews
                    let tipo: TipoConteudo = "imagem_estatica";
                    let initialPreviews: string[] = [];

                    if (data.imagem_estatica) {
                        tipo = "imagem_estatica";
                        initialPreviews = [data.imagem_estatica];
                    } else if (data.carrossel) {
                        tipo = "carrossel";
                        // Assuming carrossel is array of objects { posicao, imagem_url }
                        initialPreviews = data.carrossel
                            .sort((a: any, b: any) => a.posicao - b.posicao)
                            .map((item: any) => item.imagem_url);
                    } else if (data.reels) {
                        tipo = "reels";
                        initialPreviews = [data.reels];
                    } else if (data.stories) {
                        tipo = "stories";
                        initialPreviews = [data.stories];
                    }

                    setTipoConteudo(tipo);
                    setValue("tipo_conteudo", tipo);
                    setExistingUrls(initialPreviews);
                    setPreviews(initialPreviews);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (tipoConteudo === "carrossel") {
            setFiles([...files, ...selectedFiles]);
            const newPreviews = selectedFiles.map((file) =>
                URL.createObjectURL(file)
            );
            setPreviews([...previews, ...newPreviews]);
        } else {
            setFiles([selectedFiles[0]]);
            setPreviews([URL.createObjectURL(selectedFiles[0])]);
            setExistingUrls([]); // Clear existing if replacing single file
        }
    };

    const removeFile = (index: number) => {
        // Logic to remove from files array OR existingUrls depending on index
        // This is tricky because existingUrls come first in display
        const numExisting = existingUrls.length;

        if (index < numExisting) {
            // Removing an existing URL
            const newExisting = existingUrls.filter((_, i) => i !== index);
            setExistingUrls(newExisting);
            setPreviews(previews.filter((_, i) => i !== index));
        } else {
            // Removing a new file
            const fileIndex = index - numExisting;
            setFiles(files.filter((_, i) => i !== fileIndex));
            setPreviews(previews.filter((_, i) => i !== index));
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
        // If no new files and no existing urls, error
        if (files.length === 0 && existingUrls.length === 0) {
            setError("Por favor, selecione pelo menos um arquivo");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Upload new files
            const newUrls = await Promise.all(files.map((file) => uploadFile(file)));
            const allUrls = [...existingUrls, ...newUrls];

            let contentData: any = {
                data_postagem: data.data_postagem,
                descricao: data.descricao || null,
                imagem_estatica: null,
                carrossel: null,
                reels: null,
                stories: null,
            };

            if (tipoConteudo === "imagem_estatica") {
                contentData.imagem_estatica = allUrls[0];
            } else if (tipoConteudo === "carrossel") {
                const carouselData: CarouselItem[] = allUrls.map((url, index) => ({
                    posicao: index + 1,
                    imagem_url: url,
                }));
                contentData.carrossel = carouselData;
            } else if (tipoConteudo === "reels") {
                contentData.reels = allUrls[0];
            } else if (tipoConteudo === "stories") {
                contentData.stories = allUrls[0];
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
            setError(
                err.message || "Erro ao atualizar conteúdo. Tente novamente."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="p-8">Carregando...</div>;
    }

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
                <h1 className="text-3xl font-bold text-white mb-6">
                    Editar Conteúdo
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="glass-card p-6 rounded-xl space-y-6"
                >
                    <div>
                        <label
                            htmlFor="data_postagem"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Data da Postagem *
                        </label>
                        <input
                            {...register("data_postagem")}
                            type="date"
                            id="data_postagem"
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                        />
                        {errors.data_postagem && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.data_postagem.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="descricao"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Descrição (Opcional)
                        </label>
                        <textarea
                            {...register("descricao")}
                            id="descricao"
                            rows={4}
                            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                            placeholder="Descrição do conteúdo..."
                        />
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Tipo de Conteúdo
                        </label>
                        <span className="text-lg font-bold text-purple-400 uppercase tracking-wider">{tipoConteudo}</span>
                        <p className="text-xs text-slate-500 mt-1">
                            (Para mudar o tipo, crie um novo conteúdo)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Upload de Arquivo(s)
                        </label>
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500/70 hover:bg-slate-800/30 transition-all group">
                            <Upload className="h-12 w-12 text-slate-500 mx-auto mb-3 group-hover:text-purple-400 transition-colors" />
                            <input
                                type="file"
                                accept={tipoConteudo === "reels" ? "video/*" : "image/*"}
                                multiple={tipoConteudo === "carrossel"}
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium"
                            >
                                Clique para selecionar{" "}
                                {tipoConteudo === "carrossel" ? "imagens" : "arquivo"}
                            </label>
                            <p className="text-sm text-slate-500 mt-1">
                                Adicionar mais arquivos
                            </p>
                        </div>
                    </div>

                    {/* File Previews */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    {/* Basic check for video vs image content */}
                                    {tipoConteudo === "reels" || preview.includes(".mp4") ? (
                                        <video
                                            src={preview}
                                            className="w-full h-32 object-cover rounded-lg border border-slate-700 shadow-lg"
                                        />
                                    ) : (
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-slate-700 shadow-lg"
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    {tipoConteudo === "carrossel" && (
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

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                        >
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
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
