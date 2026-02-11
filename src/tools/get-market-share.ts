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

  text += formatMarketShareData(rows);

  return {
    content: [{ type: "text" as const, text }],
  };
}

function toNum(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function fmt(val: any, decimals = 2): string {
  const num = toNum(val);
  if (num === null) return "—";
  return num.toFixed(decimals);
}

function pct(val: any): string {
  const num = toNum(val);
  if (num === null) return "—";
  return (num * 100).toFixed(1) + "%";
}

function trend(current: any, previous: any): string {
  const c = toNum(current);
  const p = toNum(previous);
  if (c === null || p === null || p === 0) return "";
  const change = ((c - p) / p) * 100;
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  return ` (${arrow}${Math.abs(change).toFixed(1)}%)`;
}

function formatMarketShareData(rows: any[]): string {
  if (rows.length === 0) return "No data.\n";

  const display = rows.slice(0, 50);
  let text = "";

  for (const row of display) {
    // Header: company name | search term | device | status
    text += `**${row.source || "Unknown"}**`;
    if (row.q && row.q !== "all") text += ` | "${row.q}"`;
    if (row.device && row.device !== "all") text += ` | ${row.device}`;
    if (row.company_status) text += ` [${row.company_status.toUpperCase()}]`;
    text += "\n";

    // 7-day market share and rank (primary metrics)
    const ms7 = toNum(row["7d_market_share"]);
    const rank7 = toNum(row["7d_rank"]);
    if (ms7 !== null) {
      text += `  7d Market Share: ${pct(row["7d_market_share"])}${trend(row["7d_market_share"], row["7d_prev_market_share"])}\n`;
    }
    if (rank7 !== null) {
      text += `  7d Avg Rank: #${fmt(row["7d_rank"])}\n`;
    }

    // 30-day metrics
    const ms30 = toNum(row["30d_market_share"]);
    const rank30 = toNum(row["30d_rank"]);
    if (ms30 !== null) {
      text += `  30d Market Share: ${pct(row["30d_market_share"])}${trend(row["30d_market_share"], row["30d_prev_market_share"])}\n`;
    }
    if (rank30 !== null) {
      text += `  30d Avg Rank: #${fmt(row["30d_rank"])}\n`;
    }

    // 3-day metrics (if present)
    const ms3 = toNum(row["3d_market_share"]);
    const rank3 = toNum(row["3d_rank"]);
    if (ms3 !== null) {
      text += `  3d Market Share: ${pct(row["3d_market_share"])}${trend(row["3d_market_share"], row["3d_prev_market_share"])}\n`;
    }
    if (rank3 !== null) {
      text += `  3d Avg Rank: #${fmt(row["3d_rank"])}\n`;
    }

    // Pricing info
    const medianPrice = toNum(row.median_price);
    const mostExpensive = toNum(row.most_expensive_product);
    const cheapest = toNum(row.cheapest_product);
    if (medianPrice !== null) text += `  Median Price: $${fmt(row.median_price)}\n`;
    if (mostExpensive !== null && cheapest !== null) {
      text += `  Price Range: $${fmt(row.cheapest_product)} – $${fmt(row.most_expensive_product)}\n`;
    }

    // Avg rating (if present)
    const avgRating = toNum(row.avg_rating);
    if (avgRating !== null) text += `  Avg Rating: ${fmt(row.avg_rating, 1)}\n`;

    // Recent history summary (last 3 days from recent_history array)
    if (row.recent_history && Array.isArray(row.recent_history) && row.recent_history.length > 0) {
      const recent = row.recent_history.slice(0, 3);
      const historyStr = recent
        .map((h: any) => {
          const ms = toNum(h.market_share);
          const r = toNum(h.rank);
          const parts: string[] = [];
          if (h.date) parts.push(h.date);
          if (ms !== null) parts.push(`share=${pct(h.market_share)}`);
          if (r !== null) parts.push(`rank=#${r}`);
          if (h.avg_products != null) parts.push(`products=${fmt(h.avg_products, 1)}`);
          return parts.join(" ");
        })
        .join(" | ");
      text += `  Recent: ${historyStr}\n`;
    }

    text += "\n";
  }

  if (rows.length > 50) {
    text += `\n... and ${rows.length - 50} more rows (showing first 50).\n`;
  }

  return text;
}
