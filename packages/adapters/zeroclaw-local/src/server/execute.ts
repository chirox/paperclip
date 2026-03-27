import path from "node:path";
import fs from "node:fs/promises";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import {
  asString,
  asNumber,
  asStringArray,
  parseObject,
  buildPaperclipEnv,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  renderTemplate,
  runChildProcess,
  redactEnvForLogs
} from "@paperclipai/adapter-utils/server-utils";
import { parseZeroClawOutput, isZeroClawUnknownSessionError } from "./parse.js";

interface ZeroClawRuntimeConfig {
  command: string;
  cwd: string;
  env: Record<string, string>;
  timeoutSec: number;
  graceSec: number;
  provider: string;
  profile: string;
  extraArgs: string[];
}

async function buildZeroClawRuntimeConfig(input: {
  runId: string;
  agent: AdapterExecutionContext["agent"];
  config: Record<string, unknown>;
  context: Record<string, unknown>;
}): Promise<ZeroClawRuntimeConfig> {
  const { runId, agent, config, context } = input;

  const command = asString(config.command, "zeroclaw");
  const configuredCwd = asString(config.cwd, "");
  const cwd = configuredCwd || process.cwd();
  await ensureAbsoluteDirectory(cwd, { createIfMissing: true });

  const envConfig = parseObject(config.env);
  const env: Record<string, string> = { ...buildPaperclipEnv(agent) };
  env.PAPERCLIP_RUN_ID = runId;

  // Add basic context
  if (typeof context.taskId === "string") env.PAPERCLIP_TASK_ID = context.taskId;

  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }

  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });
  await ensureCommandResolvable(command, cwd, runtimeEnv);

  return {
    command,
    cwd,
    env,
    timeoutSec: asNumber(config.timeoutSec, 3600),
    graceSec: asNumber(config.graceSec, 15),
    provider: asString(config.provider, "openai-codex"),
    profile: asString(config.profile, "default"),
    extraArgs: asStringArray(config.extraArgs),
  };
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { runId, agent, runtime, config, context, onLog, onMeta } = ctx;

  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work."
  );

  const runtimeConfig = await buildZeroClawRuntimeConfig({
    runId,
    agent,
    config,
    context,
  });

  const { command, cwd, env, timeoutSec, graceSec, provider, profile, extraArgs } = runtimeConfig;

  const runtimeSessionParams = parseObject(runtime.sessionParams);
  const sessionId = asString(runtimeSessionParams.sessionId, "");

  const prompt = renderTemplate(promptTemplate, {
    agentId: agent.id,
    companyId: agent.companyId,
    runId,
    company: { id: agent.companyId },
    agent,
    run: { id: runId, source: "on_demand" },
    context,
  });

  const buildArgs = (resumeSessionId: string | null) => {
    const args = ["agent", "--provider", provider, "--profile", profile];
    if (resumeSessionId) {
      args.push("--session", resumeSessionId);
    }
    // We pass prompt via -m
    args.push("-m", prompt);
    if (extraArgs.length > 0) args.push(...extraArgs);
    return args;
  };

  const runAttempt = async (resumeSessionId: string | null) => {
    const args = buildArgs(resumeSessionId);
    if (onMeta) {
      await onMeta({
        adapterType: "zeroclaw_local",
        command,
        cwd,
        commandArgs: args,
        env: redactEnvForLogs(env),
        prompt,
        context,
      });
    }

    const proc = await runChildProcess(runId, command, args, {
      cwd,
      env,
      timeoutSec,
      graceSec,
      onLog,
    });

    const parsed = parseZeroClawOutput(proc.stdout);
    return { proc, parsed };
  };

  let attempt = await runAttempt(sessionId || null);

  if (
    sessionId &&
    !attempt.proc.timedOut &&
    (attempt.proc.exitCode ?? 0) !== 0 &&
    isZeroClawUnknownSessionError(attempt.parsed.resultJson)
  ) {
    await onLog("stderr", "[paperclip] ZeroClaw resume session failed; retrying fresh.\n");
    attempt = await runAttempt(null);
  }

  const { proc, parsed } = attempt;

  if (proc.timedOut) {
    return {
      exitCode: proc.exitCode,
      signal: proc.signal,
      timedOut: true,
      errorMessage: `Timed out after ${timeoutSec}s`,
      errorCode: "timeout",
      clearSession: true,
    };
  }

  return {
    exitCode: proc.exitCode,
    signal: proc.signal,
    timedOut: false,
    errorMessage: (proc.exitCode ?? 0) === 0 ? null : `ZeroClaw exited with code ${proc.exitCode ?? -1}`,
    usage: parsed.usage || undefined,
    sessionId: parsed.sessionId || sessionId,
    sessionParams: parsed.sessionId ? { sessionId: parsed.sessionId } : null,
    sessionDisplayId: parsed.sessionId,
    provider: provider,
    model: parsed.model || null,
    costUsd: parsed.costUsd,
    resultJson: parsed.resultJson,
    summary: parsed.summary,
    clearSession: false,
  };
}
