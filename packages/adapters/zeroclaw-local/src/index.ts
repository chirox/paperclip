export const type = "zeroclaw_local";
export const label = "ZeroClaw CLI (local)";

export const models: { id: string; label: string }[] = [];

export const agentConfigurationDoc = `# zeroclaw_local configuration

Adapter: zeroclaw_local

Use when:
- The agent needs to run ZeroClaw CLI (\`zeroclaw agent\`) locally on the host machine.
- The task requires ZeroClaw workspace and skills natively.

Don't use when:
- You need a stateless API execution.
- The ZeroClaw CLI is not installed on the host machine.

Core fields:
- provider (string, required): ZeroClaw auth profile provider (e.g., openai-codex, anthropic).
- profile (string, required): ZeroClaw auth profile name (e.g., default, work).
- cwd (string, required): Absolute working directory for the agent process.
- promptTemplate (string, required): Template for the initial message to send to the agent.
- timeoutSec (number, optional): Max seconds the command can run (default 3600).
- graceSec (number, optional): Seconds to wait before SIGKILL (default 15).
`;
