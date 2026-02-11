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

  text += formatMarketOverviewData(rows);

  return {
    content: [{ type: "text" as const, text }],
  };
}

function toNum(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function fmtInt(val: any): string {
  const num = toNum(val);
  if (num === null) return "—";
  return Math.round(num).toLocaleString();
}

/**
 * Extract date string from the nested date object or plain string.
 * S3 data uses {"value": "2026-02-04"} format.
 */
function extractDate(dateField: any): string {
  if (!dateField) return "Unknown";
  if (typeof dateField === "string") return dateField;
  if (typeof dateField === "object" && dateField.value) return dateField.value;
  return String(dateField);
}

function formatMarketOverviewData(rows: any[]): string {
  if (rows.length === 0) return "No data.\n";

  // Group by date for cleaner display
  const byDate = new Map<string, any[]>();
  for (const row of rows) {
    const date = extractDate(row.date);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(row);
  }

  let text = "";
  let dateCount = 0;

  for (const [date, dateRows] of byDate) {
    if (dateCount >= 14) break; // Limit to 14 days
    dateCount++;

    text += `### ${date}\n`;

    for (const row of dateRows) {
      // Sub-header: search term + device
      const parts: string[] = [];
      if (row.q && row.q !== "all") parts.push(`"${row.q}"`);
      else parts.push("All keywords");
      if (row.device && row.device !== "all") parts.push(row.device);
      else parts.push("All devices");
      text += `  ${parts.join(" | ")}\n`;

      // Metrics
      const companies = toNum(row.companies);
      const top3 = toNum(row.companies_top3);
      const top8 = toNum(row.companies_top8);
      const products = toNum(row.un_products);
      const onSale = toNum(row.un_products_on_sale);

      if (companies !== null) text += `    Companies: ${fmtInt(row.companies)}`;
      if (top3 !== null) text += ` (Top 3: ${fmtInt(row.companies_top3)}, Top 8: ${fmtInt(row.companies_top8)})`;
      text += "\n";

      if (products !== null) {
        text += `    Products: ${fmtInt(row.un_products)}`;
        if (onSale !== null && onSale > 0) text += ` (${fmtInt(row.un_products_on_sale)} on sale)`;
        text += "\n";
      }

      text += "\n";
    }
  }

  if (byDate.size > 14) {
    text += `\n... showing 14 of ${byDate.size} dates.\n`;
  }

  return text;
}
