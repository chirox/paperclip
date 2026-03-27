import type { AdapterConfigFieldsProps } from "../types";
import { Field, DraftInput } from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function ZeroClawLocalConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  return (
    <>
      <Field label="Provider" hint="Auth provider name (e.g. openai-codex, anthropic)">
        <DraftInput
          value={isCreate ? ((values as unknown as Record<string, unknown>)?.provider as string) ?? "openai-codex" : eff("adapterConfig", "provider", String(config.provider ?? ""))}
          onCommit={(v) => isCreate ? (set as any)!({ provider: v }) : mark("adapterConfig", "provider", v || undefined)}
          immediate
          className={inputClass}
          placeholder="openai-codex"
        />
      </Field>
      <Field label="Profile" hint="Auth profile name">
        <DraftInput
          value={isCreate ? ((values as unknown as Record<string, unknown>)?.profile as string) ?? "default" : eff("adapterConfig", "profile", String(config.profile ?? ""))}
          onCommit={(v) => isCreate ? (set as any)!({ profile: v }) : mark("adapterConfig", "profile", v || undefined)}
          immediate
          className={inputClass}
          placeholder="default"
        />
      </Field>
      <Field label="Working Directory" hint="Absolute path to the workspace">
        <DraftInput
          value={isCreate ? values!.cwd ?? "" : eff("adapterConfig", "cwd", String(config.cwd ?? ""))}
          onCommit={(v) => isCreate ? set!({ cwd: v }) : mark("adapterConfig", "cwd", v || undefined)}
          immediate
          className={inputClass}
          placeholder="/path/to/project"
        />
      </Field>
    </>
  );
}

export function ZeroClawLocalAdvancedFields() {
  return null;
}
