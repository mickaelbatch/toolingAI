import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

const pushMessage = z.object({
  channel_type: z.literal("push"),
  platform_type: z.array(z.enum(["ios", "android", "web"])).min(1),
  title: z.string().optional(),
  body: z.string(),
  deeplink: z.string().optional(),
});

const emailMessage = z.object({
  channel_type: z.literal("email"),
  subject: z.string(),
  sender_identity_id: z.string(),
  html: z.string(),
});

const campaignSchema = {
  name: z.string().describe("Display name of the campaign on the dashboard."),
  state: z
    .literal("DRAFT")
    .describe(
      "Always DRAFT. This server never sends or schedules a real campaign — creating/updating a campaign only " +
        "saves it for manual review and launch on the Batch dashboard.",
    ),
  start_time: z
    .string()
    .describe("RFC 3339 datetime, or 'now'. Has no effect until a human sets the campaign to RUNNING on the dashboard."),
  local_time: z.boolean().optional().describe("If true, send according to each profile's timezone."),
  send_rate: z.number().int().min(1000).max(1000000).optional().describe("Max messages per minute."),
  languages: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  query: z.record(z.string(), z.any()).optional().describe("Mongo-like targeting query on profile attributes/events."),
  labels: z.array(z.string()).max(5).optional(),
  message: z.union([pushMessage, emailMessage]).describe("The single message (push or email) to send."),
};

function buildCampaignBody(input: {
  name: string;
  state: string;
  start_time: string;
  local_time?: boolean;
  send_rate?: number;
  languages?: string[];
  regions?: string[];
  query?: Record<string, unknown>;
  labels?: string[];
  message: Record<string, unknown>;
}) {
  return {
    name: input.name,
    state: input.state,
    send_rate: input.send_rate,
    when: { start_time: input.start_time, local_time: input.local_time },
    targeting: { languages: input.languages, regions: input.regions, query: input.query },
    labels: input.labels,
    messages: [input.message],
  };
}

export function registerCampaignTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_create_campaign",
    {
      title: "Create a Batch campaign (draft only)",
      description:
        "Create a push or email campaign as a DRAFT (POST /campaigns/create with state=DRAFT). " +
        "This server never sends real messages: a human must open the campaign on the Batch dashboard and " +
        "set it to RUNNING there to actually send it.",
      inputSchema: campaignSchema,
    },
    async (input) => {
      const result = await client.post<{ id: string }>("/campaigns/create", buildCampaignBody(input));
      return {
        content: [{ type: "text", text: `Draft campaign created: ${result.id}. Review and launch it from the Batch dashboard.` }],
      };
    },
  );

  server.registerTool(
    "batch_update_campaign",
    {
      title: "Update a Batch campaign (draft only)",
      description:
        "Fully replace the content of an existing DRAFT campaign (POST /campaigns/update, state stays DRAFT). " +
        "Cannot be used on a campaign that is already running or completed.",
      inputSchema: {
        id: z.string().describe("Campaign id returned by batch_create_campaign."),
        ...campaignSchema,
      },
    },
    async ({ id, ...input }) => {
      await client.post("/campaigns/update", { id, campaign: buildCampaignBody(input) });
      return {
        content: [{ type: "text", text: `Draft campaign ${id} updated.` }],
      };
    },
  );

  server.registerTool(
    "batch_delete_campaign",
    {
      title: "Delete a Batch campaign",
      description: "Delete an existing campaign by id (POST /campaigns/delete). This cannot be undone.",
      inputSchema: {
        id: z.string(),
      },
    },
    async ({ id }) => {
      await client.post("/campaigns/delete", { id });
      return { content: [{ type: "text", text: `Campaign ${id} deleted.` }] };
    },
  );
}
