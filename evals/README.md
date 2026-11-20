# Atlas Cold-Run Skill Evals (`evals/`)

Isolated regression briefs and deterministic validators for the `@saxster/atlas` skill, 2D orthographic drafting kit (`engine/draft_kit.js`), mechanical motion helpers (`engine/motion.js`), and verification rubric (`docs/verification-rubric.md`).

## Layout

- `evals/briefs/01..08.txt`: Self-contained user prompts (copied into a clean `mktemp -d` directory by `evals/run.sh`).
- `evals/attachments/`: Faulty fixtures intentionally containing planted violations (`faulty-diagram.svg`, `faulty-figure/`). Note `cli/check.mjs` skips `evals/` during whole-repo scans while validating `faulty-figure/` when targeted directly.
- `evals/validate.mjs`: Deterministic offline validator verifying brief completeness, planted-fault detection, clean draft construction/compact export/PNG rasterization (`light` & `dark`), and Model-First purity gate rejection on `faulty-figure/`.
- `evals/run.sh`: Stages a selected brief and its attachment into an isolated temp workspace for manual or agent `--cmd` runs.

## Commands

```bash
# Deterministic offline suite
node evals/validate.mjs

# Stage brief 04 into a clean isolated directory (or pass --cmd "<agent command>")
./evals/run.sh --brief 04
```
