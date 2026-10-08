import { computed, defineComponent, h } from 'vue'

import {
  CheckoutError,
  canonicalCheckoutUrl,
  checkoutStatus,
  checkoutUrl,
  publicIdFromCheckoutUrl,
} from './checkout.js'

export {
  CheckoutError,
  canonicalCheckoutUrl,
  checkoutStatus,
  checkoutUrl,
  publicIdFromCheckoutUrl,
}

export function redirectToCheckout(value) {
  const target = canonicalCheckoutUrl(value)
  if (typeof globalThis.location?.assign !== 'function') {
    throw new CheckoutError('browser navigation is not available')
  }
  globalThis.location.assign(target)
}

function callClickListener(listener, event) {
  if (Array.isArray(listener)) {
    for (const handler of listener) callClickListener(handler, event)
  } else if (typeof listener === 'function') {
    listener(event)
  }
}

export const VoybitPayButton = defineComponent({
  name: 'VoybitPayButton',
  inheritAttrs: false,
  props: {
    checkoutUrl: {
      type: String,
      required: true,
    },
  },
  setup(props, { attrs, slots }) {
    const href = computed(() => {
      try {
        return canonicalCheckoutUrl(props.checkoutUrl)
      } catch {
        return ''
      }
    })

    return () => h('a', {
      ...attrs,
      href: href.value || undefined,
      'aria-disabled': href.value ? attrs['aria-disabled'] : 'true',
      onClick: (event) => {
        callClickListener(attrs.onClick, event)
        if (!href.value) event.preventDefault()
      },
    }, slots.default?.() ?? 'Pay with Voybit')
  },
})

export const PayButton = VoybitPayButton
