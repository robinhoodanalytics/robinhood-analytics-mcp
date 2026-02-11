import { RobinhoodApiClient } from "../api-client.js";

export const listProjectsTool = {
  name: "list_projects",
  description:
    "List all projects within a Robinhood Analytics account. " +
    "Each project tracks a set of search terms across locations and devices. " +
    "Use list_accounts first to get your account_prefix.",
  inputSchema: {
    type: "object" as const,
    properties: {
      account_prefix: {
        type: "string",
        description:
          "Account prefix from list_accounts (e.g., 'acc1_'). Defaults to 'acc1_'.",
      },
    },
    required: [],
  },
};

interface ListProjectsArgs {
  account_prefix?: string;
}

export async function handleListProjects(
  api: RobinhoodApiClient,
  args: ListProjectsArgs
) {
  const prefix = args.account_prefix || "acc1_";
  const data = await api.listProjects(prefix);

  const projects = data.projects || [];
  if (projects.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `No projects found for account \`${prefix}\`. ` +
            (data.message || "Data may still be processing."),
        },
      ],
    };
  }

  let text = `Account \`${prefix}\` — ${projects.length} project(s):\n\n`;
  for (const p of projects) {
    text += `• **Project ${p.project_number}**: ${p.name || "Untitled"}\n`;
    if (p.country) text += `  Country: ${p.country}\n`;
    if (p.search_terms?.length)
      text += `  Search terms: ${p.search_terms.join(", ")}\n`;
    if (p.locations?.length)
      text += `  Locations: ${p.locations.join(", ")}\n`;
    if (p.devices?.length)
      text += `  Devices: ${p.devices.join(", ")}\n`;
    text += "\n";
  }

  return {
    content: [{ type: "text" as const, text }],
  };
}
