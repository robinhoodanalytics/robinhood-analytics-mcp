import { RobinhoodApiClient } from "../api-client.js";

export const getPricingTool = {
  name: "get_pricing",
  description:
    "Get competitor pricing data from Google Shopping. " +
    "Shows product prices, price changes over time, and price distributions " +
    "across companies. Use this for questions like " +
    "'How are competitors pricing running shoes?' or 'Who has the cheapest product?'",
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
        description: "Filter by search term",
      },
      company: {
        type: "string",
        description: "Filter by company name",
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

interface GetPricingArgs {
  account_prefix?: string;
  project_number: number;
  search_term?: string;
  company?: string;
  device?: string;
}

export async function handleGetPricing(
  api: RobinhoodApiClient,
  args: GetPricingArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const params: Record<string, string | undefined> = {
    search_term: args.search_term,
    company: args.company,
    device: args.device,
  };

  const data = await api.getPricing(prefix, project, params);

  const results = data.pricing_data || data.data || [];
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No pricing data found for project ${project}. ` +
            (data.message || "This endpoint may still be under development."),
        },
      ],
    };
  }

  let text = `## Pricing Data — Project ${project}\n`;
  text += `Results: ${results.length}\n\n`;

  for (const row of results.slice(0, 50)) {
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && val !== undefined && val !== "") {
        text += `  ${key}: ${val}\n`;
      }
    }
    text += "\n";
  }

  return {
    content: [{ type: "text" as const, text }],
  };
}
