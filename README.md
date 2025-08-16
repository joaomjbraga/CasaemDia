![banner](./.github/casaemdia.jpg)

# Casa em Dia

**Casa em Dia** é um aplicativo mobile projetado para simplificar a organização de tarefas domésticas, finanças e atividades familiares. Desenvolvido com uma interface intuitiva, o aplicativo permite que membros da família colaborem na gestão da casa, desde o planejamento de tarefas até o controle de orçamento e estoque doméstico. O projeto foi idealizado e inteiramente codificado por João M J Braga.

## Funcionalidades

- **Autenticação Segura**: Login, registro, logout e recuperação de senha, integrados com Supabase Auth.
- **Gerenciamento de Tarefas**: Crie, atribua e marque tarefas como concluídas, com pontos e prazos para incentivar a organização.
- **Agenda Integrada**: Visualize eventos (tarefas, despesas, compras, reuniões) em um calendário interativo.
- **Chat Familiar**: Comunique-se com membros da família via chat interno, com mensagens temporárias de 24 horas.
- **Controle Financeiro**: Registre despesas, gerencie o orçamento mensal e acompanhe o saldo disponível.
- **Gestão de Estoque**: Monitore itens domésticos (alimentos, limpeza, higiene, etc.) com alertas de reposição.
- **Lista de Compras**: Organize e marque itens de compras como concluídos.
- **Membros da Família**: Adicione e gerencie membros para atribuir tarefas e responsabilidades.
- **Calculadora Flutuante**: Realize cálculos rápidos para finanças domésticas.
- **Configurações Personalizadas**: Ajuste orçamentos, gerencie membros e alterne entre temas claro e escuro.

## Tecnologias Utilizadas

### Framework Principal

- **React Native** (0.79.5) com **Expo** (~53.0.20): Framework para desenvolvimento mobile multiplataforma
- **TypeScript** (~5.8.3): Tipagem estática para maior robustez do código

### Backend e Autenticação

- **Supabase** (`@supabase/supabase-js` ~2.52.1): Backend para autenticação e gerenciamento de dados

### Navegação e Roteamento

- **Expo Router** (~5.1.4): Sistema de roteamento com suporte a rotas tipadas
- **React Navigation** (~7.1.6): Navegação entre telas

### Armazenamento e Estado

- **AsyncStorage** (2.1.2): Armazenamento local para preferências, como o tema do aplicativo

### Interface e Animações

- **React Native Reanimated** (~3.17.4): Animações fluidas e interativas
- **Componentes de UI**:
  - `@expo/vector-icons`: Ícones vetoriais
  - `react-native-modal`: Modais nativos
  - `@react-native-picker/picker`: Seletores
  - `@react-native-community/datetimepicker`: Seletor de data e hora
  - `expo-linear-gradient`: Gradientes visuais
  - `expo-font`: Fontes personalizadas (ex.: SpaceMono)

### Testes

- **Jest** (~29.2.1) e **Jest-Expo** (~53.0.9): Framework de testes

### Configurações do Expo (app.json)

- Suporte a iOS e Android
- Ícones adaptativos e splash screen personalizada (cor de fundo: `#B8F2FF`)
- Tema padrão claro (`userInterfaceStyle: light`)
- Esquema de deep linking (`scheme: casaemdia`)
- Proprietário: `joaomjbraga`, com suporte ao Expo Application Services (EAS)

## Estrutura do Banco de Dados (Supabase)

O aplicativo utiliza o Supabase como backend, com 8 tabelas principais organizadas por funcionalidade:

### 📊 Controle Financeiro

#### Tabela: `balances`

Armazena o saldo e orçamento de cada usuário.

```sql
CREATE TABLE public.balances (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único da tabela
  user_id uuid NOT NULL UNIQUE,                       -- Referência ao usuário (auth.users)
  total_balance numeric NOT NULL DEFAULT 0,           -- Saldo total disponível
  monthly_budget numeric NOT NULL DEFAULT 0,          -- Orçamento mensal definido
  created_at timestamp with time zone DEFAULT now(),  -- Data de criação
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Exemplo de uso**: Armazenar que o usuário tem R$ 2.500,00 de saldo e orçamento mensal de R$ 3.000,00.

#### Tabela: `expenses`

Registra todas as despesas do usuário.

```sql
CREATE TABLE public.expenses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único da despesa
  user_id uuid NOT NULL,                              -- Referência ao usuário
  amount numeric NOT NULL,                            -- Valor da despesa
  description text NOT NULL,                          -- Descrição da despesa
  payer text NOT NULL,                                -- Nome de quem pagou
  created_at timestamp with time zone DEFAULT now(),  -- Data da despesa
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Exemplo de uso**: Registrar que "João" gastou R$ 150,00 em "Supermercado - compras semanais".

