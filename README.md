# Robinhood Analytics MCP Server

MCP (Model Context Protocol) server for [Robinhood Analytics](https://robinhoodanalytics.com) — Google Shopping SERP intelligence.

## Tools

| Tool | Description |
|------|-------------|
| `list_accounts` | List your Robinhood Analytics accounts |
| `list_projects` | List projects within an account |
| `get_market_share` | Company-level market share, rank, pricing, and trends |
| `get_market_overview` | Daily market-wide metrics: competitors, products, on-sale counts |
| `get_rankings` | Product-level ranking data with position, visibility, and trends |

## Setup

### 1. Install dependencies

```bash
npm install
npm run build
```

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "robinhood-analytics": {
      "command": "node",
      "args": ["/path/to/robinhood-analytics-mcp/dist/index.js"],
      "env": {
        "ROBINHOOD_API_KEY": "rha_your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

The MCP server will appear in the tools menu.

## Example Queries

- "Who has the highest market share for leggings?"
- "Show me my product rankings for black leggings on mobile"
- "How many competitors are in the flare leggings market?"
- "What's the trend for my top products this week?"

## API Key

Contact [Robinhood Analytics](https://robinhoodanalytics.com) to get an API key.

## License

MIT
