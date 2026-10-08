import type { DefineComponent } from 'vue'

export class CheckoutError extends Error {}

export interface CheckoutStatus {
  publicId: string
  checkoutState: 'select_asset' | 'payment'
  status: string
  checkoutUrl: string
  requiresPayerAction: boolean
  confirmed: boolean
}

export interface CheckoutStatusOptions {
  fetch?: (
    input: string,
    init: {
      method: 'GET'
      redirect: 'error'
      headers: { Accept: 'application/json' }
    },
  ) => Promise<{
    ok: boolean
    status: number
    text(): Promise<string>
  }>
}

export function publicIdFromCheckoutUrl(value: unknown): string
export function checkoutUrl(publicId: string): string
export function canonicalCheckoutUrl(value: unknown): string
export function checkoutStatus(
  publicId: string,
  options?: CheckoutStatusOptions,
): Promise<CheckoutStatus>
export function redirectToCheckout(value: unknown): void

export const VoybitPayButton: DefineComponent<{
  checkoutUrl: string
}>
export const PayButton: typeof VoybitPayButton
