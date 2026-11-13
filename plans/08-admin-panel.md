# Fase 8 — Painel administrativo

O painel administrativo fica disponível no frontend para usuários com papel `ADMIN`. Ele oferece CRUD de produtos (incluindo rascunhos/arquivados), categorias e usuários, além de consulta/atualização de status dos pedidos. Senhas são armazenadas com hash e nunca retornadas pela API; o administrador autenticado não pode excluir a própria conta ou rebaixar o próprio perfil. A última conta ADMIN não pode ser removida, e usuários com pedidos não podem ser excluídos para preservar o histórico.
