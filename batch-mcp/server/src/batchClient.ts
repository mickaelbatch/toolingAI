const BATCH_API_VERSION = "2.11";
const BATCH_API_BASE = `https://api.batch.com/${BATCH_API_VERSION}`;

export class BatchApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string | undefined,
    public batchMessage: string,
  ) {
    // The MCP SDK surfaces thrown errors to the model via `.message` alone, so the HTTP status
    // and Batch error_code (needed to tell e.g. an auth failure from a rate limit) must be baked
    // in here rather than left as separate fields nobody reads.
    super(`Batch API error: HTTP ${status}${errorCode ? ` (error_code ${errorCode})` : ""} — ${batchMessage}`);
    this.name = "BatchApiError";
  }
}

export interface BatchClientConfig {
  restApiKey: string;
  projectKey: string;
}

export function loadConfigFromEnv(): BatchClientConfig {
  const restApiKey = process.env.BATCH_REST_API_KEY;
  const projectKey = process.env.BATCH_PROJECT_KEY;

  if (!restApiKey) {
    throw new Error("Missing BATCH_REST_API_KEY environment variable.");
  }
  if (!projectKey) {
    throw new Error("Missing BATCH_PROJECT_KEY environment variable.");
  }

  return { restApiKey, projectKey };
}

type Query = Record<string, string | number | boolean | string[] | undefined>;

function buildQueryString(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export class BatchClient {
  constructor(private config: BatchClientConfig) {}

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.restApiKey}`,
      "X-Batch-Project": this.config.projectKey,
    };
  }

  async get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async downloadText(url: string): Promise<string> {
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw new BatchApiError(res.status, undefined, `Failed to download export file: HTTP ${res.status}`);
    }
    return res.text();
  }

  private async request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
    const url = `${BATCH_API_BASE}${path}${buildQueryString(query)}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) {
      return {} as T;
    }

    const text = await res.text();
    const json = text ? JSON.parse(text) : {};

    if (!res.ok) {
      throw new BatchApiError(res.status, json?.error_code, json?.error_message ?? `HTTP ${res.status}`);
    }

    return json as T;
  }
}
