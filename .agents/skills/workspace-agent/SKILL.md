---
name: workspace-agent
description: Start, restart and debug project services inside a sandbox workspace using workspace-agent-cli. Use for sandbox startup failures, service logs, preview problems and runtime diagnostics.
---

# Workspace agent

Run commands inside the sandbox terminal. `workspace-agent` is the platform
server; `workspace-agent-cli` controls the project. The server also owns editor
terminal sessions and the legacy preview boot proxy. Do not launch another
server to start an application.

## Inspect before changing anything

Work in `${PROJECT_DIR:-/workspace}`. Read `om-sandbox.toml`, or
`openmercato.toml` only when the former is absent. `PROJECT_MANIFEST_PATH`, when
set, overrides discovery. A malformed preferred manifest does not fall back.

```bash
cd "${PROJECT_DIR:-/workspace}"
workspace-agent-cli service list --json
```

The result has a `streams` array with `name`, `stream`, `kind` and `restartable`.
It is an inventory, not a health check. Use actual returned names; do not assume
every project has a `preview` service. Platform streams such as `workspace`,
`workspace-agent`, `code-server`, `postgres` and `redis` are not restartable
project services. Use diagnostics below for process status.

## Start or restart

Sandbox startup normally runs `workspace-agent-cli start` automatically.
After changing the manifest, or when recovering failed project initialization:

```bash
workspace-agent-cli start
```

This removes the currently managed application processes, validates the manifest,
runs project preparation and registers the declared services with PM2. It can
interrupt the app even if manifest validation then fails. Inspect the manifest
first; do not use `start` as a read-only status command. Successful exit means
services were registered, not that every service is ready.

For an existing service returned with `restartable: true`:

```bash
service=web # Replace with a name from service list.
workspace-agent-cli service restart "$service"
```

Restart uses the last started service definition and re-arms its preparation.
It does not reload manifest changes. Automatic supervisor restarts skip
preparation that has already succeeded. Prefer this command over restarting
all PM2 processes, which would also interrupt platform tools and terminals.
`exec --service <name>` is the supervisor's runner, not an arbitrary shell or
an extra way to start a second copy of the app.

## Read logs and diagnose

Follow a service's returned `stream`; use `project` for manifest validation and
project-wide preparation failures:

```bash
workspace-agent-cli logs follow --stream project
```

This follows continuously until interrupted (Ctrl+C); use `timeout 10s` for a
bounded capture in automated work (timeout normally exits 124). Output is JSON
Lines with `ready`, `data` and `error` frames. A `data` frame's `bytes` field is
base64, not plain text. To render it:

```bash
timeout 10s workspace-agent-cli logs follow --stream "$service" | python3 -u -c '
import base64, json, sys
for line in sys.stdin:
    frame = json.loads(line)
    if frame["type"] == "data":
        sys.stdout.buffer.write(base64.b64decode(frame["bytes"]))
        sys.stdout.buffer.flush()
    elif frame["type"] == "error":
        print(frame, file=sys.stderr)
'
```

For a finite snapshot of disk, memory/load, top processes, PM2 status and bounded
system log tails:

```bash
workspace-agent-cli diagnostics collect --max-bytes-per-stream 16384
```

Diagnostics emits JSON Lines and may contain per-section errors even when the
command succeeds. It includes system logs, not every application service log;
follow the affected service separately. Logs can contain application secrets;
redact before sharing, and do not dump environment variables or credential files.

When the app is unavailable, check `project` logs first, then the affected
service's logs and PM2 status. Check its configured port and bind address;
version 3 services must choose their own port and listen on `0.0.0.0` for preview
access. Fix the failed command or configuration, restart only the affected
service (or run `start` for manifest changes), then verify the app responds.

## Manifest compatibility

Version 3 uses `[[services]]` with a unique `name`, `start_command` argv array
and optional `prepare_command` argv array. Commands are not implicit shell
scripts; use an explicit shell only when shell features are needed. Preserve
the project's existing commands, ports and environment requirements.

Legacy version 2 uses `[preview]` and optional `[[processes]]`, normalized into
services. Only its preview receives boot-proxy `PORT` injection. The legacy
`workspace-agent-cli control v1 restart preview` command remains available;
prefer `service restart` when using the service inventory. Do not migrate a
working manifest merely to debug it.
