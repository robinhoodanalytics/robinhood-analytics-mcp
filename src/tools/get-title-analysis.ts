import { RobinhoodApiClient } from "../api-client.js";

export const getTitleAnalysisTool = {
  name: "get_title_analysis",
  description:
    "Get AI-powered title optimization analysis for Google Shopping product listings. " +
    "Shows title quality scores, keyword coverage, and improvement suggestions. " +
    "Use this for questions like 'Which of my titles need improvement?' " +
    "or 'What keywords am I missing in my product titles?'",
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

interface GetTitleAnalysisArgs {
  account_prefix?: string;
  project_number: number;
}

export async function handleGetTitleAnalysis(
  api: RobinhoodApiClient,
  args: GetTitleAnalysisArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const project = args.project_number || 1;

  const data = await api.getTitleAnalysis(prefix, project);

  const results = data.title_analysis || data.data || [];
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No title analysis data found for project ${project}. ` +
            (data.message || "This endpoint may still be under development."),
        },
      ],
    };
  }

  let text = `## Title Analysis — Project ${project}\n`;
  text += `Titles analyzed: ${results.length}\n\n`;

  for (const row of results.slice(0, 30)) {
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
