# Recommended agent roles for the autonomous loop

When spawning `ruflo hive-mind spawn`, request these 6 specialised workers:

| Role | Skill focus |
|------|-------------|
| `architect` | `/improve-codebase-architecture`, `/grill-with-docs`, ADR drafting |
| `coder` | `/tdd`, feature implementation, refactor execution |
| `reviewer` | `/review`, `/security-review`, code quality, ADR adherence |
| `tester` | Test gaps, e2e, regression test creation |
| `triager` | `/triage`, issue labelling, acceptance-criteria gathering |
| `researcher` | Web search, library docs, dep upgrades, releasing notes |

Optional 7th if you allow it:

| `docs-writer` | Updates `CONTEXT.md`, ADRs, README, `docs/` when behaviour changes |

## Boundaries per role

- `coder` may write code, never DELETE files, never bump deps, never touch `packages/db/drizzle/` migrations without `reviewer` approval.
- `reviewer` may comment on PRs but only `architect` may merge changes affecting `CONTEXT.md` or `docs/adr/`.
- `tester` may add tests but never modify production source.
- `researcher` is read-only (no writes to repo, only Slack/PR comments).
