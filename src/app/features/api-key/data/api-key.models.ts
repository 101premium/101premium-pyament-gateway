export interface ApiKeyData {
  apiKey: string | null;
  testApiKey: string | null;
}

export interface ApiKeyResponse {
  code: string;
  description: string;
  data: ApiKeyData;
}
