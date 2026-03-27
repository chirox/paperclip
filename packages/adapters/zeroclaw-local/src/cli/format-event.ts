import pc from "picocolors";

export function printZeroClawStreamEvent(rawLine: string, debug: boolean): void {
  try {
    const event = JSON.parse(rawLine);
    const type = typeof event.type === "string" ? event.type : "";

    if (type === "assistant" && typeof event.text === "string") {
      process.stdout.write(pc.green(event.text));
      return;
    }
    if (type === "tool_call" && typeof event.name === "string") {
      process.stdout.write(pc.yellow(`\n[Tool call: ${event.name}] `));
      return;
    }
    if (type === "tool_result") {
      process.stdout.write(pc.yellow(`\n[Tool result: ${event.content ? "Received" : "Empty"}]\n`));
      return;
    }
    if (debug) {
      process.stdout.write(pc.gray(`[debug] ${rawLine}\n`));
    }
  } catch {
    // raw
    process.stdout.write(rawLine + "\n");
  }
}
