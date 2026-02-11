import { RobinhoodApiClient } from "../api-client.js";

export const getSearchTermsTool = {
  name: "get_search_terms",
  description:
    "Get the list of search terms (keywords) tracked in a project, " +
    "with summary metrics for each. Use this to see which keywords are being " +
    "monitored and their performance overview.",
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
    },
    required: ["project_number"],
  },
};

interface GetSearchTermsArgs {
  account_prefix?: string;
  project_number: number;
}

export async function handleGetSearchTerms(
  api: RobinhoodApiClient,
  args: GetSearchTermsArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const data = await api.getSearchTerms(prefix, project);

  const results = data.search_terms || data.data || [];
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No search terms data found for project ${project}. ` +
            (data.message || "This endpoint may still be under development."),
        },
      ],
    };
  }

  let text = `## Search Terms — Project ${project}\n`;
  text += `Total keywords: ${results.length}\n\n`;

  for (const term of results.slice(0, 50)) {
    if (typeof term === "string") {
      text += `• ${term}\n`;
    } else {
      for (const [key, val] of Object.entries(term)) {
        if (val !== null && val !== undefined && val !== "") {
          text += `  ${key}: ${val}\n`;
        }
      }
      text += "\n";
    }
  }

  return {
    content: [{ type: "text" as const, text }],
  };
}
