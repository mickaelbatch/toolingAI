import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BatchClient } from "../batchClient.js";

interface ExportFile {
  id: string;
  part: number;
  size: number;
  url: string;
}

interface ExportRequest {
  id: string;
  status: "CREATED" | "PENDING" | "RUNNING" | "SUCCESS" | "ERROR";
  scope: string;
  request_date?: string;
  completion_date?: string;
  files?: ExportFile[];
}

export function registerExportTools(server: McpServer, client: BatchClient) {
  server.registerTool(
    "batch_get_export_status",
    {
      title: "Get Batch export request status",
      description:
        "Check the status of an export request created by batch_export_profiles (GET /exports/view). " +
        "Status goes CREATED -> PENDING -> RUNNING -> SUCCESS|ERROR. " +
        "Once SUCCESS, use batch_download_export to fetch the file contents.",
      inputSchema: {
        id: z.string().describe("Export id returned by batch_export_profiles."),
      },
    },
    async ({ id }) => {
      const result = await client.get<ExportRequest>("/exports/view", { id });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  const MAX_INLINE_BYTES = 200_000; // ~200KB — Batch export files can be up to 100MB, dumping that inline would blow the context and leak bulk PII into the conversation.
  const DEFAULT_PREVIEW_RECORDS = 5;
  const MAX_PREVIEW_RECORDS = 50;

  server.registerTool(
    "batch_download_export",
    {
      title: "Download a completed Batch export file",
      description:
        "Download a completed export file (from the 'files' array returned by batch_get_export_status once " +
        `status is SUCCESS). Files can be up to 100MB. If the file is larger than ~${Math.round(MAX_INLINE_BYTES / 1000)}KB, ` +
        "this tool does NOT return the full content — it returns the total record count and a small preview " +
        "instead, to avoid blowing the conversation's context and dumping bulk customer PII into the chat. " +
        "Small files are returned in full.",
      inputSchema: {
        url: z.string().url().describe("The file URL from an export status response (files[].url)."),
        preview_records: z
          .number()
          .int()
          .min(1)
          .max(MAX_PREVIEW_RECORDS)
          .optional()
          .describe(`How many records to preview when the file is too large to return in full (default ${DEFAULT_PREVIEW_RECORDS}, max ${MAX_PREVIEW_RECORDS}).`),
      },
    },
    async ({ url, preview_records }) => {
      const text = await client.downloadText(url);

      if (text.length <= MAX_INLINE_BYTES) {
        return { content: [{ type: "text", text }] };
      }

      let summary: unknown;
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          summary = {
            truncated: true,
            reason: `File is ${text.length} bytes, above the ${MAX_INLINE_BYTES}-byte inline limit.`,
            total_records: data.length,
            preview: data.slice(0, preview_records ?? DEFAULT_PREVIEW_RECORDS),
          };
        } else {
          summary = {
            truncated: true,
            reason: `File is ${text.length} bytes, above the ${MAX_INLINE_BYTES}-byte inline limit, and isn't a JSON array — cannot preview by record.`,
            raw_excerpt: text.slice(0, MAX_INLINE_BYTES),
          };
        }
      } catch {
        summary = {
          truncated: true,
          reason: `File is ${text.length} bytes and isn't valid JSON — showing a raw text excerpt.`,
          raw_excerpt: text.slice(0, MAX_INLINE_BYTES),
        };
      }

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    },
  );

  server.registerTool(
    "batch_list_exports",
    {
      title: "List Batch export requests",
      description: "List export requests created in the last 4 months (GET /exports/list).",
      inputSchema: {
        from: z.string().optional().describe("Pagination cursor from a previous call's next_from."),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ from, limit }) => {
      const result = await client.get("/exports/list", { from, limit });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
