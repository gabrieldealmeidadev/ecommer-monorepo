# Integrações externas

## Pagamento
A API contém `MockPaymentProvider`, útil apenas para desenvolvimento. Substitua pelo adaptador oficial do gateway escolhido, usando credenciais de ambiente e verificando assinaturas de webhooks. Nunca considere o retorno do navegador como confirmação final de pagamento.

## Frete
`FrenetShippingProvider` consulta `https://api.frenet.com.br/shipping/quote` quando `SHIPPING_PROVIDER=frenet`. Configure `FRENET_TOKEN` e `FRENET_ORIGIN_POSTAL_CODE` no ambiente da API; o CEP de origem é enviado sem máscara e o token fica somente no servidor. Em desenvolvimento/testes, sem configuração, usa-se `MockShippingProvider`, que retorna valores demonstrativos e é identificado na resposta por `demo: true`. Em produção, Frenet é o provedor padrão e a API exige as duas variáveis. Aplique a migration do catálogo com `npm run db:deploy`.

O cadastro de produtos recebe peso inteiro em gramas e comprimento, largura e altura em metros (por exemplo, 0,250 kg é `250` g; 0,5 × 0,10 × 0,16 m). O banco armazena dimensões inteiras em centímetros e o adaptador converte o peso para quilogramas ao chamar a Frenet. Produtos antigos sem essas medidas precisam ser atualizados antes de poderem ser cotados. O valor da nota informado à Frenet é calculado no servidor com os preços atuais dos produtos.

## Geocodificação
Não está integrada por padrão. Se necessário, escolha um provedor, revise custos e restrições de uso antes de implementar.
