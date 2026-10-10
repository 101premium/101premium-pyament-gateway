export const environment = {
  production: false,
  apiBaseUrl: 'https://api.101premium.com/api/v1',
  /** Where buyers are sent after completing a payment link checkout. */
  paymentLinkRedirectUrl: 'https://101premium.com/thank-you',
  /**
   * When set, Help Center “Ask AI” POSTs `{ message: string }` here (Bearer + appMode via interceptor).
   * Leave empty to use the built-in local assistant (no network).
   */
  helpAiChatUrl: ''
};
