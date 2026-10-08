<script setup>
import { ref } from 'vue'
import { redirectToCheckout } from 'voybit-payment-gateway-vue'

const props = defineProps({
  orderId: {
    type: String,
    required: true,
  },
})

const busy = ref(false)
const error = ref('')

async function startCheckout() {
  busy.value = true
  error.value = ''

  try {
    // This same-origin server route owns the amount, asset choice, and API key.
    const response = await fetch(`/api/orders/${encodeURIComponent(props.orderId)}/voybit-checkout`, {
      method: 'POST',
      credentials: 'same-origin',
    })
    if (!response.ok) throw new Error('checkout request failed')

    const body = await response.json()
    redirectToCheckout(body.checkout_url)
  } catch {
    error.value = 'Payment could not be started. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <button type="button" :disabled="busy" @click="startCheckout">
      {{ busy ? 'Opening checkout…' : 'Pay with Voybit' }}
    </button>
    <p v-if="error" role="alert">
      {{ error }}
    </p>
  </div>
</template>
