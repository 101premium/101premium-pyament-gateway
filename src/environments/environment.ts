export const environment = {
  production: false,
  apiBaseUrl: 'https://card-gateway-fc4a26d94a50.herokuapp.com/api/v1',
  /**
   * When set, Help Center “Ask AI” POSTs `{ message: string }` here (Bearer + appMode via interceptor).
   * Leave empty to use the built-in local assistant (no network).
   */
  helpAiChatUrl: ''
};
