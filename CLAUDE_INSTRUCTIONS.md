# Instruções para Claude – Projeto GestorAutoV2

## Visão geral
Este documento fornece ao Claude (modelo de linguagem) contexto, preferências do usuário e estilo de comunicação a serem usados nas conversas relacionadas ao **GestorAutoV2**. Ele será consultado por Claude para garantir respostas coerentes, alinhadas ao tom e às necessidades do projeto.

## Estrutura do projeto
- **Frontend**: React + TypeScript (Next.js) – componentes em `src/components/…`, páginas em `src/pages/…`.
- **Backend**: Supabase (PostgreSQL) – scripts SQL em `database/`.
- **PWA**: Implementado com `src/App.tsx` e `src/pages/…`.
- **Principais módulos**:
  - Dashboard (`src/pages/Dashboard.tsx`)
  - Agendamento (`src/components/operations/AppointmentModal.tsx`)
  - Pricing (`src/components/landing/Pricing.tsx`)
  - Tipos de dados (`src/types/database.ts`)

## Preferências do usuário
1. **Tom**: profissional, confiante, mas acessível. Evitar jargões excessivos; usar linguagem clara e objetiva.
2. **Estilo visual**: design premium, cores harmoniosas, tipografia moderna (ex.: Google Font *Inter*), micro‑animações sutis.
3. **Detalhamento**: respostas curtas quando possível, mas com explicações técnicas completas quando solicitado.
4. **Idioma**: português (Brasil).

## Diretrizes de comunicação para Claude
- **Contextualizar**: sempre referenciar o módulo ou arquivo relevante (ex.: "conforme definido em `src/pages/Dashboard.tsx`...").
- **Referência de código**: usar blocos de código markdown com a linguagem correta (`tsx`, `sql`, `typescript`).
- **Sugestões de melhoria**: ao sugerir alterações, indicar o arquivo e a linha aproximada, e apresentar um *diff* estilo Git.
- **Respeitar preferências**: manter o tom premium e a clareza, evitar respostas genéricas.
- **Persistência de informações**: reutilizar este documento como fonte de verdade para futuras interações.

## Exemplos de uso
### Pergunta do usuário
> "Como posso melhorar a performance do Dashboard?"

### Resposta sugerida pelo Claude
```tsx
// src/pages/Dashboard.tsx
// Otimize a renderização usando React.memo e useCallback onde apropriado.
```
- **Explicação**: "Utilize `React.memo` para envolver componentes estáticos e `useCallback` para funções passadas como props, reduzindo renderizações desnecessárias."

## Atualizações
Este documento deve ser revisado sempre que houver mudanças significativas na arquitetura ou nas preferências do usuário.

---
*Gerado automaticamente por Antigravity em 2025‑12‑03.*