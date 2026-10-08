# Voybit checkout for Vue 3

Use Voybit hosted checkout in a Vue 3 web app without exposing merchant secrets.

## Install

```bash
npm install github:VOYBIT/voybit-payment-gateway-vue
```

The package is installed directly from GitHub and is not published to npm.

## Create the checkout on your server

Create a gateway and secret key in the [Voybit dashboard](https://dashboard.voybit.com). Your server—not Vue—must:

1. Validate the signed-in customer and order.
2. Choose or validate the payment asset.
3. Create the payment with its `X-Voybit-Api-Key`.
4. Return only the resulting `checkout_url` to the browser.

Never include an API key or webhook secret in Vue source, environment variables bundled by Vite, or browser storage.

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

`checkoutStatus(publicId)` can refresh status shown on screen. A `confirmed` value means the public status is `paid` or `overpaid`; it must not fulfil an order.

Fulfil orders only after your server verifies a Voybit webhook. Peer dependency: Vue 3.3 or newer.
