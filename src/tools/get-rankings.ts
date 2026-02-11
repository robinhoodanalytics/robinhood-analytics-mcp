import { RobinhoodApiClient } from "../api-client.js";

export const getRankingsTool = {
  name: "get_rankings",
  description:
    "Get product ranking data from Google Shopping SERP tracking. " +
    "Returns positions, market share, and visibility for individual products " +
    "across search terms, locations, and devices. " +
    "Use this for questions like 'What are my top products?' or " +
    "'How does my product rank for running shoes?'",
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
      device: {
        type: "string",
        enum: ["desktop", "mobile"],
        description: "Filter by device type",
      },
      location: {
        type: "string",
        description: "Filter by city location (e.g., 'Vancouver')",
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
  device?: string;
  location?: string;
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
    device: args.device,
    location: args.location,
    limit: args.limit?.toString(),
  };

  const data = await api.getRankings(prefix, project, params);

  if (!data.data || data.data.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No ranking data found for project ${project}` +
            (args.search_term ? ` (search term: "${args.search_term}")` : "") +
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

  let text = `## Product Rankings — Project ${project}\n`;
  if (filterDesc) text += `Filters: ${filterDesc}\n`;
  text += `Total results: ${data.total_results}\n\n`;

  text += formatRankingsData(rows, args.limit || 50);

  return {
    content: [{ type: "text" as const, text }],
  };
}

function toNum(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  // Handle string prices like "$158.00"
  const cleaned = typeof val === "string" ? val.replace(/[$,]/g, "") : val;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function fmt(val: any, decimals = 2): string {
  const num = toNum(val);
  if (num === null) return "—";
  return num.toFixed(decimals);
}

function formatRankingsData(rows: any[], limit: number): string {
  if (rows.length === 0) return "No data.\n";

  const display = rows.slice(0, limit);
  let text = "";

  for (const row of display) {
    // Product title + brand
    const brand = row.source || "Unknown";
    const title = row.title || "Untitled";
    text += `**${title}**\n`;

    // Context line: brand | keyword | location | device
    const context: string[] = [brand];
    if (row.q) context.push(`"${row.q}"`);
    if (row.location_requested) context.push(row.location_requested);
    if (row.device) context.push(row.device);
    text += `  ${context.join(" | ")}\n`;

    // Price info
    if (row.price) {
      text += `  Price: ${row.price}`;
      if (row.old_price) text += ` (was ${row.old_price})`;
      if (row.sale) text += ` 🏷️ SALE`;
      text += "\n";
    }

    // Position metrics
    const avg3d = toNum(row.avg_3days_position);
    const avg7d = toNum(row.avg_week_position);
    const avg30d = toNum(row.avg_month_position);

    if (avg3d !== null || avg7d !== null || avg30d !== null) {
      text += "  Avg Position:";
      if (avg3d !== null) text += ` 3d=#${fmt(row.avg_3days_position)}`;
      if (avg7d !== null) text += ` 7d=#${fmt(row.avg_week_position)}`;
      if (avg30d !== null) text += ` 30d=#${fmt(row.avg_month_position)}`;
      text += "\n";
    }

    // Visibility
    const vis = toNum(row.avg_visibility);
    const vis30 = toNum(row.avg_month_visibility);
    if (vis !== null || vis30 !== null) {
      text += "  Visibility:";
      if (vis !== null) text += ` recent=${(vis * 100).toFixed(0)}%`;
      if (vis30 !== null) text += ` 30d=${(vis30 * 100).toFixed(0)}%`;
      text += "\n";
    }

    // Trend indicators
    const trends: string[] = [];
    if (row.trend && row.trend !== "N/A") trends.push(`Today: ${row.trend}`);
    if (row.week_trend && row.week_trend !== "N/A") trends.push(`7d: ${row.week_trend}`);
    if (row.month_trend && row.month_trend !== "N/A") trends.push(`30d: ${row.month_trend}`);
    if (trends.length > 0) {
      text += `  Trend: ${trends.join(", ")}\n`;
    }

    // Status
    if (row.product_status) {
      text += `  Status: ${row.product_status}`;
      if (row.improvement_status && Array.isArray(row.improvement_status) && row.improvement_status.length > 0) {
        text += ` | ${row.improvement_status.join(", ")}`;
      }
      text += "\n";
    }

    // Recent position history
    if (row.recent_history && Array.isArray(row.recent_history) && row.recent_history.length > 0) {
      const history = row.recent_history.slice(0, 7);
      text += `  History: `;
      text += history
        .map((h: any) => {
          const date = h.date ? h.date.slice(5) : "?"; // MM-DD
          const pos = toNum(h.avg_position);
          const visPct = toNum(h.visibility);
          const parts: string[] = [date];
          if (pos !== null) parts.push(`#${pos.toFixed(1)}`);
          if (visPct !== null) parts.push(`${(visPct * 100).toFixed(0)}%vis`);
          return parts.join(":");
        })
        .join(" → ");
      text += "\n";
    }

    text += "\n";
  }

  if (rows.length > limit) {
    text += `\n... and ${rows.length - limit} more products (showing first ${limit}).\n`;
  }

  return text;
}
