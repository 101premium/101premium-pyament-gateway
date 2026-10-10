export const environment = {
  production: true,
  apiBaseUrl: 'https://api.101premium.com/api/v1',
  /** Hosted checkout page; the link is `<base>/<reference>/<0|1>` (0 = test, 1 = live). */
  paymentLinkCheckoutBaseUrl: 'https://pay.realitybee.com.ng/payment-link/pay',
  /** Where buyers are sent after completing a payment link checkout. */
  paymentLinkRedirectUrl: 'https://pay.realitybee.com.ng/thank-you',
  helpAiChatUrl: ''
};
