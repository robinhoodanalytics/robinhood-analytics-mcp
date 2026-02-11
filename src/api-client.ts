/**
 * HTTP client for the Robinhood Analytics API Gateway.
 * Handles authentication, request construction, and response parsing.
 * 
 * URL patterns match Lambda routes:
 *   /v1/accounts
 *   /v1/accounts/{prefix}/projects
 *   /v1/accounts/{prefix}/projects/{num}/market-share
 *   /v1/accounts/{prefix}/projects/{num}/market-overview
 *   /v1/accounts/{prefix}/projects/{num}/rankings
 */
export class RobinhoodApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private async request(path: string, params?: Record<string, string | undefined>): Promise<any> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API error ${response.status}: ${body}`);
    }

    return response.json();
  }

  // === Account & Project endpoints (live DynamoDB) ===

  async listAccounts(): Promise<any> {
    return this.request("/v1/accounts");
  }

  async listProjects(accountPrefix: string): Promise<any> {
    return this.request(`/v1/accounts/${accountPrefix}/projects`);
  }

  // === Data endpoints (S3 JSON cache) ===

  async getMarketShare(
    accountPrefix: string,
    projectNumber: number,
    params?: Record<string, string | undefined>
  ): Promise<any> {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNumber}/market-share`,
      params
    );
  }

  async getMarketOverview(
    accountPrefix: string,
    projectNumber: number,
    params?: Record<string, string | undefined>
  ): Promise<any> {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNumber}/market-overview`,
      params
    );
  }

  async getRankings(
    accountPrefix: string,
    projectNumber: number,
    params?: Record<string, string | undefined>
  ): Promise<any> {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNumber}/rankings`,
      params
    );
  }
}
