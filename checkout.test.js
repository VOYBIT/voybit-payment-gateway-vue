import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canonicalCheckoutUrl,
  checkoutStatus,
  parseStatus,
  publicIdFromCheckoutUrl,
} from './checkout.js'

const id = 'nYVvXxsYGr5LZk8Dn7hU0Q'

test('accepts only Voybit hosted checkout URLs', () => {
  assert.equal(publicIdFromCheckoutUrl(`https://voybit.com/pay/${id}`), id)
  assert.equal(canonicalCheckoutUrl(`https://voybit.com/pay/${id}/`), `https://voybit.com/pay/${id}`)

  for (const value of [
    `http://voybit.com/pay/${id}`,
    `https://voybit.com:8443/pay/${id}`,
    `https://user@voybit.com/pay/${id}`,
    `https://example.com/pay/${id}`,
    `https://voybit.com/pay/${id}?next=https://example.com`,
    `https://voybit.com/pay/${id}#fragment`,
    `https://voybit.com/pay/short`,
  ]) {
    assert.throws(() => publicIdFromCheckoutUrl(value), /invalid/)
  }
})

test('returns only the public checkout status fields', () => {
  const status = parseStatus(JSON.stringify({
    status: 'pending',
    public_id: id,
    checkout_url: `https://voybit.com/pay/${id}`,
    deposit_instructions: { address: 'private-payment-address' },
  }), id)

  assert.deepEqual(status, {
    publicId: id,
    checkoutState: 'payment',
    status: 'pending',
    checkoutUrl: `https://voybit.com/pay/${id}`,
    requiresPayerAction: false,
    confirmed: false,
  })
  assert.equal(JSON.stringify(status).includes('private-payment-address'), false)
})

test('reports buyer-choice checkout before an asset is selected', () => {
  const status = parseStatus(JSON.stringify({
    checkout_state: 'select_asset',
    public_id: id,
    assets: [{ id: 'private-asset-id', asset: 'USDC', network: 'base' }],
  }), id)

  assert.deepEqual(status, {
    publicId: id,
    checkoutState: 'select_asset',
    status: 'awaiting_payer',
    checkoutUrl: `https://voybit.com/pay/${id}`,
    requiresPayerAction: true,
    confirmed: false,
  })
  assert.equal(JSON.stringify(status).includes('private-asset-id'), false)
})

test('rejects a status response for a different checkout', () => {
  assert.throws(() => parseStatus({
    status: 'paid',
    public_id: 'aaaaaaaaaaaaaaaaaaaaaa',
  }, id), /not JSON/)
})

test('status request sends neither API keys nor a user agent', async () => {
  let seen
  const status = await checkoutStatus(id, {
    fetch: async (url, options) => {
      seen = { url, options }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          status: 'paid',
          public_id: id,
          checkout_url: `https://voybit.com/pay/${id}`,
        }),
      }
    },
  })

  assert.equal(status.confirmed, true)
  assert.equal(seen.url, `https://api.voybit.com/api/v1/checkout/${id}`)
  assert.deepEqual(seen.options.headers, { Accept: 'application/json' })
})
