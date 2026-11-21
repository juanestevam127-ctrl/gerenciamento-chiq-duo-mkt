import { Cliente, Conteudo, ControlePostagem, WebhookRetryLog, CarouselItem } from '@/types/database';

const NOCODB_URL = process.env.NOCODB_URL || 'https://evolution-nocodb.5rqumh.easypanel.host';
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN || 'C2l41lZPrFvg6UrzEpB6bwe0tD5bLMFWeuWjAlZD';

const TABLES = {
    CLIENTES: process.env.NOCODB_TABLE_CLIENTES || 'mvz746a2z270f7v',
    CONTEUDOS: process.env.NOCODB_TABLE_CONTEUDOS || 'm9uqbp3heblqb41',
    CONTROLE: process.env.NOCODB_TABLE_CONTROLE || 'm3cc20mid3cct83',
    USUARIOS: process.env.NOCODB_TABLE_USUARIOS || 'm1cyi8srr85v2lg',
    WEBHOOK_LOG: process.env.NOCODB_TABLE_WEBHOOK_LOG || 'mxvi5v4ah78l3k7',
    TOKEN_FB: process.env.NOCODB_TABLE_TOKEN_FB || 'mw9xpm5dl6liiwj',
};

async function nocoFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${NOCODB_URL.replace(/\/$/, '')}${endpoint}`;
    const headers: Record<string, string> = {
        'xc-token': NOCODB_API_TOKEN,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
            errorData = JSON.parse(errorText);
        } catch {
            errorData = { message: errorText };
        }
        throw new Error(errorData.message || errorData.msg || `NocoDB request failed: ${response.status}`);
    }

    return response.json();
}

// ----------------------------------------
// Mappers: NocoDB Column Titles -> App Types
// ----------------------------------------

function mapCliente(row: any): Cliente {
    return {
        id: String(row.Id ?? row.id ?? ''),
        nome_cliente: row['Nome do Cliente'] || row.nome_cliente || '',
        username_instagram: row['Username Instagram'] || row.username_instagram || '',
        id_instagram: String(row['ID Instagram'] || row.id_instagram || ''),
        horario_postagem: row['Horario Postagem'] || row.horario_postagem || undefined,
        token: row['Token Instagram'] || row.token || undefined,
        webhook: row['Webhook'] || row.webhook || undefined,
        id_pagina_facebook: row['ID Pagina Facebook'] || row.id_pagina_facebook || undefined,
        token_facebook: row['Token Facebook'] || row.token_facebook || undefined,
        data_atualizacao_token: row['Data Atualizacao Token'] || row.data_atualizacao_token || undefined,
        created_at: row.CreatedAt || row.created_at || '',
        updated_at: row.UpdatedAt || row.updated_at || '',
    };
}

function mapConteudo(row: any): Conteudo {
    let carrossel: CarouselItem[] | undefined = undefined;
    const rawCarrossel = row.Carrossel || row.carrossel;
    if (rawCarrossel) {
        if (typeof rawCarrossel === 'string') {
            try {
                carrossel = JSON.parse(rawCarrossel);
            } catch {
                carrossel = undefined;
            }
        } else if (Array.isArray(rawCarrossel)) {
            carrossel = rawCarrossel;
        }
    }

    return {
        id: String(row.Id ?? row.id ?? ''),
        data_postagem: row['Data Postagem'] || row.data_postagem || '',
        descricao: row.Descricao || row.descricao || undefined,
        imagem_estatica: row['Imagem Estatica'] || row.imagem_estatica || undefined,
        carrossel,
        reels: row.Reels || row.reels || undefined,
        stories: row.Stories || row.stories || undefined,
        id_instagram: row['ID Instagram'] || row.id_instagram || undefined,
        created_at: row.CreatedAt || row.created_at || '',
        updated_at: row.UpdatedAt || row.updated_at || '',
    };
}

function mapControle(row: any): ControlePostagem {
    return {
        id: String(row.Id ?? row.id ?? ''),
        data_postagem: row['Data Postagem'] || row.data_postagem || '',
        id_instagram: String(row['ID Instagram'] || row.id_instagram || ''),
        tipo_postagem: row['Tipo Postagem'] || row.tipo_postagem || 'FEED',
        conteudo_id: row['Conteudo ID'] || row.conteudo_id || undefined,
        conteudo_postado: row['Conteúdo Postado'] || row.conteudo_postado || row['conteudo_postado'] || undefined,
        created_at: row.CreatedAt || row.created_at || '',
    };
}

function mapWebhookRetryLog(row: any): WebhookRetryLog {
    return {
        id: String(row.Id ?? row.id ?? ''),
        id_instagram: String(row['ID Instagram'] || row.id_instagram || ''),
        data_postagem: row['Data Postagem'] || row.data_postagem || '',
        tentativa: Number(row.Tentativa || row.tentativa || 1),
        disparado_em: row['Disparado Em'] || row.disparado_em || row.CreatedAt || '',
        status: (row.Status || row.status || 'pending').toLowerCase() as any,
    };
}

// ----------------------------------------
// NocoDB Client API Methods
// ----------------------------------------

export const nocodb = {
    // ---------------- CLIENTES ----------------
    clientes: {
        async list(): Promise<Cliente[]> {
            const sortParam = encodeURIComponent('Nome do Cliente');
            const data = await nocoFetch<{ list: any[] }>(
                `/api/v2/tables/${TABLES.CLIENTES}/records?sort=${sortParam}&limit=1000`
            );
            return (data.list || []).map(mapCliente);
        },

        async getById(id: string | number): Promise<Cliente | null> {
            try {
                const row = await nocoFetch<any>(
                    `/api/v2/tables/${TABLES.CLIENTES}/records/${id}`
                );
                return row ? mapCliente(row) : null;
            } catch (err) {
                return null;
            }
        },

        async getByInstagramId(id_instagram: string): Promise<Cliente | null> {
            try {
                const where = encodeURIComponent(`(ID Instagram,eq,${id_instagram})`);
                const data = await nocoFetch<{ list: any[] }>(
                    `/api/v2/tables/${TABLES.CLIENTES}/records?where=${where}&limit=1`
                );
                return data.list?.length ? mapCliente(data.list[0]) : null;
            } catch {
                return null;
            }
        },

        async create(data: Partial<Cliente>): Promise<Cliente> {
            const payload: Record<string, any> = {
                'Nome do Cliente': data.nome_cliente,
                'Username Instagram': data.username_instagram,
                'ID Instagram': data.id_instagram,
                'Horario Postagem': data.horario_postagem || null,
                'Token Instagram': data.token || null,
                'Webhook': data.webhook || null,
                'ID Pagina Facebook': data.id_pagina_facebook || null,
                'Token Facebook': data.token_facebook || null,
            };

            const res = await nocoFetch<any>(
                `/api/v2/tables/${TABLES.CLIENTES}/records`,
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }
            );

            // Fetch the full record to return
            const created = await nocodb.clientes.getById(res.Id || res.id);
            if (!created) throw new Error('Cliente criado mas não foi possível carregá-lo');
            return created;
        },

        async update(id: string | number, data: Partial<Cliente>): Promise<Cliente> {
            const payload: Record<string, any> = { Id: Number(id) };
            if (data.nome_cliente !== undefined) payload['Nome do Cliente'] = data.nome_cliente;
            if (data.username_instagram !== undefined) payload['Username Instagram'] = data.username_instagram;
            if (data.id_instagram !== undefined) payload['ID Instagram'] = data.id_instagram;
            if (data.horario_postagem !== undefined) payload['Horario Postagem'] = data.horario_postagem;
            if (data.token !== undefined) payload['Token Instagram'] = data.token;
            if (data.webhook !== undefined) payload['Webhook'] = data.webhook;
            if (data.id_pagina_facebook !== undefined) payload['ID Pagina Facebook'] = data.id_pagina_facebook;
            if (data.token_facebook !== undefined) payload['Token Facebook'] = data.token_facebook;

            await nocoFetch(
                `/api/v2/tables/${TABLES.CLIENTES}/records`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                }
            );

            const updated = await nocodb.clientes.getById(id);
            if (!updated) throw new Error('Cliente atualizado mas não foi possível carregá-lo');
            return updated;
        },

        async delete(id: string | number): Promise<boolean> {
            await nocoFetch(
                `/api/v2/tables/${TABLES.CLIENTES}/records`,
                {
                    method: 'DELETE',
                    body: JSON.stringify({ Id: Number(id) }),
                }
            );
            return true;
        },
    },

    // ---------------- CONTEUDOS ----------------
    conteudos: {
        async list(params?: { startDate?: string; endDate?: string; date?: string; limit?: number }): Promise<Conteudo[]> {
            let whereClause = '';
            if (params?.date) {
                whereClause = `(Data Postagem,eq,exactDate,${params.date})`;
            } else if (params?.startDate && params?.endDate) {
                whereClause = `(Data Postagem,gte,exactDate,${params.startDate})~and(Data Postagem,lte,exactDate,${params.endDate})`;
            } else if (params?.startDate) {
                whereClause = `(Data Postagem,gte,exactDate,${params.startDate})`;
            } else if (params?.endDate) {
                whereClause = `(Data Postagem,lte,exactDate,${params.endDate})`;
            }

            const limit = params?.limit || 500;
            const sortParam = encodeURIComponent('-Data Postagem');
            let url = `/api/v2/tables/${TABLES.CONTEUDOS}/records?sort=${sortParam}&limit=${limit}`;
            if (whereClause) {
                url += `&where=${encodeURIComponent(whereClause)}`;
            }

            const data = await nocoFetch<{ list: any[] }>(url);
            return (data.list || []).map(mapConteudo);
        },

        async getById(id: string | number): Promise<Conteudo | null> {
            try {
                const row = await nocoFetch<any>(
                    `/api/v2/tables/${TABLES.CONTEUDOS}/records/${id}`
                );
                return row ? mapConteudo(row) : null;
            } catch {
                return null;
            }
        },

        async create(data: Partial<Conteudo>): Promise<Conteudo> {
            let carrosselVal: any = null;
            if (data.carrossel) {
                carrosselVal = typeof data.carrossel === 'string' 
                    ? data.carrossel 
                    : JSON.stringify(data.carrossel);
            }

            const payload: Record<string, any> = {
                'Data Postagem': data.data_postagem,
                'Descricao': data.descricao || null,
                'Imagem Estatica': data.imagem_estatica || null,
                'Carrossel': carrosselVal,
                'Reels': data.reels || null,
                'Stories': data.stories || null,
                'ID Instagram': data.id_instagram || null,
            };

            const res = await nocoFetch<any>(
                `/api/v2/tables/${TABLES.CONTEUDOS}/records`,
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }
            );

            const created = await nocodb.conteudos.getById(res.Id || res.id);
            if (!created) throw new Error('Conteúdo criado mas não foi possível carregá-lo');
            return created;
        },

        async update(id: string | number, data: Partial<Conteudo>): Promise<Conteudo> {
            const payload: Record<string, any> = { Id: Number(id) };
            if (data.data_postagem !== undefined) payload['Data Postagem'] = data.data_postagem;
            if (data.descricao !== undefined) payload['Descricao'] = data.descricao;
            if (data.imagem_estatica !== undefined) payload['Imagem Estatica'] = data.imagem_estatica;
            if (data.carrossel !== undefined) {
                payload['Carrossel'] = typeof data.carrossel === 'string'
                    ? data.carrossel
                    : JSON.stringify(data.carrossel);
            }
            if (data.reels !== undefined) payload['Reels'] = data.reels;
            if (data.stories !== undefined) payload['Stories'] = data.stories;
            if (data.id_instagram !== undefined) payload['ID Instagram'] = data.id_instagram;

            await nocoFetch(
                `/api/v2/tables/${TABLES.CONTEUDOS}/records`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                }
            );

            const updated = await nocodb.conteudos.getById(id);
            if (!updated) throw new Error('Conteúdo atualizado mas não foi possível carregá-lo');
            return updated;
        },

        async delete(id: string | number): Promise<boolean> {
            await nocoFetch(
                `/api/v2/tables/${TABLES.CONTEUDOS}/records`,
                {
                    method: 'DELETE',
                    body: JSON.stringify({ Id: Number(id) }),
                }
            );
            return true;
        },
    },

    // ---------------- CONTROLE DE POSTAGENS ----------------
    controlePostagens: {
        async list(params?: {
            date?: string;
            startDate?: string;
            endDate?: string;
            id_instagram?: string;
            limit?: number;
        }): Promise<ControlePostagem[]> {
            const clauses: string[] = [];

            if (params?.date) {
                clauses.push(`(Data Postagem,eq,exactDate,${params.date})`);
            } else {
                if (params?.startDate) {
                    clauses.push(`(Data Postagem,gte,exactDate,${params.startDate})`);
                }
                if (params?.endDate) {
                    clauses.push(`(Data Postagem,lte,exactDate,${params.endDate})`);
                }
            }

            if (params?.id_instagram) {
                clauses.push(`(ID Instagram,eq,${params.id_instagram})`);
            }

            const whereClause = clauses.join('~and');
            const limit = params?.limit || 1000;
            const sortParam = encodeURIComponent('-Data Postagem');
            let url = `/api/v2/tables/${TABLES.CONTROLE}/records?sort=${sortParam}&limit=${limit}`;
            if (whereClause) {
                url += `&where=${encodeURIComponent(whereClause)}`;
            }

            const data = await nocoFetch<{ list: any[] }>(url);
            return (data.list || []).map(mapControle);
        },

        async create(data: Partial<ControlePostagem>): Promise<ControlePostagem> {
            const payload: Record<string, any> = {
                'Data Postagem': data.data_postagem,
                'ID Instagram': data.id_instagram,
                'Tipo Postagem': data.tipo_postagem,
                'Conteudo ID': data.conteudo_id || null,
                'Conteúdo Postado': data.conteudo_postado || null,
            };

            const res = await nocoFetch<any>(
                `/api/v2/tables/${TABLES.CONTROLE}/records`,
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }
            );

            return {
                id: String(res.Id || res.id),
                data_postagem: data.data_postagem || '',
                id_instagram: String(data.id_instagram || ''),
                tipo_postagem: data.tipo_postagem || 'FEED',
                conteudo_id: data.conteudo_id,
                conteudo_postado: data.conteudo_postado,
                created_at: new Date().toISOString(),
            };
        },

        async delete(id: string | number): Promise<boolean> {
            await nocoFetch(
                `/api/v2/tables/${TABLES.CONTROLE}/records`,
                {
                    method: 'DELETE',
                    body: JSON.stringify({ Id: Number(id) }),
                }
            );
            return true;
        },
    },

    // ---------------- USUARIOS ----------------
    usuarios: {
        async findByEmail(email: string): Promise<{ id: string; email: string; senha?: string; nome?: string } | null> {
            try {
                const where = encodeURIComponent(`(Email,eq,${email.trim().toLowerCase()})`);
                const data = await nocoFetch<{ list: any[] }>(
                    `/api/v2/tables/${TABLES.USUARIOS}/records?where=${where}&limit=1`
                );
                if (!data.list || data.list.length === 0) return null;
                const row = data.list[0];
                return {
                    id: String(row.Id || row.id),
                    email: row.Email || row.email,
                    senha: row.Senha || row.senha,
                    nome: row.Nome || row.nome || 'Administrador',
                };
            } catch (err) {
                console.error('Error finding user in NocoDB:', err);
                return null;
            }
        },
    },

    // ---------------- WEBHOOK RETRY LOG ----------------
    webhookRetryLog: {
        async list(params?: { date?: string; id_instagram?: string }): Promise<WebhookRetryLog[]> {
            const clauses: string[] = [];
            if (params?.date) clauses.push(`(Data Postagem,eq,exactDate,${params.date})`);
            if (params?.id_instagram) clauses.push(`(ID Instagram,eq,${params.id_instagram})`);

            const whereClause = clauses.join('~and');
            let url = `/api/v2/tables/${TABLES.WEBHOOK_LOG}/records?limit=100`;
            if (whereClause) url += `&where=${encodeURIComponent(whereClause)}`;

            try {
                const data = await nocoFetch<{ list: any[] }>(url);
                return (data.list || []).map(mapWebhookRetryLog);
            } catch {
                return [];
            }
        },

        async create(data: Partial<WebhookRetryLog>): Promise<WebhookRetryLog> {
            const payload: Record<string, any> = {
                'ID Instagram': data.id_instagram,
                'Data Postagem': data.data_postagem,
                'Tentativa': data.tentativa || 1,
                'Disparado Em': data.disparado_em || new Date().toISOString(),
                'Status': (data.status || 'pending').toUpperCase(),
            };

            const res = await nocoFetch<any>(
                `/api/v2/tables/${TABLES.WEBHOOK_LOG}/records`,
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }
            );

            return {
                id: String(res.Id || res.id),
                id_instagram: String(data.id_instagram || ''),
                data_postagem: data.data_postagem || '',
                tentativa: Number(data.tentativa || 1),
                disparado_em: data.disparado_em || new Date().toISOString(),
                status: data.status || 'pending',
            };
        },

        async update(id: string | number, data: Partial<WebhookRetryLog>): Promise<boolean> {
            const payload: Record<string, any> = { Id: Number(id) };
            if (data.tentativa !== undefined) payload['Tentativa'] = data.tentativa;
            if (data.status !== undefined) payload['Status'] = data.status.toUpperCase();
            if (data.disparado_em !== undefined) payload['Disparado Em'] = data.disparado_em;

            await nocoFetch(
                `/api/v2/tables/${TABLES.WEBHOOK_LOG}/records`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                }
            );
            return true;
        },
    },
};
