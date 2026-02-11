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

// Read API key from environment
const API_KEY = process.env.ROBINHOOD_API_KEY;
if (!API_KEY) {
  console.error("ERROR: ROBINHOOD_API_KEY environment variable is required");
  process.exit(1);
}

const API_BASE_URL =
  process.env.ROBINHOOD_API_URL ||
  "https://6x8wun8r7i.execute-api.us-east-2.amazonaws.com/prod";

const api = new RobinhoodApiClient(API_BASE_URL, API_KEY);

const server = new Server(
  { name: "robinhood-analytics", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    listAccountsTool,
    listProjectsTool,
    getMarketShareTool,
    getMarketOverviewTool,
    getRankingsTool,
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_accounts":
        return await handleListAccounts(api);

      case "list_projects":
        return await handleListProjects(api, args as any);

      case "get_market_share":
        return await handleGetMarketShare(api, args as any);

      case "get_market_overview":
        return await handleGetMarketOverview(api, args as any);

      case "get_rankings":
        return await handleGetRankings(api, args as any);

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}. Available tools: list_accounts, list_projects, get_market_share, get_market_overview, get_rankings`,
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error.message || String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Robinhood Analytics MCP server running (5 tools)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
