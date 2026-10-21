# Repo Knowledge Studio

A local knowledge application that combines a practical repository handbook, an ordered codebase tutorial, a rich learning hub, custom SVG diagrams, and HyperFrames explainers. Pi is installed as a pinned project dependency and supplies model interaction. No orchestration framework is required in version one.

## Acceptance criteria

- Import a local repository or public GitHub URL, with a visible persisted analysis job and actionable errors.
- Save a bounded file inventory, source revision, immutable evidence excerpts, and explicit coverage limitations.
- Generate six handbook categories, ordered teaching chapters with quizzes, concepts, relationships, and three evidence-linked video plans through real Pi analysis.
- Open cited source lines in a reader, search generated material, and check freshness against current source files.
- Show designed SVG architecture and flow diagrams, never Mermaid.
- Prepare playable caption-led video previews and actual HyperFrames compositions; render MP4 locally on request. Narration is a separately configurable media capability, and silent video must be labeled.
- Export a standalone HTML guide with diagrams and source excerpts. Keep the complete JSON knowledge record portable.
- Support refresh without deleting the previous successful knowledge record on a model failure.
- Keep provider credentials and generated repository data out of Git. Bind the application to localhost.
- Test on hassanhabib/OtripleS with real generated content. Do not modify or push to the upstream repository.

## Boundaries

The source scanner excludes symlinks, common secret filenames, large/binary files, and dependency/build folders. This is risk reduction, not a general secret scanner or an OS sandbox. Pi sees a curated evidence workspace and read-only tools. User-installed global extensions and repository instruction files are not loaded for analysis. Model-generated text is displayed as escaped text; generated SVG is produced by application code, not injected from the model.

Application jobs persist their stages. A server restart marks unfinished jobs interrupted; it does not claim durable model-call replay. Users can retry. Evidence validity checks ensure referenced IDs exist; semantic correctness requires source review.

## First test repository

OtripleS: an open-source schooling system with a C# ASP.NET API, service and broker layers, tests, and infrastructure projects. Interpret actual source; do not assume it can be run with a modern SDK without checking its pinned dependencies.
