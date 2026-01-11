<p align="center">
  <img src="src/assets/logo-linkou-horizontal-roxo.png" alt="Linkou Logo" width="280"/>
</p>

<h1 align="center">Linkou</h1>

<p align="center">
  <strong>Plataforma SaaS para Gestão de Agências de Marketing Digital</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Produção-success?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License"/>
</p>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Modelo de Dados](#-modelo-de-dados)
- [Instalação Local](#-instalação-local)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Deploy em VPS](#-deploy-em-vps)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Segurança](#-segurança)
- [Contribuição](#-contribuição)
- [Licença](#-licença)
- [Contato](#-contato)

---

## 🎯 Sobre o Projeto

O **Linkou** é uma plataforma completa para gestão de agências de marketing digital, oferecendo um portal administrativo robusto para a equipe interna e um portal exclusivo para clientes acompanharem seus projetos, campanhas e resultados.

### Principais Diferenciais

- 🎨 **Interface Moderna** - Design responsivo com tema claro/escuro
- 📊 **Dashboards Inteligentes** - KPIs e métricas em tempo real
- 🔐 **Multi-tenant** - Isolamento completo de dados por cliente
- 📱 **Mobile-First** - Experiência otimizada para dispositivos móveis
- ⚡ **Performance** - Lazy loading, cache inteligente e otimizações

---

## ✨ Funcionalidades

### Portal do Cliente

| Funcionalidade | Descrição |
|----------------|-----------|
| 📊 **Dashboard** | Visão geral com KPIs, tarefas pendentes e campanhas ativas |
| ✅ **Tarefas** | Kanban interativo para acompanhamento e aprovação de entregas |
| 📢 **Campanhas** | Visualização de campanhas com métricas de performance |
| 📁 **Arquivos** | Gerenciamento de documentos e materiais do projeto |
| 📅 **Agendamentos** | Calendário de reuniões e eventos |
| 🛤️ **Jornada** | Timeline visual do progresso do projeto |
| 📈 **Métricas de Tráfego** | Dados de Google Analytics e Meta Ads |
| 📚 **Base de Conhecimento** | Documentação e tutoriais personalizados |
| 👤 **Minha Conta** | Configurações de perfil e preferências |

### Portal Administrativo

| Funcionalidade | Descrição |
|----------------|-----------|
| 📊 **Dashboard Gerencial** | Métricas globais, performance da equipe e receita |
| 👥 **Gestão de Clientes** | Cadastro, configurações e histórico completo |
| 📋 **Projetos** | Gerenciamento de projetos por cliente |
| ✅ **Tarefas** | Kanban com atribuição, prazos e prioridades |
| 🎯 **Leads** | Pipeline de vendas com Kanban |
| 📢 **Campanhas** | Criação e gestão de campanhas publicitárias |
| 📅 **Agendamentos** | Gestão de agenda da equipe |
| 🚀 **Onboarding** | Fluxo de integração de novos clientes |
| 🌐 **Landing Page** | Configurações de SEO, pixels e UTMs |
| 📄 **Templates** | Modelos de documentos e contratos |
| 👤 **Usuários** | Gestão de usuários e permissões |

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [React](https://react.dev) | 18.3 | Biblioteca para construção de interfaces |
| [TypeScript](https://www.typescriptlang.org) | 5.6 | Superset tipado do JavaScript |
| [Vite](https://vitejs.dev) | 5.4 | Build tool e dev server ultrarrápido |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Framework CSS utility-first |
| [shadcn/ui](https://ui.shadcn.com) | - | Componentes acessíveis e customizáveis |
| [Framer Motion](https://www.framer.com/motion) | 12.x | Animações fluidas e performáticas |
| [TanStack Query](https://tanstack.com/query) | 5.x | Gerenciamento de estado servidor |
| [React Router](https://reactrouter.com) | 6.30 | Roteamento declarativo |
| [React Hook Form](https://react-hook-form.com) | 7.x | Formulários performáticos |
| [Zod](https://zod.dev) | 3.x | Validação de schemas |
| [Recharts](https://recharts.org) | 2.x | Gráficos e visualizações |

### Backend (Supabase)

| Serviço | Descrição |
|---------|-----------|
| **PostgreSQL** | Banco de dados relacional |
| **Row Level Security** | Políticas de segurança por linha |
| **Supabase Auth** | Autenticação e autorização |
| **Supabase Storage** | Armazenamento de arquivos |
| **Edge Functions** | Funções serverless (Deno) |
| **Realtime** | Atualizações em tempo real |

### Ferramentas de Desenvolvimento

| Ferramenta | Descrição |
|------------|-----------|
| ESLint | Linting e padronização de código |
| PostCSS | Processamento de CSS |
| Autoprefixer | Prefixos CSS automáticos |

---

## 🏗️ Arquitetura

```
linkou/
├── public/
│   ├── favicon.png
│   ├── robots.txt
│   └── videos/              # Vídeos da landing page
│
├── src/
│   ├── assets/              # Logos e imagens estáticas
│   │
│   ├── components/
│   │   ├── admin/           # Componentes exclusivos do admin
│   │   │   ├── landing/     # Configurações da landing page
│   │   │   └── onboarding/  # Fluxo de onboarding
│   │   ├── auth/            # AuthForm, ProtectedRoute
│   │   ├── cliente/         # Componentes do portal cliente
│   │   ├── dashboard/       # Cards e seções de dashboard
│   │   ├── journey/         # Timeline e stepper da jornada
│   │   ├── landing/         # Seções da landing page pública
│   │   ├── shared/          # Componentes compartilhados
│   │   └── ui/              # Componentes shadcn/ui (50+)
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx      # Autenticação e roles
│   │   ├── useTheme.tsx     # Tema claro/escuro
│   │   └── use-mobile.tsx   # Detecção de dispositivo
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Cliente Supabase configurado
│   │       └── types.ts     # Tipos gerados do banco
│   │
│   ├── layouts/
│   │   ├── AdminLayout.tsx  # Layout do portal admin
│   │   └── ClientLayout.tsx # Layout do portal cliente
│   │
│   ├── lib/
│   │   ├── segments-config.ts
│   │   ├── status-config.ts
│   │   ├── task-config.ts
│   │   └── utils.ts         # Utilitários (cn, formatters)
│   │
│   ├── pages/
│   │   ├── admin/           # 12 páginas administrativas
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── ClientDetail.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Campaigns.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Templates.tsx
│   │   │   └── Users.tsx
│   │   │
│   │   └── cliente/         # 9 páginas do cliente
│   │       ├── Dashboard.tsx
│   │       ├── Tarefas.tsx
│   │       ├── Campanhas.tsx
│   │       ├── Arquivos.tsx
│   │       ├── Agendamentos.tsx
│   │       ├── MinhaJornada.tsx
│   │       ├── MetricasTrafego.tsx
│   │       ├── BaseConhecimento.tsx
│   │       └── MinhaConta.tsx
│   │
│   ├── App.tsx              # Configuração de rotas
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais e tokens
│
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── check-task-deadlines/
│   │   └── manage-users/
│   ├── migrations/          # 30+ migrações SQL
│   └── config.toml          # Configuração do Supabase
│
├── .env                     # Variáveis de ambiente (não commitado)
├── .env.example             # Exemplo de variáveis
├── tailwind.config.ts       # Configuração do Tailwind
├── vite.config.ts           # Configuração do Vite
└── package.json             # Dependências e scripts
```

---

## 📊 Modelo de Dados

```mermaid
erDiagram
    clients ||--o{ projects : has
    clients ||--o{ profiles : has
    clients ||--o{ campaigns : has
    clients ||--o{ files : has
    clients ||--o{ leads : has
    
    projects ||--o{ tasks : contains
    tasks ||--o{ task_comments : has
    tasks ||--o{ task_files : has
    
    profiles ||--o{ user_roles : has
    profiles ||--o{ notifications : receives
    
    campaigns ||--o{ campaign_comments : has
    
    clients {
        uuid id PK
        string name
        string segment
        string phase
        date contract_start
        jsonb settings
    }
    
    profiles {
        uuid id PK
        uuid client_id FK
        string email
        string full_name
        boolean ponto_focal
        string user_type
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        enum role
    }
    
    projects {
        uuid id PK
        uuid client_id FK
        string name
        string status
        date start_date
        date end_date
    }
    
    tasks {
        uuid id PK
        uuid project_id FK
        string title
        string status
        string priority
        date due_date
        boolean visible_to_client
    }
    
    campaigns {
        uuid id PK
        uuid client_id FK
        string name
        string status
        string platform
        decimal budget
    }
    
    leads {
        uuid id PK
        uuid client_id FK
        string name
        string email
        string status
        string source
    }
```

### Principais Entidades

| Tabela | Descrição |
|--------|-----------|
| `clients` | Empresas/clientes da agência |
| `profiles` | Usuários do sistema (extensão de auth.users) |
| `user_roles` | Papéis dos usuários (admin, account_manager, client) |
| `projects` | Projetos por cliente |
| `tasks` | Tarefas com status, prioridade e prazos |
| `campaigns` | Campanhas publicitárias |
| `leads` | Pipeline de vendas |
| `files` | Arquivos e documentos |
| `notifications` | Sistema de notificações |
| `appointments` | Agendamentos e reuniões |
| `traffic_metrics` | Métricas de tráfego mensais |
| `audit_logs` | Log de auditoria de ações |

---

## 🚀 Instalação Local

### Pré-requisitos

- **Node.js** 18.x ou superior (recomendado: 20.x)
- **npm** 9.x ou **bun** 1.x
- Conta no [Supabase](https://supabase.com)

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/linkou.git
cd linkou

# 2. Instale as dependências
npm install
# ou com bun (mais rápido)
bun install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Edite o arquivo .env com suas credenciais
nano .env

# 5. Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev
```

O aplicativo estará disponível em `http://localhost:8080`

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anônima (anon key) do Supabase | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase | ✅ |

### Obtendo as Credenciais

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings > API**
4. Copie a **URL** e a **anon public key**

---

## 🖥️ Deploy em VPS

Este guia cobre o deploy em um servidor VPS com Ubuntu 22.04+.

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
sudo apt install -y curl git build-essential

# Instalar Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # v20.x.x
npm --version   # 10.x.x

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Configurar Firewall

```bash
# Habilitar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Clonar e Buildar o Projeto

```bash
# Criar diretório da aplicação
sudo mkdir -p /var/www/linkou
sudo chown $USER:$USER /var/www/linkou

# Clonar repositório
cd /var/www/linkou
git clone https://github.com/seu-usuario/linkou.git .

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
nano .env  # Adicione suas credenciais

# Build de produção
npm run build
```

### 4. Configurar Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/linkou
```

Cole o seguinte conteúdo:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    root /var/www/linkou/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # SPA routing - todas as rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache de vídeos
    location ~* \.(mp4|webm|ogg)$ {
        expires 1M;
        add_header Cache-Control "public";
    }

    # Negar acesso a arquivos ocultos
    location ~ /\. {
        deny all;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/linkou /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 5. Configurar SSL com Let's Encrypt

```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br

# Testar renovação automática
sudo certbot renew --dry-run
```

### 6. Script de Deploy Automatizado

Crie o arquivo `/var/www/linkou/deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Iniciando deploy..."

cd /var/www/linkou

echo "📥 Atualizando código..."
git fetch origin main
git reset --hard origin/main

echo "📦 Instalando dependências..."
npm ci --production=false

echo "🏗️ Buildando aplicação..."
npm run build

echo "🔄 Reiniciando Nginx..."
sudo systemctl reload nginx

echo "✅ Deploy concluído com sucesso!"
```

```bash
# Dar permissão de execução
chmod +x /var/www/linkou/deploy.sh
```

### 7. GitHub Actions (CI/CD)

Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/linkou
            ./deploy.sh
```

Configure os secrets no GitHub:
- `VPS_HOST`: IP ou domínio do servidor
- `VPS_USER`: Usuário SSH
- `VPS_SSH_KEY`: Chave privada SSH

### 8. Configuração do Supabase em Produção

#### 8.1 Executar Migrações

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migrações
supabase db push
```

#### 8.2 Deploy das Edge Functions

```bash
# Deploy de todas as funções
supabase functions deploy

# Ou deploy individual
supabase functions deploy manage-users
supabase functions deploy check-task-deadlines
```

#### 8.3 Configurar Secrets das Edge Functions

No [Dashboard do Supabase](https://supabase.com/dashboard) > **Settings > Edge Functions**:

| Secret | Descrição |
|--------|-----------|
| `CRON_SECRET_TOKEN` | Token para autenticação do cron job |

#### 8.4 Configurar Cron Job

Para o check-task-deadlines, configure um cron externo (ex: [cron-job.org](https://cron-job.org)) para chamar:

```
POST https://SEU_PROJECT_REF.supabase.co/functions/v1/check-task-deadlines
Headers: Authorization: Bearer SEU_CRON_SECRET_TOKEN
```

Frequência recomendada: A cada hora ou diariamente às 8h.

---

## 📜 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| **dev** | `npm run dev` | Inicia servidor de desenvolvimento na porta 8080 |
| **build** | `npm run build` | Gera build otimizado para produção |
| **preview** | `npm run preview` | Preview local do build de produção |
| **lint** | `npm run lint` | Executa ESLint para verificação de código |

---

## 🔒 Segurança

### Autenticação

- **Supabase Auth** com suporte a email/senha
- Sessões JWT com refresh automático
- Proteção de rotas no frontend

### Autorização (RBAC)

| Role | Permissões |
|------|------------|
| `admin` | Acesso total ao sistema |
| `account_manager` | Gerenciamento de clientes atribuídos |
| `client` | Acesso apenas ao próprio portal |

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem:
- Clientes só acessam seus próprios dados
- Admins têm acesso global
- Account Managers acessam clientes atribuídos

### Boas Práticas Implementadas

- ✅ Validação de inputs com Zod
- ✅ Sanitização de dados no banco
- ✅ HTTPS obrigatório em produção
- ✅ Headers de segurança no Nginx
- ✅ Tokens JWT com expiração
- ✅ Logs de auditoria para ações sensíveis

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Convenção de Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

Uso não autorizado, cópia, modificação ou distribuição deste software é estritamente proibido.

---

## 📞 Contato

**Linkou - Agência de Marketing Digital**

- 🌐 Website: [seu-dominio.com.br](https://seu-dominio.com.br)
- 📧 Email: contato@seu-dominio.com.br
- 📱 WhatsApp: (XX) XXXXX-XXXX

---

<p align="center">
  Desenvolvido com 💜 pela equipe Linkou
</p>
