import { RobinhoodApiClient } from "../api-client.js";

export const listAccountsTool = {
  name: "list_accounts",
  description:
    "List all Robinhood Analytics accounts available to you. " +
    "Start here — this returns your account prefix(es) needed for all other tools. " +
    "Most users have one account (acc1_).",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handleListAccounts(api: RobinhoodApiClient) {
  const data = await api.listAccounts();

  const accounts = data.accounts || [];
  if (accounts.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No accounts found. Your data may still be processing.",
        },
      ],
    };
  }

  let text = `Found ${accounts.length} account(s):\n\n`;
  for (const acc of accounts) {
    text += `• **${acc.account_name || acc.account_prefix}**\n`;
    text += `  Prefix: \`${acc.account_prefix}\`\n`;
    text += `  Projects: ${acc.projects_count ?? "unknown"}\n`;
    text += `  Data available: ${acc.data_available ? "Yes" : "Pending"}\n\n`;
  }
  text += "Use `list_projects` with an account prefix to see projects.";

  return {
    content: [{ type: "text" as const, text }],
  };
}
