# Robinhood Analytics MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that connects **Claude** to your **Robinhood Analytics** data — Google Shopping rank tracking, market share, competitor pricing, and more.

Ask Claude questions like:
- "Who dominates the leggings market on Google Shopping?"
- "How has Nike's market share changed over the last 30 days?"
- "Show me my top-ranked products for running shoes in New York"
- "Which competitors entered the market recently?"

## Quick Start

### 1. Get your API key

1. Log in to [Robinhood Analytics](https://www.robinhoodanalytics.com)
2. Go to **Settings** → **MCP Connection**
3. Click **Generate API Key**
4. Copy the key (starts with `rha_`)

### 2. Add to Claude Desktop

Open your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following:

```json
{
  "mcpServers": {
    "robinhood-analytics": {
      "command": "npx",
      "args": ["-y", "robinhood-analytics-mcp"],
      "env": {
        "ROBINHOOD_API_KEY": "rha_your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After saving the config, restart Claude Desktop. You should see a 🔌 icon indicating the MCP server is connected.

### 4. Start asking questions

Claude now has access to your analytics data. Try:

> "List my accounts and projects"

> "Show me the market share breakdown for project 1"

> "Who are the top 5 companies by visibility for the keyword 'leggings'?"

---

## Available Tools

| Tool | Description |
|------|-------------|
| `list_accounts` | List all your Robinhood Analytics accounts |
| `list_projects` | List projects within an account |
| `get_market_share` | Company-level SERP market share data |
| `get_market_overview` | Daily market-wide trends and aggregates |
| `get_rankings` | Product ranking positions and visibility |
| `get_pricing` | Competitor pricing data |
| `get_search_terms` | Keywords tracked in a project |
| `get_title_analysis` | AI title optimization scores and suggestions |
| `get_google_ads` | Google Ads performance data (if integrated) |
| `get_scraping_stats` | Account scanning usage and limits |

### Tool Parameters

Most tools accept these common parameters:

- **`account_prefix`** — Your account prefix (default: `acc1_`)
- **`project_number`** — Project number (required for data tools)
- **`q`** / **`search_term`** — Filter by keyword
- **`device`** — `desktop` or `mobile`
- **`source`** / **`company`** — Filter by company name

---

## Example Conversations

**Market analysis:**
> You: "What's the competitive landscape for 'yoga pants' on desktop?"
>
> Claude calls `get_market_share` with `q="yoga pants"`, `device="desktop"` and provides a breakdown of market leaders, their share percentages, and trends.

**Trend detection:**
> You: "Are there any new competitors entering the running shoes market?"
>
> Claude calls `get_market_overview` and identifies companies that recently appeared in the SERP data.

**Performance check:**
> You: "How are my products ranking for 'wireless headphones' in Chicago?"
>
> Claude calls `get_rankings` with the search term and location filters.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ROBINHOOD_API_KEY` | Yes | Your API key from Settings → MCP Connection |
| `ROBINHOOD_API_URL` | No | Custom API endpoint (advanced use only) |

---

## Development

```bash
# Clone the repo
git clone https://github.com/robinhood-analytics/robinhood-analytics-mcp.git
cd robinhood-analytics-mcp

# Install dependencies
npm install

# Run in development mode
ROBINHOOD_API_KEY=rha_your_key npm run dev

# Build for production
npm run build
```

---

## Security

- Your API key is a **bearer token** — treat it like a password
- Keys are scoped to your account only — you cannot access other users' data
- The API is **read-only** — no data can be modified through MCP
- Revoke keys instantly from Settings → MCP Connection
- Keys are validated on every request against the server

---

## Requirements

- **Node.js** 18 or later
- **Claude Desktop** with MCP support
- A **Robinhood Analytics** account with active data

---

## Support

- Website: [robinhoodanalytics.com](https://www.robinhoodanalytics.com)
- Issues: [GitHub Issues](https://github.com/robinhood-analytics/robinhood-analytics-mcp/issues)

---

## License

MIT — see [LICENSE](./LICENSE)
