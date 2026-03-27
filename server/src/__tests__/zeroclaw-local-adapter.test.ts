import { describe, it, expect } from "vitest";
import { parseZeroClawOutput, isZeroClawUnknownSessionError } from "@paperclipai/adapter-zeroclaw-local/server";

describe("zeroclaw-local parser", () => {
  it("parses valid json output", () => {
    const raw = [
      JSON.stringify({ type: "system", subtype: "init", session_id: "test-session-123", model: "claude-3-5" }),
      JSON.stringify({ type: "assistant", text: "Hello from zeroclaw" }),
      JSON.stringify({ type: "result", result: "Done", usage: { input_tokens: 10, output_tokens: 20 }, total_cost_usd: 0.05 }),
    ].join("\n");

    const parsed = parseZeroClawOutput(raw);
    
    expect(parsed.sessionId).toBe("test-session-123");
    expect(parsed.summary).toContain("Hello from zeroclaw");
    expect(parsed.usage?.inputTokens).toBe(10);
    expect(parsed.usage?.outputTokens).toBe(20);
    expect(parsed.costUsd).toBe(0.05);
  });

  it("detects unknown session errors", () => {
    const parsed = {
      type: "result",
      error: "unknown session: test-session-123"
    };
    expect(isZeroClawUnknownSessionError(parsed)).toBe(true);
  });
});
