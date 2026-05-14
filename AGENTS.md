# Agents guide

This repo is designed to be operated by AI agents in addition to humans.

Before doing anything non-trivial:

1. Read `CLAUDE.md`, `CONTEXT.md`, and the relevant `docs/adr/*.md`.
2. Use `/grill-with-docs` for design questions touching multiple modules.
3. Use `/to-prd` and `/to-issues` to capture work; do not push code without an issue.
4. Use `/tdd` for new features and bug fixes.
5. Use `/diagnose` for reported bugs.
6. Use `/improve-codebase-architecture` only with maintainer approval; propose an ADR before changing structure.

## Hard limits

- No edits to `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/*`, `credentials*`.
- No major dependency version bumps without an ADR.
- No `--no-verify` / `--no-gpg-sign`.
- No force-push, no push to `main`.
- No `rm -rf` outside scratch directories.

## Available skills

See `.claude/skills/README.md`.

## Autonomous mode

See `.ruflo/README.md` for the long-running maintainer loop.
