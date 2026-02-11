/**
 * HTTP client for the Robinhood Analytics REST API.
 *
 * All requests include the user's API key via the x-api-key header.
 * The base URL points to the API Gateway in front of the Lambda.
 */
export class RobinhoodApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {
    // Strip trailing slash
    if (this.baseUrl.endsWith("/")) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  /**
   * Generic GET request to the API.
   * @param path   — path relative to base, e.g. "/v1/accounts"
   * @param params — optional query string key/value pairs
   */
  async request(
    path: string,
    params?: Record<string, string | undefined>
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, v);
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
      const errorBody = await response.text();
      throw new Error(
        `API returned ${response.status}: ${errorBody}`
      );
    }

    return response.json();
  }

  // ── Convenience methods ────────────────────────────────

  async listAccounts() {
    return this.request("/v1/accounts");
  }

  async listProjects(accountPrefix: string) {
    return this.request(`/v1/accounts/${accountPrefix}/projects`);
  }

  async getMarketShare(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/market-share`,
      params
    );
  }

  async getMarketOverview(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/market-overview`,
      params
    );
  }

  async getRankings(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/rankings`,
      params
    );
  }

  async getPricing(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/pricing`,
      params
    );
  }

  async getSearchTerms(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/search-terms`,
      params
    );
  }

  async getTitleAnalysis(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/title-analysis`,
      params
    );
  }

  async getGoogleAds(
    accountPrefix: string,
    projectNum: number,
    params?: Record<string, string | undefined>
  ) {
    return this.request(
      `/v1/accounts/${accountPrefix}/projects/${projectNum}/google-ads`,
      params
    );
  }

  async getScrapingStats() {
    return this.request("/v1/account/scraping-stats");
  }
}
