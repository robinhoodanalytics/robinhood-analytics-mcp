import { RobinhoodApiClient } from "../api-client.js";

export const getGoogleAdsTool = {
  name: "get_google_ads",
  description:
    "Get Google Ads performance data linked to Google Shopping products. " +
    "Shows impressions, clicks, cost, conversions, and ROAS for products. " +
    "Requires Google Ads integration to be set up in the project. " +
    "Use this for questions like 'Which products have the best ROAS?' " +
    "or 'How much am I spending on ads for running shoes?'",
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
    },
    required: ["project_number"],
  },
};

interface GetGoogleAdsArgs {
  account_prefix?: string;
  project_number: number;
  search_term?: string;
}

export async function handleGetGoogleAds(
  api: RobinhoodApiClient,
  args: GetGoogleAdsArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const params: Record<string, string | undefined> = {
    search_term: args.search_term,
  };

  const data = await api.getGoogleAds(prefix, project, params);

  const results = data.products || data.data || [];
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No Google Ads data found for project ${project}. ` +
            (data.google_ads_available === false
              ? "Google Ads integration is not set up for this project."
              : data.message || "This endpoint may still be under development."),
        },
      ],
    };
  }

  let text = `## Google Ads Data — Project ${project}\n`;
  text += `Products: ${results.length}\n\n`;

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
