import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

export function registerProfileTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_export_profiles",
    {
      title: "Request a Batch profile export",
      description:
        "Create an async export request to read profile data (POST /profiles/export). " +
        "This is the only way to read profile data via the API — it is bulk and asynchronous, " +
        "NOT a single-profile lookup. It cannot be filtered by a specific custom_id, only by segment. " +
        "Returns an export id; poll it with batch_get_export_status, then download the file(s) once status is SUCCESS. " +
        "Rate limit: 5 requests/hour when a segment filter is used.",
      inputSchema: {
        export_type: z.enum(["ATTRIBUTES", "EVENTS", "REACHABILITY"]),
        attributes: z
          .array(z.string())
          .optional()
          .describe("For ATTRIBUTES exports: native (e.g. $email_address) or custom attribute names to include."),
        identifiers: z
          .array(z.enum(["custom_id", "installation_ids", "installation_id"]))
          .optional()
          .describe("Which profile identifiers to include in the export file."),
        segment: z.string().optional().describe("Segment code to restrict the export to (rate-limited to 5/hour)."),
        from: z.string().optional().describe("RFC 3339 datetime. Required for EVENTS and REACHABILITY exports."),
        to: z.string().optional().describe("RFC 3339 datetime or 'now'. Required for EVENTS and REACHABILITY exports."),
        events: z
          .array(z.string())
          .optional()
          .describe("Event types to include, required for EVENTS exports (e.g. email_sent, push_open)."),
        channels: z
          .array(z.enum(["email", "push", "sms"]))
          .optional()
          .describe("Channels to include, required for REACHABILITY exports."),
      },
    },
    async ({ export_type, attributes, identifiers, segment, from, to, events, channels }) => {
      const body: Record<string, unknown> = { export_type };
      if (attributes) body.attributes = attributes;
      if (identifiers) body.identifiers = identifiers;
      if (segment) body.filter = { segment };
      if (from) body.from = from;
      if (to) body.to = to;
      if (events) body.events = events;
      if (channels) body.channels = channels;

      const result = await client.post<{ id: string }>("/profiles/export", body);
      return {
        content: [
          {
            type: "text",
            text: `Export request created: ${result.id}. Poll it with batch_get_export_status.`,
          },
        ],
      };
    },
  );
}
