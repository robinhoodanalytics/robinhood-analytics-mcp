#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { RobinhoodApiClient } from "./api-client.js";

// Tool definitions
import { listAccountsTool, handleListAccounts } from "./tools/list-accounts.js";
import { listProjectsTool, handleListProjects } from "./tools/list-projects.js";
import { getMarketShareTool, handleGetMarketShare } from "./tools/get-market-share.js";
import { getMarketOverviewTool, handleGetMarketOverview } from "./tools/get-market-overview.js";
import { getRankingsTool, handleGetRankings } from "./tools/get-rankings.js";
import { getPricingTool, handleGetPricing } from "./tools/get-pricing.js";
import { getSearchTermsTool, handleGetSearchTerms } from "./tools/get-search-terms.js";
import { getTitleAnalysisTool, handleGetTitleAnalysis } from "./tools/get-title-analysis.js";
import { getGoogleAdsTool, handleGetGoogleAds } from "./tools/get-google-ads.js";
import { getScrapingStatsTool, handleGetScrapingStats } from "./tools/get-scraping-stats.js";

// ── Configuration ──────────────────────────────────────────
const API_KEY = process.env.ROBINHOOD_API_KEY;
if (!API_KEY) {
  console.error(
    "Error: ROBINHOOD_API_KEY environment variable is required.\n" +
    "Get your API key from Robinhood Analytics → Settings → MCP Connection.\n" +
    "Then add it to your claude_desktop_config.json env block."
  );
  process.exit(1);
}

const API_BASE_URL =
  process.env.ROBINHOOD_API_URL ||
  "https://6x8wun8r7i.execute-api.us-east-2.amazonaws.com/prod";

const apiClient = new RobinhoodApiClient(API_BASE_URL, API_KEY);

// ── Server Setup ───────────────────────────────────────────
const server = new Server(
  {
    name: "robinhood-analytics",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Register Tools ─────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      listAccountsTool,
      listProjectsTool,
      getMarketShareTool,
      getMarketOverviewTool,
      getRankingsTool,
      getPricingTool,
      getSearchTermsTool,
      getTitleAnalysisTool,
      getGoogleAdsTool,
      getScrapingStatsTool,
    ],
  };
});

// ── Handle Tool Calls ──────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_accounts":
        return await handleListAccounts(apiClient);
      case "list_projects":
        return await handleListProjects(apiClient, args as any);
      case "get_market_share":
        return await handleGetMarketShare(apiClient, args as any);
      case "get_market_overview":
        return await handleGetMarketOverview(apiClient, args as any);
      case "get_rankings":
        return await handleGetRankings(apiClient, args as any);
      case "get_pricing":
        return await handleGetPricing(apiClient, args as any);
      case "get_search_terms":
        return await handleGetSearchTerms(apiClient, args as any);
      case "get_title_analysis":
        return await handleGetTitleAnalysis(apiClient, args as any);
      case "get_google_ads":
        return await handleGetGoogleAds(apiClient, args as any);
      case "get_scraping_stats":
        return await handleGetScrapingStats(apiClient);
      default:
        return {
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error: any) {
    const message = error.message || String(error);
    console.error(`[robinhood-mcp] Tool "${name}" error:`, message);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Start ──────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Robinhood Analytics MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
