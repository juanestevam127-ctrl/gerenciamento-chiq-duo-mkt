# Chiquinho Sorvetes - Gestão de Conteúdo Instagram

Sistema de gerenciamento de conteúdo para Instagram desenvolvido com Next.js 14 e Supabase.

## 🚀 Configuração Inicial

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados Supabase

1. Acesse o painel do Supabase: https://arxaqnwuyesmjcsyfmbj.supabase.co
2. Vá para SQL Editor
3. Execute o script `database-schema.sql` para criar as tabelas

### 3. Configurar Storage Bucket

1. No painel do Supabase, vá para Storage
2. Verifique se o bucket `conteudo-chiquinho` existe
3. Configure as políticas de acesso:
   - Permitir uploads autenticados
   - Permitir leitura pública

### 4. Executar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔐 Login

- **Email:** juanestevam19@outlook.com
- **Senha:** Juan19022003@#

## 📁 Estrutura do Projeto

```
/app
  /api              # API Routes
    /auth           # Autenticação
    /clientes       # CRUD de clientes
    /conteudos      # CRUD de conteúdos
  /clientes         # Páginas de clientes
  /conteudos        # Páginas de conteúdos
  /postagens        # Controle de postagens
  /dashboard        # Dashboard principal
  /configuracoes    # Configurações
/components         # Componentes React
/lib                # Utilitários e configurações
/types              # TypeScript types
```

## ✨ Funcionalidades

### Gerenciamento de Clientes
- ✅ Adicionar clientes com dados do Instagram
- ✅ Editar informações de clientes
- ✅ Excluir clientes
- ✅ Buscar clientes

### Gerenciamento de Conteúdos
- ✅ Criar conteúdos com diferentes tipos:
  - Imagem Estática
  - Carrossel (múltiplas imagens)
  - Reels (vídeo)
  - Stories
- ✅ Upload de arquivos para Supabase Storage
- ✅ Preview de imagens antes do upload
- ✅ Agendar data de postagem
- ✅ Adicionar descrição

### Controle de Postagens
- 🔄 Visualização de calendário (em desenvolvimento)
- ✅ Filtro por cliente
- 🔄 Status de postagens (em desenvolvimento)

### Dashboard
- ✅ Métricas principais
- 🔄 Calendário interativo (em desenvolvimento)

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Supabase** - Backend e Storage
- **TailwindCSS** - Estilização
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Lucide React** - Ícones

## 📝 Próximos Passos

- [ ] Implementar calendário completo com react-big-calendar
- [ ] Adicionar lógica de verificação de status de postagens
- [ ] Implementar dashboard com métricas dinâmicas
- [ ] Adicionar notificações com sonner
- [ ] Implementar drag & drop para reordenar carrossel
