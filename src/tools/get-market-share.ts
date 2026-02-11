import { RobinhoodApiClient } from "../api-client.js";

export const getMarketShareTool = {
  name: "get_market_share",
  description:
    "Get company-level SERP market share data from Google Shopping. " +
    "Shows each company's market share percentage, average rank, visibility score, " +
    "number of products, and trends over time — broken down by search term, " +
    "location, device, and date. " +
    "Use this to answer questions like 'Who dominates the leggings market?' " +
    "or 'How has Nike's market share changed?'",
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
      source: {
        type: "string",
        description:
          "Filter by retailer/source name (e.g., 'Amazon', 'Nike')",
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

interface GetMarketShareArgs {
  account_prefix?: string;
  project_number: number;
  source?: string;
  q?: string;
  device?: string;
}

export async function handleGetMarketShare(
  api: RobinhoodApiClient,
  args: GetMarketShareArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const params: Record<string, string | undefined> = {
    source: args.source,
    q: args.q,
    device: args.device,
  };

  const data = await api.getMarketShare(prefix, project, params);

  if (!data.data || data.data.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No market share data found for project ${project}` +
            (args.q ? ` (search term: "${args.q}")` : "") +
            (args.source ? ` (source: "${args.source}")` : "") +
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

  let text = `## Market Share Data — Project ${project}\n`;
  if (filterDesc) text += `Filters: ${filterDesc}\n`;
  text += `Total results: ${data.total_results}\n\n`;

  // Format as readable table
  text += formatMarketShareData(rows);

  return {
    content: [{ type: "text" as const, text }],
  };
}

function formatMarketShareData(rows: any[]): string {
  if (rows.length === 0) return "No data.\n";

  // Show first 50 rows to stay under response size limits
  const display = rows.slice(0, 50);
  let text = "";

  for (const row of display) {
    text += `**${row.source || "Unknown"}**`;
    if (row.q) text += ` | "${row.q}"`;
    if (row.device) text += ` | ${row.device}`;
    if (row.location) text += ` | ${row.location}`;
    text += "\n";

    if (row.market_share !== undefined)
      text += `  Market Share: ${row.market_share}%\n`;
    if (row.avg_rank !== undefined)
      text += `  Avg Rank: ${row.avg_rank}\n`;
    if (row.visibility !== undefined)
      text += `  Visibility: ${row.visibility}\n`;
    if (row.product_count !== undefined)
      text += `  Products: ${row.product_count}\n`;
    if (row.date) text += `  Date: ${row.date}\n`;
    text += "\n";
  }

  if (rows.length > 50) {
    text += `\n... and ${rows.length - 50} more rows (showing first 50).\n`;
  }

  return text;
}
