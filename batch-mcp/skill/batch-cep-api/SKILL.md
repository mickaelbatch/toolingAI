---
name: batch-cep-api
description: >
  Use the Batch Customer Engagement Platform (CEP) API — read customer profile data
  (via async export), browse audiences/catalogs/segments, inspect orchestrations, and
  create/update/list/delete push & email campaign drafts — through the local
  `batch-cep` MCP server. Load this skill before calling any `batch_*` tool: it
  documents authentication requirements, rate limits, and an important gap (no
  single-profile lookup) that changes how you should approach "look up this
  customer" requests. This server is read-only everywhere except campaigns, where
  only draft management is allowed — it cannot write profile data or send anything.
license: MIT
metadata:
  author: batch
  version: "0.1.0"
  homepage: https://doc.batch.com/developer/api/cep
  openclaw:
    requires:
      mcp: batch-cep
      env:
        - BATCH_REST_API_KEY
        - BATCH_PROJECT_KEY
---

# Batch CEP API

This skill governs how to use the `batch_*` tools exposed by the local `batch-cep` MCP server. It does not call the Batch API directly — the MCP server does — this file exists so you don't misuse the tools or overpromise what they can do.

## Prerequisites (per client)

Each user of this skill must run their own instance of the `batch-cep` MCP server, configured with **their own** Batch credentials:

- `BATCH_REST_API_KEY` — from their Batch dashboard, Settings → General. Full-access, company-wide key (Batch doesn't support scoped keys).
- `BATCH_PROJECT_KEY` — from the same page, per project.

If the `batch_*` tools aren't available, tell the user to set up the MCP server (see the accompanying `server/README.md`) before continuing — do not attempt to call the Batch REST API directly via curl/fetch as a substitute; that would require handling auth and error codes this skill doesn't cover, and risks leaking the key into logs.

## Critical gap: there is no "get one profile" tool

Batch's API has no synchronous single-profile read endpoint. If the user asks something like *"what's John's email on file"* or *"show me this customer's profile"*, do **not** improvise by calling `batch_export_profiles` and expecting a quick answer — exports are asynchronous, bulk, filterable only by segment (not by a single custom_id), and rate-limited to 5/hour when filtered.

In that situation:
1. Tell the user directly that a single real-time profile lookup isn't supported by the Batch API.
2. Offer the real alternative: a segment-based export (`batch_export_profiles` → poll `batch_get_export_status` → `batch_download_export`), useful for bulk reporting, not for "look up this one person."
3. Suggest checking the Batch dashboard UI directly for one-off lookups — it has a profile search the API doesn't expose.

## No profile writes

This server has no tool to write profile data (no `batch_update_profile`). If a user asks to change a customer's email, subscription status, or any other profile field, tell them this isn't available through this assistant — they need to use the Batch dashboard or their own backend integration for that. Don't try to work around it via `batch_export_profiles` or any other tool.

## Campaigns: draft-only, by design

`batch_create_campaign` and `batch_update_campaign` only accept `state: "DRAFT"` — the server's tool schema doesn't even allow `RUNNING` as a value, so there's no way for this skill to actually send a push notification or email to real users. Creating or updating a campaign here only prepares it; **a human must open it on the Batch dashboard and launch it there.**

Because of this, you don't need to seek confirmation before creating a draft — it has no user-facing effect. Still:
- `batch_delete_campaign` is irreversible. Confirm before calling it on anything that isn't a draft you just created in the same session.
- Tell the user clearly, after creating or updating a campaign, that it's saved as a draft and needs manual review + launch on the dashboard — don't let them assume it was sent.

Use `batch_list_orchestrations` to find a campaign's `id` (campaigns are one type of "orchestration") and `batch_get_orchestration_stats` for performance data — these are read-only and safe to call freely.

## Rate limits worth knowing before batching work

- `/profiles/export` with a segment filter: 5/hour — don't loop-retry this; if it 429s, tell the user to wait rather than hammering it.
- Default CEP rate limit elsewhere: 1 req/s per project — space out list/stats calls in a loop instead of firing them concurrently.

## Full reference

For endpoint-level detail (payload shapes, response schemas, all rate limits) beyond what's needed to use these tools correctly, see `../../README.md` in this repository.
