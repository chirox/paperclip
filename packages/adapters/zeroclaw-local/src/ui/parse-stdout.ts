import type { TranscriptEntry } from "@paperclipai/adapter-utils";

export function parseZeroClawStdoutLine(line: string, ts: string): TranscriptEntry[] {
  try {
    const event = JSON.parse(line);
    const type = typeof event.type === "string" ? event.type : "";
    
    if (type === "system" && event.subtype === "init") {
      return [{
        kind: "init",
        ts,
        model: typeof event.model === "string" ? event.model : "unknown",
        sessionId: typeof event.session_id === "string" ? event.session_id : undefined,
      }];
    }
    
    if (type === "assistant" && typeof event.text === "string") {
      return [{ kind: "assistant", ts, text: event.text }];
    }
    
    if (type === "result" && typeof event.result === "string") {
      return [{
        kind: "result",
        ts,
        text: event.result,
        inputTokens: Number(event.usage?.input_tokens || 0),
        outputTokens: Number(event.usage?.output_tokens || 0),
        cachedTokens: Number(event.usage?.cache_read_input_tokens || 0),
        costUsd: typeof event.total_cost_usd === "number" ? event.total_cost_usd : 0,
        subtype: "",
        isError: false,
        errors: [],
      }];
    }
    
    if (type === "tool_call" && typeof event.name === "string") {
      return [{ kind: "tool_call", ts, name: event.name, input: event.input || {} }];
    }
    
    if (type === "tool_result" && typeof event.content === "string") {
      return [{ kind: "tool_result", ts, toolUseId: event.tool_use_id || "unknown", content: event.content, isError: Boolean(event.is_error) }];
    }
    
  } catch (e) {
    // not JSON, fallback
  }

  return [{ kind: "stdout", ts, text: line }];
}
