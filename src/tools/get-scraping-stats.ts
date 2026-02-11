import { RobinhoodApiClient } from "../api-client.js";

export const getScrapingStatsTool = {
  name: "get_scraping_stats",
  description:
    "Get your account's scraping/scanning usage stats. " +
    "Shows how many scans you've used today, your daily limit, and remaining quota. " +
    "Use this to check your account usage.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handleGetScrapingStats(api: RobinhoodApiClient) {
  const data = await api.getScrapingStats();

  let text = `## Scraping Stats\n\n`;
  text += `Scans used today: ${data.scans_used_today ?? "N/A"}\n`;
  text += `Daily limit: ${data.scans_limit ?? "N/A"}\n`;
  if (data.scans_remaining !== undefined)
    text += `Remaining: ${data.scans_remaining}\n`;
  if (data.projects_active !== undefined)
    text += `Active projects: ${data.projects_active}\n`;
  if (data.last_scan_at)
    text += `Last scan: ${data.last_scan_at}\n`;
  if (data.message) text += `\nNote: ${data.message}\n`;

  return {
    content: [{ type: "text" as const, text }],
  };
}
