#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BatchClient, BatchApiError, loadConfigFromEnv } from "./batchClient.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerExportTools } from "./tools/exports.js";
import { registerCampaignTools } from "./tools/campaigns.js";
import { registerOrchestrationTools } from "./tools/orchestrations.js";
import { registerAudienceTools } from "./tools/audiences.js";
import { registerCatalogTools } from "./tools/catalogs.js";
import { registerSegmentTools } from "./tools/segments.js";

async function main() {
  const config = loadConfigFromEnv();
  const client = new BatchClient(config);

  const server = new McpServer({
    name: "batch-cep-mcp",
    version: "0.1.0",
  });

  registerProfileTools(server, client);
  registerExportTools(server, client);
  registerCampaignTools(server, client);
  registerOrchestrationTools(server, client);
  registerAudienceTools(server, client);
  registerCatalogTools(server, client);
  registerSegmentTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err instanceof BatchApiError ? err.message : (err?.stack ?? String(err)));
  process.exit(1);
});
