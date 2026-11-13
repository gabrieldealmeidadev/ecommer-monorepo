# Fase 2 — Autenticação

Implementado no MVP:
- Cadastro, login e logout.
- JWT em cookie HttpOnly.
- Endpoint `/api/auth/me`.
- Middleware de autenticação e autorização por role ADMIN/USER.
- Hash de senha com bcryptjs.

Validar: usuário comum não acessa rotas administrativas; cookies seguros em produção; segredo JWT longo e privado.
