import { RobinhoodApiClient } from "../api-client.js";

export const getMarketOverviewTool = {
  name: "get_market_overview",
  description:
    "Get daily market-wide trends and overview data from Google Shopping. " +
    "Shows aggregated daily metrics across the entire market: total products tracked, " +
    "average prices, position distributions, new entrants, and more. " +
    "Use this for high-level questions like 'How is the market trending?' " +
    "or 'Are there more competitors entering this space?'",
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
      q: {
        type: "string",
        description:
          "Filter by search term / keyword (e.g., 'leggings', 'running shoes')",
      },
      device: {
        type: "string",
        enum: ["desktop", "mobile"],
        description: "Filter by device type",
      },
    },
    required: ["project_number"],
  },
};

interface GetMarketOverviewArgs {
  account_prefix?: string;
  project_number: number;
  q?: string;
  device?: string;
}

export async function handleGetMarketOverview(
  api: RobinhoodApiClient,
  args: GetMarketOverviewArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const params: Record<string, string | undefined> = {
    q: args.q,
    device: args.device,
  };

  const data = await api.getMarketOverview(prefix, project, params);

  if (!data.data || data.data.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No market overview data found for project ${project}` +
            (args.q ? ` (search term: "${args.q}")` : "") +
            ". The data may not have been processed yet.",
        },
      ],
    };
  }

  const rows = data.data;
  const filters = data.filters_applied || {};
  const filterDesc = Object.entries(filters)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  let text = `## Market Overview — Project ${project}\n`;
  if (filterDesc) text += `Filters: ${filterDesc}\n`;
  text += `Total data points: ${data.total_results}\n\n`;

  // Format the overview data
  const display = rows.slice(0, 60);
  for (const row of display) {
    const parts: string[] = [];
    if (row.date) parts.push(`**${row.date}**`);
    if (row.q) parts.push(`"${row.q}"`);
    if (row.device) parts.push(row.device);
    text += parts.join(" | ") + "\n";

    // Print all available numeric fields
    for (const [key, val] of Object.entries(row)) {
      if (["date", "q", "device", "location"].includes(key)) continue;
      if (val !== null && val !== undefined && val !== "") {
        text += `  ${key}: ${val}\n`;
      }
    }
    text += "\n";
  }

  if (rows.length > 60) {
    text += `\n... and ${rows.length - 60} more rows.\n`;
  }

  return {
    content: [{ type: "text" as const, text }],
  };
}
