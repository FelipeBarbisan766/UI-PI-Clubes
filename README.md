# Clubera — Frontend

> Sistema para reserva de quadras esportivas online.

Interface web do **Clubera**, uma plataforma que centraliza o gerenciamento de clubes, quadras, horários e reservas esportivas. Desenvolvida em **Angular 21** com **Tailwind CSS** e **daisyUI**, consumindo a [API do Clubera](https://github.com/felipebarbisan766/API-PI-Clubes) (.NET 10).

---

## Sobre o projeto

### História

O Clubera nasceu como projeto acadêmico da **Fatec Taquaritinga**. A motivação veio de um problema comum: o gerenciamento de reservas de quadras esportivas, quando feito de forma manual (planilhas, mensagens, ligações), gera conflitos de horário, perda de informação e muito retrabalho para quem administra o espaço.

A proposta é um sistema web que centraliza o controle de quadras, horários e reservas, tornando o processo mais organizado, eficiente e prático tanto para quem administra quanto para quem joga.

### Objetivo

Desenvolver uma aplicação que facilite o gerenciamento e a reserva de quadras esportivas, reduzindo conflitos de agenda e facilitando o controle das informações.

### Como o projeto é construído

O desenvolvimento envolve levantamento de requisitos, modelagem, implementação e testes das funcionalidades. Ferramentas de inteligência artificial (Claude e GitHub Copilot) são usadas como apoio na implementação e na resolução de dúvidas técnicas.

### Equipe

| Papel | Nome |
|---|---|
| Desenvolvedor | Felipe Adrian Lourenço Barbisan |
| Desenvolvedor | Felipe Gabriel Galati de Oliveira |
| Orientador | Gustavo Henrique del Vechio |

Fatec Taquaritinga — 2026

> O sistema está **em desenvolvimento**. Algumas funcionalidades podem mudar ou ainda não estar completas.

---

## Funcionalidades

### Para jogadores

- **Busca de clubes e quadras:** listagens paginadas com filtro por nome, cidade e modalidade esportiva. A cidade é detectada automaticamente por geolocalização (com fallback silencioso caso a permissão seja negada).
- **Página inicial personalizada:** clubes em destaque e clubes perto de você, com carrossel de fotos.
- **Detalhes do clube:** galeria de imagens, endereço completo, mapa incorporado, modalidades e quadras disponíveis.
- **Reservas:** escolha da quadra, da data (próximos 7 dias) e do horário, com confirmação em modal.
- **Disponibilidade em tempo real:** os horários são atualizados na tela via **SignalR**, sem recarregar a página.
- **Minhas reservas:** listagem com busca, filtro por status, paginação e cancelamento.
- **Perfil:** edição de nome e telefone, troca de avatar com pré-visualização e validação de tamanho (até 5 MB).

### Para administradores de clubes

- **Planos e assinatura:** escolha do plano, pagamento via **Mercado Pago** (redirecionamento ao checkout), acompanhamento da confirmação do pagamento, histórico de pagamentos e cancelamento da assinatura.
- **Gestão de clubes:** cadastro de clubes com upload de fotos e preenchimento automático de endereço pelo CEP (**ViaCEP**).
- **Painel do clube:**
  - **Visão geral:** quadras, reservas do dia, jogadores e reservas recentes.
  - **Quadras:** CRUD completo com tipo, superfície, cobertura, preço e imagens.
  - **Horários:** criação individual ou em massa (por dias da semana e duração do slot).
  - **Reservas:** listagem com busca, filtros, paginação, dados do jogador, contato por WhatsApp e cancelamento.
  - **Configurações:** edição do clube, até 5 fotos, com reordenação por *drag and drop*.

### Contas e autenticação

- Cadastro com e-mail e senha ou com **Google**.
- Verificação de e-mail (com reenvio do link) e redefinição de senha.
- Conclusão de perfil em uma segunda etapa (telefone, CPF e data de nascimento), com validação de CPF.
- Sessão via cookies (`withCredentials`), com restauração automática ao abrir o app.
- Tema **claro/escuro** salvo no navegador.

---

## Arquitetura

Aplicação **Angular standalone** (sem NgModules), organizada por responsabilidade:

```
src/app/
├── core/          # Serviços globais, guards, interceptors e modelos de autenticação
├── features/      # Funcionalidades, uma pasta por área
│   ├── admin/     #   Painel do administrador (clubes, quadras, horários, reservas, planos, pagamento)
│   ├── auth/      #   Login, cadastro, verificação de e-mail, recuperação de senha, perfil
│   ├── clubs/     #   Listagem e detalhes de clubes e quadras (visão do jogador)
│   ├── home-page/ #   Página inicial
│   └── user/      #   Perfil e reservas do jogador
├── layout/        # MainLayout (navbar + footer) e AdminLayout (menu lateral)
└── shared/        # Componentes, diretivas, validadores e resolvers reutilizáveis
```

### Padrões adotados

- **Signals** para estado local e estado dos serviços (`signal`, `computed`, `asReadonly`).
- **`ChangeDetectionStrategy.OnPush`** nos componentes.
- **`inject()`** no lugar de injeção por construtor.
- **Lazy loading** das rotas com `loadComponent`.
- **Reactive Forms** com validações e mensagens acessíveis (`aria-invalid`, `aria-describedby`, `role="alert"`).
- **Control flow nativo** (`@if`, `@for`, `@switch`) nos templates.
- **`NgOptimizedImage`** para as imagens.
- Serviços por domínio, com `providedIn: 'root'`, expondo estado de `loading` e `error`.
- Acessibilidade seguindo as diretrizes **WCAG AA**.

### Rotas e proteção

| Guard | Função |
|---|---|
| `guestGuard` | Impede usuários logados de acessar login e cadastro. |
| `authGuard` | Exige sessão ativa. |
| `adminGuard` | Restringe o painel administrativo a usuários com papel de administrador. |
| `completeProfileGuard` | Direciona quem ainda não concluiu o cadastro. |
| `selectRoleGuard` | Redireciona administradores à área de gestão. |

Um **interceptor HTTP** envia as credenciais (cookies) em todas as requisições à API e as desativa nas chamadas ao ViaCEP.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21 |
| Estilo | Tailwind CSS + daisyUI |
| Linguagem | TypeScript (strict) |
| Reatividade | Signals e RxJS |
| Tempo real | `@microsoft/signalr` |
| Máscaras de input | `ngx-mask` |
| Calendário | `cally` |
| Login social | Google Identity Services |
| Integrações externas | ViaCEP (endereço por CEP), Nominatim/OpenStreetMap (geocodificação reversa), Google Maps (mapa incorporado) |
| Pagamentos | Mercado Pago (via API) |
| Backend | .NET 10 — API do Clubera |

Fontes: **Roboto** (texto) e **Space Grotesk** (destaques).

---

## Rodando localmente

### Pré-requisitos

- **Node.js** (versão compatível com o Angular 21) e **npm**
- **Angular CLI**: `npm install -g @angular/cli`
- A **API do Clubera** rodando localmente em `http://localhost:5000` (veja o README da API)

### Passo a passo

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd <pasta-do-projeto>

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
ng serve
```

A aplicação ficará disponível em `http://localhost:4200`.

### Comandos úteis

```bash
# Servidor de desenvolvimento
ng serve

# Build de produção (saída em dist/)
ng build

# Testes unitários
ng test
```

---

## Configuração de ambiente

Os ambientes ficam em `src/environments/`:

| Arquivo | Uso | `apiUrl` |
|---|---|---|
| `environment.development.ts` | Desenvolvimento (`ng serve`) | `http://localhost:5000/api` |
| `environment.ts` | Produção (`ng build`) | `https://api.clubera.dev/api` |

```ts
export const environment = {
  production: false,
  name: 'development',
  apiUrl: 'http://localhost:5000/api',
  googleClientId: 'SEU_CLIENT_ID.apps.googleusercontent.com',
};
```

| Variável | Descrição |
|---|---|
| `apiUrl` | URL base da API. O hub do SignalR (`/hubs/court-availability`) também é derivado dela. |
| `googleClientId` | Client ID do Google OAuth, usado no login e no cadastro com Google. Deve ser o mesmo configurado na API (`GOOGLE_CLIENT_ID`). |

### Integração com a API

- A API precisa liberar **CORS com credenciais** para a origem do frontend (`http://localhost:4200` em desenvolvimento), pois a autenticação usa cookies.
- A variável `PUBLIC_BASE_URL` da API deve apontar para a URL pública do frontend, porque é usada nos links dos e-mails (verificação e redefinição de senha) e nos redirecionamentos do pagamento (`/payment/success`, `/payment/failure`, `/payment/pending`).
- No Google Cloud Console, adicione a URL do frontend às **origens JavaScript autorizadas** do Client ID.

---

## Boas práticas de segurança

- O frontend não guarda tokens em `localStorage`: a sessão fica em cookies enviados pela API.
- O `localStorage` é usado apenas para a preferência de tema, e o `sessionStorage` para lembrar que o aviso de perfil incompleto foi dispensado.
- Valores sensíveis (chaves, segredos) pertencem somente à API; o `googleClientId` é público por natureza.
- Mantenha o `apiUrl` de produção sempre em **HTTPS**.

---

## Referências

- [Documentação do Angular](https://angular.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [daisyUI](https://daisyui.com/docs/)
- [SignalR (cliente JavaScript)](https://learn.microsoft.com/pt-br/aspnet/core/signalr/javascript-client)
- [ViaCEP](https://viacep.com.br/)
- [GitHub Copilot](https://docs.github.com/en/copilot)
- [Claude](https://www.anthropic.com/claude)

---

## Licença

Projeto acadêmico desenvolvido na Fatec Taquaritinga.

Apache 2.0 License, Version 2.0, January 2004, [www.apache.org/licenses/](www.apache.org/licenses/).
