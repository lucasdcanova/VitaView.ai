# VitaView AI - Plataforma de Análise Bioquímica com IA

VitaView AI é uma plataforma avançada de análise de exames médicos que utiliza inteligência artificial para extrair, analisar e interpretar dados de documentos médicos, fornecendo insights personalizados e acompanhamento de tendências de saúde.

## Funcionalidades Principais

- **Extração inteligente de dados**: Converte PDFs e imagens de exames médicos em dados estruturados usando o Google Gemini AI
- **Análise aprofundada**: Interpreta os resultados extraídos com o OpenAI para fornecer contexto médico
- **Acompanhamento de tendências**: Visualiza métricas de saúde ao longo do tempo
- **Alertas personalizados**: Identifica valores fora da faixa de referência
- **Processamento de documentos brasileiros**: Otimizado para exames em português do Brasil

## Tecnologias

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **IA**: Google Gemini (extração) + OpenAI (análise)

## Estrutura da Aplicação

A aplicação utiliza um pipeline de IA de duas etapas:

1. **Extração de dados (Gemini)**: Converte documentos médicos em dados estruturados
2. **Análise contextual (OpenAI)**: Interpreta os dados extraídos para fornecer insights médicos

## Pipeline de IA do VitaView

O pipeline de processamento opera em duas etapas:

```
Documento PDF/Imagem → Gemini API (extração) → OpenAI (análise) → Resultados estruturados
```

### Mecanismo de Fallback

O sistema inclui mecanismos robustos de fallback:

1. Se o Gemini falhar, é feito retry com backoff exponencial (5 tentativas)
2. Se todas as tentativas falharem, o sistema recorre ao OpenAI como fallback
3. Se ambos falharem, são utilizados valores padrão para evitar interrupção da experiência do usuário

## Configuração

### Variáveis de Ambiente Necessárias

- `DATABASE_URL`: URL de conexão do PostgreSQL
- `GOOGLE_API_KEY`: Chave de API para o Google Gemini
- `OPENAI_API_KEY`: Chave de API para o OpenAI

## Testes

A aplicação inclui um conjunto abrangente de testes para validar o pipeline:

### Teste de Compatibilidade do Banco de Dados

Verifica se o esquema do banco de dados é compatível com os dados produzidos pelo pipeline de IA.

```bash
npx tsx server/test-db.ts
```

### Teste de Pipeline Completo

Testa o fluxo completo de processamento de documentos, desde a extração até a análise final.

```bash
npx tsx server/test-pipeline.ts ./caminho/para/arquivo.pdf
```

### Teste do Gemini API

Testa somente a extração de dados usando a API Gemini.

```bash
npx tsx server/test-ai.ts ./caminho/para/arquivo.pdf
```

## Desenvolvimento

### Estrutura de Diretórios

- `/server`: Backend da aplicação
  - `/services`: Serviços de IA (Gemini e OpenAI)
  - `/test-data`: Arquivos de amostra para testes
- `/client`: Frontend da aplicação
- `/shared`: Schemas de dados compartilhados

### Fluxo de Processamento

1. Upload do documento
2. Extração com Gemini API
3. Armazenamento no banco de dados
4. Análise com OpenAI
5. Exibição dos resultados

## Limitações Conhecidas

- Processamento de PDFs complexos pode atingir timeout
- Alguns layouts específicos de laboratórios podem não ser reconhecidos corretamente
- A capacidade de extrair valores depende da qualidade do documento original