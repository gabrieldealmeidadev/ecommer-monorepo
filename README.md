# E-commerce Monorepo

MVP de e-commerce com backend Node.js/Express/TypeScript, Prisma/PostgreSQL e frontend React/Vite/TypeScript.

## Requisitos
- Node.js 20+
- Docker Desktop (recomendado) ou PostgreSQL local
- npm

## Começar
1. Copie `.env.example` para `.env` na raiz e configure os valores.
2. Execute `docker compose up -d db`.
3. Instale as dependências: `npm install`.
4. Gere o Prisma Client e aplique a migration inicial:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. Crie o primeiro administrador:
   ```bash
   npm run seed:admin
   ```
   Credenciais padrão: `admin@example.com` / `ChangeMe123!`. Altere `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env` antes de executar.
6. Inicie API e frontend: `npm run dev`.

- API: http://localhost:3000
- Health: http://localhost:3000/health
- Frontend: http://localhost:5173

## Estrutura
- `apps/api`: API Express e Prisma.
- `apps/web`: frontend React.
- `plans/`: planos por fase.
- `docs/`: arquitetura, banco, integrações e progresso.

## Observações importantes
- Não usa Zod.
- Não existe middleware global de erro: controllers retornam erros com `res.status(...).json(...)`.
- Pagamentos e frete vêm com adaptadores iniciais em modo demonstrativo. Configure credenciais e implemente/valide os contratos reais do provedor antes de produção.
- O gateway de pagamento não é escolhido ainda; `MockPaymentProvider` permite desenvolver o fluxo sem cobrar valores reais.
- A cotação de frete de demonstração não representa tarifa real dos Correios/transportadoras.
- Configure HTTPS, cookies seguros, CORS, rate limiting, backups, monitoramento e revisão de segurança antes de produção.
