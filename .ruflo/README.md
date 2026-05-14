# Ruflo (formerly claude-flow)

Multi-agent orchestrator wrapping the Claude Code CLI / subscription.

## First-time setup

```bash
# install CLI globally or use npx
npm i -g ruflo            # or: alias ruflo='npx ruflo@latest'

# init in this repo
ruflo init

# init hive-mind once per machine
ruflo hive-mind init
```

## Run the autonomous maintainer loop

```bash
tmux new -s ruflo-auto
ruflo hive-mind spawn \
  "$(cat .ruflo/prompts/autonomous-loop.md)" \
  --claude \
  --max-agents 6 \
  --memory-namespace starter-saas-auto
# Ctrl+B then D to detach
```

Reattach: `tmux attach -t ruflo-auto`.

## Monitor

```bash
watch -n 30 '
  echo "=== last cycles ===";
  tail -5 .ruflo/autonomous-log.jsonl 2>/dev/null;
  echo;
  echo "=== own open PRs ===";
  gh pr list --author @me;
'
```

## Stop

```bash
tmux kill-session -t ruflo-auto                                     # nuclear
ruflo hive-mind stop --namespace starter-saas-auto                 # graceful
```
