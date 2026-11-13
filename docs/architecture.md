# Arquitetura

O repositório é um monorepo npm com `apps/api` e `apps/web`.

API:
- `config/`: configuração do Prisma e variáveis.
- `controllers/`: validação de entrada e respostas HTTP com `res.status`.
- `middlewares/`: autenticação e autorização (não há middleware global de erro).
- `repositories/`: acesso a dados com Prisma.
- `services/`: regras de negócio.
- `routes/`: mapeamento dos endpoints.
- `integrations/`: adaptadores de pagamento e frete.
- `app.ts` e `server.ts`: configuração e inicialização.

Frontend:
- React + Vite + TypeScript.
- `lib/api.ts` centraliza chamadas HTTP com `credentials: include`.
- Interface MVP para catálogo, login e carrinho.

O backend é a fonte confiável de preços, estoque, permissões, pedidos e status de pagamento.
