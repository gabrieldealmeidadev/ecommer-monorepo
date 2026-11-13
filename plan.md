# Plano mestre — E-commerce

## Objetivo
Criar uma loja virtual full-stack, organizada em monorepo, com catálogo, carrinho, endereços, checkout, pedidos, pagamentos e frete.

## Stack
- Node.js 20+, TypeScript, Express
- Prisma ORM e PostgreSQL 16
- React, Vite, TypeScript
- JWT em cookie HttpOnly
- Docker Compose para PostgreSQL
- Jest e Supertest para testes de API

## Regras obrigatórias
- Não usar Zod.
- Não usar middleware global de erro.
- Controllers devem responder explicitamente com `return res.status(...).json(...)`.
- Validar dados recebidos no servidor com verificações manuais.
- Segredos somente em variáveis de ambiente.
- Não confiar em preços enviados pelo frontend.
- Nunca armazenar dados completos de cartão.
- Integrações de pagamento/frete devem ser adaptadores substituíveis.
- Não habilitar pagamentos reais sem credenciais, webhooks e validação do provedor.

## Fases
1. Fundação, monorepo, Docker e banco.
2. Autenticação, usuários, cookies e autorização ADMIN/USER.
3. Categorias e catálogo de produtos.
4. Carrinho e estoque.
5. Endereços e frete.
6. Checkout e pedidos.
7. Pagamentos e webhooks.
8. Painel administrativo.
9. Testes, documentação e implantação.

## Critério de conclusão
Cada fase deve compilar, ter validação adequada, documentar o que foi feito e atualizar `docs/progress.md`.
