import type { UsageSummary } from "@paperclipai/adapter-utils";
import { asString, asNumber, parseObject, parseJson } from "@paperclipai/adapter-utils/server-utils";

export function parseZeroClawOutput(stdout: string) {
  let sessionId: string | null = null;
  let model = "";
  let summary = "";
  let resultJson: Record<string, unknown> | null = null;
  const assistantTexts: string[] = [];
  let tokenUsage: UsageSummary | null = null;
  let costUsd: number | null = null;

  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    
    // Try parsing as JSON first
    const event = parseJson(line);
    if (event) {
      if (typeof event.session_id === "string") sessionId = event.session_id;
      if (typeof event.thread_id === "string") sessionId = event.thread_id;
      if (typeof event.text === "string") assistantTexts.push(event.text);
      if (typeof event.total_cost_usd === "number") costUsd = event.total_cost_usd;
      if (typeof event.usage === "object" && event.usage) {
        const u = parseObject(event.usage);
        tokenUsage = {
          inputTokens: asNumber(u.input_tokens, 0) || asNumber(u.prompt_tokens, 0),
          outputTokens: asNumber(u.output_tokens, 0) || asNumber(u.completion_tokens, 0),
          cachedInputTokens: asNumber(u.cache_read_input_tokens, 0)
        };
      }
      resultJson = event;
    } else {
      // Fallback to raw text
      assistantTexts.push(line);
    }
  }

  summary = assistantTexts.join("\n").trim();

  return {
    sessionId,
    model,
    costUsd,
    usage: tokenUsage,
    summary,
    resultJson,
  };
}

export function isZeroClawUnknownSessionError(parsed: Record<string, unknown> | null): boolean {
  if (!parsed) return false;
  const errorMsg = asString(parsed.error, "") || asString(parsed.message, "");
  return /unknown session|thread not found|session not found/i.test(errorMsg);
}
