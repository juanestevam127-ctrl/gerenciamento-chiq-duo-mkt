export interface Cliente {
    id: string;
    nome_cliente: string;
    username_instagram: string;
    id_instagram: string;
    horario_postagem?: string;
    token?: string;
    webhook?: string;
    id_pagina_facebook?: string;
    token_facebook?: string;
    created_at: string;
    updated_at: string;
}

export interface Conteudo {
    id: string;
    data_postagem: string;
    descricao?: string;
    imagem_estatica?: string;
    carrossel?: CarouselItem[];
    reels?: string;
    stories?: string;
    id_instagram?: string; // Relation to Cliente
    created_at: string;
    updated_at: string;
}

export interface CarouselItem {
    posicao: number;
    imagem_url: string;
}

export interface ControlePostagem {
    id: string;
    data_postagem: string;
    id_instagram: string;
    tipo_postagem: 'FEED' | 'STORIES' | 'FEED FACEBOOK' | 'STORIES FACEBOOK';
    conteudo_id?: string;
    created_at: string;
}

export interface WebhookRetryLog {
    id: string;
    id_instagram: string;
    data_postagem: string;
    tentativa: number;
    disparado_em: string;
    status: 'pending' | 'success' | 'failed';
}

export type TipoConteudo = 'imagem_estatica' | 'carrossel' | 'reels' | 'stories';

export type StatusPostagem = 'COMPLETED' | 'PENDING' | 'MISSED' | 'NO_CONTENT';
