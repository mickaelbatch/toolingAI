import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

export function registerAudienceTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_list_audiences",
    {
      title: "List Batch custom audiences",
      description: "List custom audiences defined in the project (GET /audiences/list).",
      inputSchema: {
        from: z.string().optional().describe("Pagination cursor from a previous call's next_from."),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ from, limit }) => {
      const result = await client.get("/audiences/list", { from, limit });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "batch_view_audience",
    {
      title: "Get details about a Batch custom audience",
      description:
        "Get metadata about a single custom audience by name (GET /audiences/view): size, type, indexing state.",
      inputSchema: {
        name: z.string().describe("The audience name, as returned by batch_list_audiences."),
        indexing_token: z
          .string()
          .optional()
          .describe("Token from a prior create/update/replace/remove call, to check whether that specific change has finished indexing."),
      },
    },
    async ({ name, indexing_token }) => {
      const result = await client.get("/audiences/view", { name, indexing_token });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
