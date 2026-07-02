import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

export function registerCatalogTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_list_catalogs",
    {
      title: "List Batch catalogs",
      description: "List product/content catalogs defined in the project (GET /catalogs/list).",
      inputSchema: {
        from: z.string().optional().describe("Pagination cursor from a previous call's next_from."),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ from, limit }) => {
      const result = await client.get("/catalogs/list", { from, limit });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "batch_view_catalog",
    {
      title: "Get details about a Batch catalog",
      description:
        "Get metadata about a single catalog by name (GET /catalogs/view): field schema, item count, indexing state.",
      inputSchema: {
        name: z.string().describe("The catalog name, as returned by batch_list_catalogs."),
        indexing_token: z
          .string()
          .optional()
          .describe("Token from a prior items/edit call, to check whether that specific update has finished indexing."),
      },
    },
    async ({ name, indexing_token }) => {
      const result = await client.get("/catalogs/view", { name, indexing_token });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
