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

  server.registerTool(
    "batch_download_export",
    {
      title: "Download a completed Batch export file",
      description:
        "Download and return the JSON content of a completed export file (from the 'files' array returned " +
        "by batch_get_export_status once status is SUCCESS). Files can be up to 100MB — large exports may not " +
        "fit in context, prefer summarizing counts instead of dumping full content for big files.",
      inputSchema: {
        url: z.string().url().describe("The file URL from an export status response (files[].url)."),
      },
    },
    async ({ url }) => {
      const data = await client.downloadJson<unknown>(url);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
