# Repo Knowledge Studio

A local application for turning a repository into a practical handbook, an ordered learning guide, custom SVG diagrams, and HyperFrames video explainers. Pi is installed **inside this project** and can use the model provider you configure.

## Run locally

Requires Node.js 22+ and Git. HyperFrames rendering also needs a compatible Chrome browser and FFmpeg; its CLI can prepare its browser on first render.

```sh
npm install
npm run setup
npm run pi
# In Pi: /login, then /model. Exit Pi when configured.
npm start
```

Open http://127.0.0.1:4173. Import a public GitHub repository URL or a trusted local folder. Choose **Pi exploration** for actual generated explanations, or **source inventory** to inspect file coverage without model access.

Pi configuration lives in `.state/pi/`. This folder and generated `data/` are ignored by Git. `npm run pi` always uses the local installation and this private project configuration, without modifying your global Pi settings. If you deliberately want to reuse existing provider access, run `npm run setup -- --import-existing-auth`; this copies the credential file into the ignored private project configuration without printing its contents.

## What it does

- **Handbook:** setup, architecture, technology stack, integrations, repository map, and development/testing guidance.
- **Learn:** concepts and relationships become ordered chapters with examples, analogies, and comprehension questions.
- **Evidence:** generated material cites immutable excerpts tied to a source revision; open the source drawer to inspect them.
- **Diagrams:** original SVG architecture and teaching-flow visuals, with no Mermaid dependency.
- **Watch:** caption-led, explicitly silent playable previews and HyperFrames compositions. The render button creates a local MP4. Narration is not automatically synthesized in this version.
- **Freshness:** compare current eligible source hashes and revision; show affected handbook pages and chapters.
- **Export:** download a standalone HTML guide with diagrams, quizzes, and source excerpts. The portable JSON record remains in the project data directory.
- **Refresh:** generate a new artifact edition and update the active knowledge record only after generation succeeds.

## Command line

```sh
npm run analyze -- https://github.com/hassanhabib/OtripleS
npm run analyze -- /path/to/repository --inventory
npm run analyze -- /path/to/repository --model provider/model-id
npm run studio -- list
npm run studio -- status PROJECT_ID
npm run studio -- precheck PROJECT_ID
npm test
```

`PORT` changes the local port. `RKS_DATA_DIR` changes generated-data storage. Advanced integrations can override `PI_BINARY`, `PI_CODING_AGENT_DIR`, or `HYPERFRAMES_CLI`. A model must be explicitly configured in Pi or passed by the application; provider failures are reported rather than silently converted into invented output.

## Architecture

The scanner produces a bounded inventory and evidence set. A Pi worker reads a curated evidence workspace with source-local instructions and global extensions disabled. A strict JSON contract connects the worker to the application. The app validates reference IDs, then generates its own diagrams, guide HTML, and video compositions. HTTP jobs persist progress to disk and are marked interrupted after a server restart; they do not claim automatic durable replay of model calls.

Each successful refresh gets a separate artifact edition. Failed analysis leaves the last successful knowledge record available. No upstream source code is executed or modified during analysis.

## Honest limits

- Source coverage is bounded and disclosed. Evidence references establish provenance; they do not prove semantic correctness.
- Exclusion rules reduce accidental secret exposure but are not a complete secret scanner or an OS sandbox. Analyze trusted repositories and review evidence before sending it to a hosted provider.
- Pi read-only tools and curated inputs reduce scope; they are not a filesystem sandbox. Use OS isolation for hostile repositories.
- Tests shown in generated documentation are not claimed as executed unless separately verified. The analyzed repository may require old SDKs, services, or credentials.
- Setup/API/model behavior varies by provider. A valid paid subscription does not guarantee every model ID is available.
- Current explainers are caption-led and silent. Automatic speech generation and full end-to-end narrated lessons are future media enhancements, not hidden capabilities.
- Standalone guide export includes text, diagrams, and excerpts; MP4 files remain separate assets in the local app.
- This is a localhost application, not a hardened public multi-user hosting service.

## Sources and adapted workflows

Product capabilities are inspired by [Buddy](https://github.com/pallavrustogi/Buddy) and [PocketFlow Codebase Knowledge](https://github.com/The-Pocket/PocketFlow-Tutorial-Codebase-Knowledge). The teaching instructions adapt the [video-study-guide skill](https://github.com/theAfricanQuant/video-study-guide-skill). Diagrams follow the diagram-design skill’s custom SVG approach. Video output uses HyperFrames; model execution uses Pi. PocketFlow itself is not a runtime dependency: ordinary application code owns the stages.

See `docs/SPECIFICATION.md` for acceptance criteria and `docs/DESIGN.md` for the visual direction.

## Long-form study guide

The original `video-study-guide` skill by theAfricanQuant is included under `skills/video-study-guide/` with its MIT license. Its repository-specific adaptation is `skills/codebase-study-guide/SKILL.md`. The adaptation requests substantial code walkthroughs, clear analogies, common misconceptions, exercises, a glossary, and a paced practical plan. Source-reading examples are distinguished from executed output. The Learn section supports individual chapters and a continuous reading view; completion is recorded only when a reader marks it.

## Media in context

Handbook pages and learning chapters can place diagrams, comparison tables, and explainers within their relevant sections using `learningBlocks`. The same placements work in chapter and full-course reading modes. When explicit placements are absent, diagrams and videos are matched conservatively by shared source evidence; glossary and plan pages are excluded from automatic matching. The media libraries remain available. Existing captioned videos are silent, with playback controls and source references beside the lesson.

## Explore a Rust port

Each collection has an **Explore a Rust port** action with a source-based migration assessment: existing components, proposed Rust representations, compatibility risks, a small first experiment, and verification checkpoints. It works without provider credentials and does not translate or execute the repository. REA can supply optional binary evidence during a later investigation; the app does not claim that REA has run. See `docs/RUST_PORTS.md`.
