import type { CreateConfigValues } from "@paperclipai/adapter-utils";

export function buildZeroClawLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  if (v.cwd) ac.cwd = v.cwd;
  if (v.promptTemplate) ac.promptTemplate = v.promptTemplate;
  if (v.command) ac.command = v.command;
  const rv = v as unknown as Record<string, unknown>;
  if (rv.provider) ac.provider = rv.provider;
  if (rv.profile) ac.profile = rv.profile;

  ac.timeoutSec = Number(rv.timeoutSec) || 3600;
  ac.graceSec = Number(rv.graceSec) || 15;
  
  return ac;
}
