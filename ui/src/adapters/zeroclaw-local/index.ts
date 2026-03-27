import type { UIAdapterModule } from "../types";
import { parseZeroClawStdoutLine, buildZeroClawLocalConfig } from "@paperclipai/adapter-zeroclaw-local/ui";
import { ZeroClawLocalConfigFields } from "./config-fields";

export const zeroClawLocalUIAdapter: UIAdapterModule = {
  type: "zeroclaw_local",
  label: "ZeroClaw CLI",
  parseStdoutLine: parseZeroClawStdoutLine,
  ConfigFields: ZeroClawLocalConfigFields,
  buildAdapterConfig: buildZeroClawLocalConfig,
};
