import { z } from 'zod';

export const clienteSchema = z.object({
    nome_cliente: z.string().min(1, 'Nome do cliente é obrigatório'),
    username_instagram: z.string().min(1, 'Username do Instagram é obrigatório'),
    id_instagram: z.string().min(1, 'ID do Instagram é obrigatório'),
    horario_postagem: z.string().optional(),
    token: z.string().optional(),
    webhook: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const conteudoSchema = z.object({
    data_postagem: z.string().min(1, 'Data da postagem é obrigatória'),
    descricao: z.string().optional(),
    id_instagram: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

export const postSchema = z.object({
    data_postagem: z.string().min(1, 'Data da postagem é obrigatória'),
    id_instagram: z.string().min(1, 'Cliente é obrigatório'),
    tipo_postagem: z.enum(['FEED', 'STORIES']),
    conteudo_id: z.string().optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
export type ConteudoFormData = z.infer<typeof conteudoSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PostFormData = z.infer<typeof postSchema>;
