# Add the product (discovery) layer to the agent pipeline

Goals:
- Run `om-setup-discovery-pipeline`: `discovery.enabled` in `.ai/agentic.config.json`, product-layer blocks in `SDLC.md`, `.ai/specs/research/`.
- Land the discovery outputs: product brief, research sources, and the backlog map of the filed tracker issues (#8–#29).

Spec: none (process configuration, no application code)
Status: done

---

## 2026-11-26
- Covers: `discovery` config block (no domain expert, no designer), marked blocks in `SDLC.md` (before-intake paragraph, Product owner role, Definition of Ready, protected product decisions, amending note), rewritten Discovery and Intake rows, `.ai/specs/research/.gitkeep`.
- Decisions/pitfalls: the delivery-only Discovery and Intake rows were replaced (old text is in git history); the delivery Designer bullet is untouched. `AGENTS.md` has no task-routing table, so no routing row was added and no instruction file was created. All four product skills (`om-discover`, `om-synthetic-users`, `om-backlog`, `om-mockup-prototype`) are installed.
- Remaining: commit/PR on the maintainer's go; next step is `/om-discover` (no brief yet).

## 2026-11-27
- Covers: the discovery outputs committed with the pipeline setup:
  - `.ai/specs/product-brief.md`;
  - `.ai/specs/research/` (interviews, Miro boards, benchmarks, decision records, templates);
  - `.ai/specs/backlog.md` (E01–E06 → issues #8–#29);
  - the superseded quick-pass brief in `.ai/specs/archive/`.
- Decisions/pitfalls: lands before the accounts-and-access spec PR (#30), which cites the brief and the backlog. The config sets `discovery.roles.designer: true`, while the entry above says "no designer"; left as is for the maintainer to confirm.
- Remaining: none for this task.
