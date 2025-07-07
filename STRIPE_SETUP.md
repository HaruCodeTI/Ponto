# Configuração do Stripe

Este documento descreve como configurar o Stripe para processamento de pagamentos no sistema de controle de ponto.

## Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Chave secreta do Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_... # Chave pública do Stripe
STRIPE_WEBHOOK_SECRET=whsec_... # Secret do webhook

# Price IDs dos Planos (Stripe)
STRIPE_PRICE_BASIC=price_... # ID do preço do plano Básico
STRIPE_PRICE_PROFESSIONAL=price_... # ID do preço do plano Profissional
STRIPE_PRICE_PREMIUM=price_... # ID do preço do plano Premium
```

## Configuração no Stripe Dashboard

### 1. Criar Produtos e Preços

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vá para **Produtos** > **Adicionar produto**
3. Crie três produtos:
   - **Plano Básico**
   - **Plano Profissional**
   - **Plano Premium**

### 2. Configurar Preços

Para cada produto, configure os preços:

#### Plano Básico
- **Tipo**: Preço recorrente
- **Preço**: R$ 29,90/mês
- **Cobrança**: Por funcionário
- **Período**: Mensal

#### Plano Profissional
- **Tipo**: Preço recorrente
- **Preço**: R$ 49,90/mês
- **Cobrança**: Por funcionário
- **Período**: Mensal

#### Plano Premium
- **Tipo**: Preço recorrente
- **Preço**: R$ 99,90/mês
- **Cobrança**: Por funcionário
- **Período**: Mensal

### 3. Configurar Webhook

1. Vá para **Desenvolvedores** > **Webhooks**
2. Clique em **Adicionar endpoint**
3. **URL**: `https://seu-dominio.com/api/subscription/webhook`
4. **Eventos a enviar**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copie o **Signing secret** e adicione à variável `STRIPE_WEBHOOK_SECRET`

### 4. Configurar Métodos de Pagamento

1. Vá para **Configurações** > **Métodos de pagamento**
2. Ative os métodos desejados:
   - Cartão de crédito/débito
   - PIX (Brasil)
   - Boleto bancário

## Testando a Integração

### Cartões de Teste

Use estes cartões para testar:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **Requer autenticação**: `4000 0025 0000 3155`

### Testando Webhooks

1. Use o [Stripe CLI](https://stripe.com/docs/stripe-cli) para testar webhooks localmente:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```

2. Ou use o modo de teste no dashboard do Stripe

## Fluxo de Pagamento

1. **Checkout**: Usuário seleciona plano e quantidade de funcionários
2. **Stripe Checkout**: Redirecionamento para página de pagamento do Stripe
3. **Pagamento**: Usuário insere dados de pagamento
4. **Webhook**: Stripe notifica sobre pagamento bem-sucedido
5. **Ativação**: Sistema ativa assinatura e recursos

## Monitoramento

- **Logs**: Verifique os logs do servidor para eventos de webhook
- **Dashboard**: Use o dashboard do Stripe para monitorar pagamentos
- **Alertas**: Configure alertas para falhas de pagamento

## Segurança

- Nunca exponha as chaves secretas do Stripe
- Sempre verifique a assinatura dos webhooks
- Use HTTPS em produção
- Implemente rate limiting nas APIs

## Suporte

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)
- [Stripe Community](https://community.stripe.com/) 