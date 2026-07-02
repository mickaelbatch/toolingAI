import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

export function registerOrchestrationTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_list_orchestrations",
    {
      title: "List Batch orchestrations (campaigns, automations)",
      description:
        "List campaigns, recurring automations, triggers and in-app orchestrations (GET /orchestrations/list). " +
        "This is the read/reporting counterpart of the Campaigns write API — use it to find a campaign's id " +
        "before calling batch_get_orchestration_stats, batch_update_campaign or batch_delete_campaign. " +
        "Note: there is no /campaigns/list endpoint in the Batch API — this is the only way to list campaigns.",
      inputSchema: {
        from: z.string().optional().describe("Pagination cursor from a previous call's next_from."),
        limit: z.number().int().min(1).max(100).optional(),
        status: z.array(z.enum(["draft", "running", "completed", "stopped"])).optional(),
        type: z.array(z.enum(["campaign", "recurring", "trigger", "warmup"])).optional(),
        channels: z.array(z.enum(["email", "push", "in-app", "sms", "universal"])).optional(),
      },
    },
    async ({ from, limit, status, type, channels }) => {
      const result = await client.get("/orchestrations/list", { from, limit, status, type, channels });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "batch_get_orchestration_stats",
    {
      title: "Get performance stats for a Batch orchestration",
      description:
        "Get sent/delivered/open/click/conversion/revenue metrics for a campaign or automation " +
        "(GET /orchestrations/stats). Date range cannot start more than 6 months ago. Response data is in a " +
        "'details' array, one entry per day. To compute open rate, divide unique_open by sent_optin (NOT sent, " +
        "which includes non-opted-in sends) and multiply by 100. For email, unique_machine_open counts " +
        "bot/automated opens — subtract it from unique_open first for a 'human' open rate.",
      inputSchema: {
        orchestration_id: z.string(),
        from: z.string().describe("Start date, yyyy-MM-dd."),
        to: z.string().describe("End date, yyyy-MM-dd."),
        include_platforms: z.boolean().optional().describe("Include per-platform (iOS/Android/Web) breakdown."),
      },
    },
    async ({ orchestration_id, from, to, include_platforms }) => {
      const result = await client.get("/orchestrations/stats", {
        orchestration_id,
        from,
        to,
        include_platforms,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "batch_view_orchestration",
    {
      title: "Get full details of a Batch push campaign",
      description:
        "Get full message content and targeting for a push campaign orchestration (GET /orchestrations/view): " +
        "title, body, deeplinks, targeting query, languages/regions. " +
        "Batch only supports this for push campaigns — it 403s if the id resolves to an email campaign, " +
        "automation, or in-app orchestration.",
      inputSchema: {
        orchestration_id: z.string(),
      },
    },
    async ({ orchestration_id }) => {
      const result = await client.get("/orchestrations/view", { orchestration_id });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
