# Claude skills

This project follows the Mattpocock skill workflow:
<https://github.com/mattpocock/skills>

Required skills (install once per machine via Claude Code marketplace OR clone into this folder):

| Skill | When to use |
|-------|-------------|
| `grill-with-docs` | Stress-test plans against existing CONTEXT.md and ADRs. Updates docs as decisions crystallize. |
| `grill-me` | Stress-test a plan without doc updates. |
| `to-prd` | Turn current conversation context into a PRD issue. |
| `to-issues` | Break a PRD into independently-grabbable issues (tracer-bullet vertical slices). |
| `triage` | Triage incoming issues through state machine. |
| `tdd` | Red-green-refactor implementation. |
| `diagnose` | Reproduce → minimise → hypothesise → fix loop for hard bugs. |
| `improve-codebase-architecture` | Find deepening / refactoring opportunities informed by CONTEXT.md + ADRs. |
| `prototype` | Throwaway prototype to flush out a design. |

## Install

### Option A — user-global (preferred)
Install the Mattpocock skills marketplace plugin once:

```bash
claude plugin install mattpocock/skills
```

### Option B — project-local
Clone the skills repo into this folder so they ship with the starter:

```bash
git clone --depth 1 https://github.com/mattpocock/skills.git .claude/skills/_mattpocock
cp -r .claude/skills/_mattpocock/skills/* .claude/skills/
rm -rf .claude/skills/_mattpocock
```

## Workflow for new features

```
idea
  → /grill-with-docs   # stress-test design, update CONTEXT.md + relevant ADR
  → /to-prd            # publish PRD as an issue
  → /to-issues         # split PRD into vertical-slice issues
  → /tdd               # implement issue red-green-refactor
  → /review            # code review of own PR before merging
```

Bugs:

```
bug report
  → /diagnose          # reproduce → minimise → fix → regression test
```

Refactors:

```
itch
  → /improve-codebase-architecture   # find deepening opportunities, propose ADR
```
