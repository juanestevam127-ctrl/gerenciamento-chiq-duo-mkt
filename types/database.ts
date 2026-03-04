export interface Cliente {
    id: string;
    nome_cliente: string;
    username_instagram: string;
    id_instagram: string;
    horario_postagem?: string;
    token?: string;
    webhook?: string;
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
    tipo_postagem: 'FEED' | 'STORIES';
    conteudo_id?: string;
    created_at: string;
}

export type TipoConteudo = 'imagem_estatica' | 'carrossel' | 'reels' | 'stories';

export type StatusPostagem = 'COMPLETED' | 'PENDING' | 'MISSED' | 'NO_CONTENT';
