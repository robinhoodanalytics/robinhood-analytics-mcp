import { RobinhoodApiClient } from "../api-client.js";

export const getRankingsTool = {
  name: "get_rankings",
  description:
    "Get product ranking data from Google Shopping SERP tracking. " +
    "Returns positions, market share, and visibility for individual products " +
    "across search terms, locations, and devices. " +
    "Use this for questions like 'What are my top products?' or " +
    "'How does my product rank for running shoes in New York?'",
  inputSchema: {
    type: "object" as const,
    properties: {
      account_prefix: {
        type: "string",
        description: "Account prefix (default: 'acc1_')",
      },
      project_number: {
        type: "number",
        description: "Project number (default: 1)",
      },
      search_term: {
        type: "string",
        description: "Filter by search query (e.g., 'running shoes')",
      },
      location: {
        type: "string",
        description: "Filter by city location (e.g., 'New York, NY')",
      },
      device: {
        type: "string",
        enum: ["desktop", "mobile"],
        description: "Filter by device type",
      },
      company: {
        type: "string",
        description: "Filter by company/brand name (e.g., 'Nike')",
      },
      date_from: {
        type: "string",
        description: "Start date (YYYY-MM-DD)",
      },
      date_to: {
        type: "string",
        description: "End date (YYYY-MM-DD)",
      },
      limit: {
        type: "number",
        description: "Max number of results to return (default: 50)",
      },
    },
    required: ["project_number"],
  },
};

interface GetRankingsArgs {
  account_prefix?: string;
  project_number: number;
  search_term?: string;
  location?: string;
  device?: string;
  company?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export async function handleGetRankings(
  api: RobinhoodApiClient,
  args: GetRankingsArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const params: Record<string, string | undefined> = {
    search_term: args.search_term,
    location: args.location,
    device: args.device,
    company: args.company,
    date_from: args.date_from,
    date_to: args.date_to,
    limit: args.limit?.toString(),
  };

  const data = await api.getRankings(prefix, project, params);

  const results = data.results || data.data || [];
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No ranking data found for project ${project}. ` +
            (data.message || "This endpoint may still be under development."),
        },
      ],
    };
  }

  let text = `## Rankings — Project ${project}\n`;
  text += `Results: ${results.length}\n\n`;

  for (const row of results.slice(0, 50)) {
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && val !== undefined && val !== "") {
        text += `  ${key}: ${val}\n`;
      }
    }
    text += "\n";
  }

  if (results.length > 50) {
    text += `\n... and ${results.length - 50} more rows.\n`;
  }

  return {
    content: [{ type: "text" as const, text }],
  };
}
