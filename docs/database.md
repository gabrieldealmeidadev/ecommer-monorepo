# Banco de dados

Entidades principais:
- User: usuário e papel ADMIN/USER.
- Category e Product: catálogo; peso do produto em gramas e dimensões do pacote em centímetros para cálculo de frete.
- Cart e CartItem: carrinho.
- Address: endereços do cliente.
- Order e OrderItem: snapshot dos itens e preços no momento da compra.
- Payment: status e referência externa do pagamento.
- ShippingOption: opção escolhida e dados básicos do frete.

Use migrations do Prisma para evoluir o schema. Não apague o banco para corrigir uma migration sem avaliar os dados.
