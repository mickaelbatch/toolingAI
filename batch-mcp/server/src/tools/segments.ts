import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

export function registerSegmentTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_list_segments",
    {
      title: "List Batch segments",
      description:
        "List segments defined in the project (GET /segments/list). Segment codes returned here can be used " +
        "to filter batch_export_profiles.",
      inputSchema: {
        from: z.string().optional().describe("Pagination cursor from a previous call's next_from."),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ from, limit }) => {
      const result = await client.get("/segments/list", { from, limit });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
