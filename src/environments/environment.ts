export const environment = {
  production: false,
  apiBaseUrl: 'https://api.101premium.com/api/v1',
  /**
   * When set, Help Center “Ask AI” POSTs `{ message: string }` here (Bearer + appMode via interceptor).
   * Leave empty to use the built-in local assistant (no network).
   */
  helpAiChatUrl: ''
};
