# Repo Guidelines

This repository is **TITS** (_Test Intelligence & Tutoring System_), maintained by **gtxPrime**.
It provides an Electron-based real‑time assistant which captures screen and audio
for contextual AI responses. The code is JavaScript and uses Electron Forge for
packaging.

## Getting started

Install dependencies and run the development app:

```
1. npm install
2. npm start
```

## Style

Run `npx prettier --write .` before committing. Prettier uses the settings in
`.prettierrc` (four-space indentation, print width 150, semicolons and single
quotes). `src/assets` and `node_modules` are ignored via `.prettierignore`.
The project does not provide linting; `npm run lint` simply prints
"No linting configured".

## Code standards

Keep the following rules in mind as new files are created:

- **TypeScript strict mode** – avoid `any` and prefer explicit interfaces.
- **Secure IPC** – validate and sanitize all parameters crossing the renderer/main boundary.
- **Non‑blocking audio** – heavy processing must stay off the UI thread.
- **Tests** – run `npm test` to verify test coverage.

## Audio processing principles

- **16 kHz compatibility** – resample all audio before processing.
- **Dual‑stream architecture** – capture microphone and system audio on separate channels.
- **Voice activity detection** – pre‑filter silent segments to improve speed.
- **Quality preservation** – keep sample fidelity and avoid blocking the UI during heavy processing.
- **Memory efficiency** – stream audio buffers instead of loading them all at once.
- **Error recovery** – handle audio device failures gracefully.

## Privacy by design

- **Local processing** – transcriptions and captures happen locally with direct model communication.
- **User control** – provide clear options for data retention and deletion.
- **Transparency** – document what is stored and where.
- **Minimal data** – only persist what is required for functionality.
