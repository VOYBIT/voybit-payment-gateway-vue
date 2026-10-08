const PUBLIC_ID = /^[A-Za-z0-9_-]{22}$/
const CHECKOUT_URL = /^https:\/\/voybit\.com\/pay\/([A-Za-z0-9_-]{22})\/?$/

export const CHECKOUT_ORIGIN = 'https://voybit.com'
export const API_ORIGIN = 'https://api.voybit.com'

export class CheckoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CheckoutError'
  }
}

export function publicIdFromCheckoutUrl(value) {
  const match = CHECKOUT_URL.exec(String(value ?? '').trim())
  if (!match) throw new CheckoutError('checkout URL is invalid')
  return match[1]
}

export function checkoutUrl(publicId) {
  if (typeof publicId !== 'string' || !PUBLIC_ID.test(publicId)) {
    throw new CheckoutError('checkout URL is invalid')
  }
  return `${CHECKOUT_ORIGIN}/pay/${publicId}`
}

export function canonicalCheckoutUrl(value) {
  return checkoutUrl(publicIdFromCheckoutUrl(value))
}

export function parseStatus(body, requestedPublicId) {
  let decoded = body
  if (typeof body === 'string') {
    try {
      decoded = JSON.parse(body)
    } catch {
      throw new CheckoutError('checkout status was not JSON')
    }
  }

  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw new CheckoutError('checkout status was not JSON')
  }

  const publicId = typeof decoded.public_id === 'string' ? decoded.public_id : requestedPublicId
  if (
    typeof publicId !== 'string'
    || !PUBLIC_ID.test(publicId)
    || (requestedPublicId && publicId !== requestedPublicId)
  ) {
    throw new CheckoutError('checkout status was not JSON')
  }

  if (
    typeof decoded.checkout_url === 'string'
    && publicIdFromCheckoutUrl(decoded.checkout_url) !== publicId
  ) {
    throw new CheckoutError('checkout status was not JSON')
  }

  const checkoutState = decoded.checkout_state === 'select_asset' ? 'select_asset' : 'payment'
  const status = typeof decoded.status === 'string'
    ? decoded.status
    : checkoutState === 'select_asset'
      ? 'awaiting_payer'
      : ''
  if (!status) {
    throw new CheckoutError('checkout status was not JSON')
  }

  return {
    publicId,
    checkoutState,
    status,
    checkoutUrl: checkoutUrl(publicId),
    requiresPayerAction: checkoutState === 'select_asset',
    confirmed: status === 'paid' || status === 'overpaid',
  }
}

export async function checkoutStatus(publicId, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const id = publicIdFromCheckoutUrl(checkoutUrl(publicId))
  if (typeof fetchImpl !== 'function') throw new CheckoutError('fetch is not available')

  const response = await fetchImpl(`${API_ORIGIN}/api/v1/checkout/${id}`, {
    method: 'GET',
    redirect: 'error',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new CheckoutError(`checkout status returned HTTP ${response.status}`)

  const raw = await response.text()
  if (raw.length > 1 << 20) throw new CheckoutError('checkout status was too large')
  return parseStatus(raw, id)
}
