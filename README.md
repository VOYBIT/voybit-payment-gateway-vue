# Voybit checkout for Vue 3

Use Voybit hosted checkout in a Vue 3 web app without exposing merchant secrets.

## Install

```bash
npm install github:VOYBIT/voybit-payment-gateway-vue#v0.2.0
```

The package is installed directly from GitHub and is not published to npm.

## Create the checkout on your server

Create a gateway in the [Voybit dashboard](https://dashboard.voybit.com), enable every asset customers may use, and create a secret key bound to that gateway. Your server—not Vue—must:

1. Validate the signed-in customer and order.
2. Create a checkout session with the order's fiat amount and currency.
3. Return only the resulting `checkout_url` to the browser.

Never include an API key or webhook secret in Vue source, environment variables bundled by Vite, or browser storage.

```js
const response = await fetch(
  'https://api.voybit.com/api/v1/gateway/checkout-sessions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Voybit-Api-Key': process.env.VOYBIT_API_KEY,
      'Idempotency-Key': `order:${order.id}`,
    },
    body: JSON.stringify({
      fiat_amount: order.total,
      fiat_currency: order.currency,
      description: `Order ${order.id}`,
      metadata: { order_id: String(order.id) },
    }),
  },
)

if (!response.ok) throw new Error('Voybit checkout could not be created')
const session = await response.json()
// Send only session.checkout_url to the Vue app.
```

Do not send `asset_id` or `crypto_amount`. On the hosted page, the customer chooses from assets enabled on that gateway, sees a live quote, and confirms it before Voybit creates the payment address and QR.

See [`examples/CheckoutButton.vue`](examples/CheckoutButton.vue) for a complete button that calls a same-origin backend route and opens the returned checkout.

If the server has already returned a checkout URL:

```vue
<script setup>
import { VoybitPayButton } from 'voybit-payment-gateway-vue'

defineProps({ checkoutUrl: { type: String, required: true } })
</script>

<template>
  <VoybitPayButton :checkout-url="checkoutUrl">
    Pay with Voybit
  </VoybitPayButton>
</template>
```

`redirectToCheckout(checkoutUrl)` is also available. Both APIs accept only a canonical `https://voybit.com/pay/{public_id}` URL.

## Payment status

`checkoutStatus(publicId)` can refresh status shown on screen:

- `requiresPayerAction` is `true` while the customer still needs to enter or select checkout details.
- `checkoutState` is `select_asset` before confirmation and `payment` afterward.
- `confirmed` is `true` only when the public payment status is `paid` or `overpaid`.

These values are display-only. Fulfil orders only after your server verifies a Voybit webhook. Peer dependency: Vue 3.3 or newer.