### 👥 Gestão Familiar

#### Tabela: `family_members`

Gerencia os membros da família para atribuição de responsabilidades.

```sql
CREATE TABLE public.family_members (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único do membro
  user_id uuid NOT NULL,                              -- Referência ao usuário dono da família
  name text NOT NULL,                                 -- Nome do membro da família
  created_at timestamp with time zone DEFAULT now(),  -- Data de criação
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Exemplo de uso**: Adicionar "Maria", "Pedro" e "Ana" como membros da família.

#### Tabela: `messages`

Sistema de chat interno da família.

```sql
CREATE TABLE public.messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único da mensagem
  user_id uuid NOT NULL,                              -- Usuário que enviou a mensagem
  content text NOT NULL,                              -- Conteúdo da mensagem
  family_member_id bigint,                            -- Membro da família que enviou (opcional)
  created_at timestamp with time zone DEFAULT now(),  -- Data/hora do envio
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (family_member_id) REFERENCES public.family_members(id)
);
```

**Exemplo de uso**: "Maria enviou: 'Lembrar de comprar leite hoje!'" às 14:30.

### ✅ Gerenciamento de Tarefas

#### Tabela: `tasks`

Controla todas as tarefas domésticas e suas atribuições.

```sql
CREATE TABLE public.tasks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único da tarefa
  user_id uuid NOT NULL,                              -- Usuário proprietário da tarefa
  title text NOT NULL,                                -- Título/descrição da tarefa
  done boolean NOT NULL DEFAULT false,                -- Status (concluída ou não)
  assignee text NOT NULL,                             -- Nome do responsável
  points integer NOT NULL,                            -- Pontos ganhos ao completar
  due_date timestamp with time zone,                  -- Prazo para conclusão (opcional)
  created_at timestamp with time zone DEFAULT now(),  -- Data de criação
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Exemplo de uso**: Tarefa "Lavar louça" atribuída para "Pedro", vale 10 pontos, prazo até domingo.

### 📅 Sistema de Eventos

#### Tabela: `events`

Centraliza todos os eventos do calendário familiar.

