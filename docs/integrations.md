# Integrações externas

## Pagamento
A API contém `MockPaymentProvider`, útil apenas para desenvolvimento. Substitua pelo adaptador oficial do gateway escolhido, usando credenciais de ambiente e verificando assinaturas de webhooks. Nunca considere o retorno do navegador como confirmação final de pagamento.

## Frete
`MockShippingProvider` retorna uma cotação ilustrativa. Para produção, integre a API oficial contratada (Correios ou transportadora), valide CEP, peso/dimensões e credenciais e apresente preço/prazo retornados pelo provedor.

## Geocodificação
Não está integrada por padrão. Se necessário, escolha um provedor, revise custos e restrições de uso antes de implementar.
