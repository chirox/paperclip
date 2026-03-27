export { execute } from "./execute.js";
export { testEnvironment } from "./test.js";
export { parseZeroClawOutput, isZeroClawUnknownSessionError } from "./parse.js";
import type { AdapterSessionCodec } from "@paperclipai/adapter-utils";

export const sessionCodec: AdapterSessionCodec = {
  deserialize(raw: unknown) {
    if (!raw || typeof raw !== "object") return null;
    return raw as Record<string, unknown>;
  },
  serialize(params: Record<string, unknown> | null) {
    if (!params || typeof params !== "object") return null;
    return params;
  },
  getDisplayId(params: Record<string, unknown> | null) {
    if (params && typeof params.threadId === "string") {
      return params.threadId;
    }
    return null;
  },
};