```sql
CREATE TABLE public.events (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único do evento
  user_id uuid NOT NULL,                              -- Usuário que criou o evento
  title text NOT NULL,                                -- Título do evento
  event_time timestamp with time zone,                -- Data/hora do evento
  type text NOT NULL CHECK (type = ANY (             -- Tipo do evento (obrigatório)
    ARRAY['task'::text, 'expense'::text, 'shopping'::text, 'meeting'::text]
  )),
  description text,                                   -- Descrição adicional (opcional)
  created_at timestamp with time zone DEFAULT now(),  -- Data de criação
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Tipos de eventos disponíveis**:

- `task`: Tarefa doméstica
- `expense`: Despesa programada
- `shopping`: Ida ao mercado/compras
- `meeting`: Reunião familiar

**Exemplo de uso**: Evento "Reunião familiar" tipo "meeting" para sábado às 19:00.

### 🛒 Lista de Compras

#### Tabela: `shopping_list`

Organiza itens para compras.

```sql
CREATE TABLE public.shopping_list (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,     -- ID único do item
  user_id uuid,                                       -- Usuário que criou o item
  title text NOT NULL,                                -- Nome do item
  done boolean DEFAULT false,                         -- Status (comprado ou não)
  created_at timestamp with time zone DEFAULT now(),  -- Data de criação
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Exemplo de uso**: Itens "Leite", "Pão", "Arroz" - sendo que "Leite" já foi comprado (done=true).

### 📦 Controle de Estoque

#### Tabela: `inventory`

Monitora itens domésticos com alertas inteligentes de reposição.

```sql
CREATE TABLE public.inventory (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,        -- ID único do item
  user_id uuid NOT NULL,                                 -- Usuário proprietário
  name text NOT NULL,                                    -- Nome do item
  category text NOT NULL CHECK (category = ANY (         -- Categoria (obrigatória)
    ARRAY['alimentos'::text, 'limpeza'::text, 'higiene'::text, 'outros'::text]
  )),
  current_quantity integer NOT NULL DEFAULT 0,           -- Quantidade atual
  minimum_quantity integer NOT NULL DEFAULT 1,           -- Quantidade mínima (alerta)
  unit text NOT NULL DEFAULT 'unidade'::text,           -- Unidade de medida
  expiration_date date,                                  -- Data de validade (opcional)
  location text,                                         -- Local de armazenamento (opcional)
  notes text,                                           -- Observações adicionais (opcional)
  needs_restock boolean DEFAULT (current_quantity <= minimum_quantity), -- Alerta automático
  created_at timestamp with time zone DEFAULT now(),     -- Data de criação
  updated_at timestamp with time zone DEFAULT now(),     -- Última atualização
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Categorias disponíveis**:

- `alimentos`: Produtos alimentícios
- `limpeza`: Produtos de limpeza
- `higiene`: Produtos de higiene pessoal
- `outros`: Outros itens domésticos

**Funcionalidade especial**: O campo `needs_restock` é automaticamente calculado comparando `current_quantity` com `minimum_quantity`.

**Exemplo de uso**: "Detergente" categoria "limpeza", 2 unidades atuais, mínimo 3, precisa repor (needs_restock=true).

## Política de Segurança (RLS)

⚠️ **IMPORTANTE**: Todas as tabelas devem ter Row-Level Security (RLS) habilitada no Supabase para garantir que:

- Usuários só acessem seus próprios dados
- Não haja vazamento de informações entre famílias diferentes
- A autenticação seja respeitada em todas as operações

Para habilitar RLS em cada tabela:

```sql
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

## Pré-requisitos

- **Node.js**: Versão 18 ou superior
- **Expo CLI**: Instale globalmente com `npm install -g expo-cli`
- **Yarn** ou **npm**: Para gerenciar dependências
- **Projeto Supabase**: Configure um projeto com as tabelas acima e RLS habilitado
- **Variáveis de Ambiente**: Configure as credenciais do Supabase

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/joaomjbraga/casaemdia.git
cd casaemdia
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

**📍 Onde encontrar essas informações**:

1. Acesse o [painel do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie a **Project URL** e a **anon public** key

⚠️ **NUNCA** commite o arquivo `.env` no controle de versão!

### 4. Configure o banco de dados

Execute o schema SQL fornecido acima no editor SQL do Supabase e habilite RLS em todas as tabelas.

### 5. Inicie o projeto

```bash
npm start
# ou
expo start
```

Use o **Expo Go** no celular ou um emulador para visualizar o aplicativo.

## Como Usar

### Primeiros Passos

1. **Registro/Login**: Crie uma conta ou faça login para acessar o aplicativo
2. **Adicionar Membros**: No menu de configurações, adicione membros da família
3. **Definir Orçamento**: Configure seu orçamento mensal na seção de finanças

### Funcionalidades Principais

#### 🏠 Tarefas Domésticas

- Adicione tarefas na tela principal
- Atribua tarefas específicas para cada membro da família
- Defina pontos e prazos para incentivar a conclusão
- Acompanhe o progresso de cada pessoa

#### 💰 Controle Financeiro

- Registre despesas conforme elas acontecem
- Acompanhe seu saldo atual vs orçamento mensal
- Veja quem está gastando mais na família
- Use a calculadora integrada para cálculos rápidos

#### 📦 Gestão de Estoque

- Cadastre itens por categoria (alimentos, limpeza, higiene, outros)
- Configure alertas automáticos de reposição
- Monitore datas de validade
- Organize por localização na casa

#### 💬 Chat Familiar

- Envie mensagens rápidas para coordenar atividades
- Mensagens temporárias (24 horas) para reduzir bagunça
- Comunique mudanças de planos ou lembretes

#### 📅 Agenda Integrada

- Visualize todos os eventos em um calendário
- Diferentes tipos: tarefas, despesas, compras, reuniões
- Planeje a semana da família de forma visual

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. **Commit** suas alterações:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   ```
4. **Push** para o repositório remoto:
   ```bash
   git push origin feature/nova-funcionalidade
   ```
5. Abra um **Pull Request** com descrição clara das mudanças

### Padrões de Commit

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` alteração na documentação
- `style:` formatação, ponto e vírgula, etc
- `refactor:` refatoração de código
- `test:` adição ou correção de testes

## Créditos

O projeto **Casa em Dia** foi idealizado e inteiramente desenvolvido por **João M J Braga**, que concebeu a ideia e implementou todas as funcionalidades, desde o design da interface até a integração com o backend Supabase.

## Licença

Este projeto é licenciado sob a [Licença MIT](LICENSE).

---

## Suporte

Se você encontrar problemas ou tiver dúvidas:

1. Verifique se todas as dependências estão instaladas corretamente
2. Confirme se o arquivo `.env` está configurado com as credenciais corretas do Supabase
3. Certifique-se de que o RLS está habilitado em todas as tabelas do banco
4. Abra uma **issue** no GitHub descrevendo o problema detalhadamente

**Versão do React Native**: 0.79.5
**Versão do Expo**: ~53.0.20
**Última atualização**: Agosto 2025
