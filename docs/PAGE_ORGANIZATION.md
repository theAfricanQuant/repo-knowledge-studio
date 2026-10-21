# Page organization: reference and guided learning

Inspected the original repositories on 21 October 2026.

## What informed the design

Buddy's generated handbook is distinct from its product landing website. Its `README_FOR_HUMANS.md` is a home page with a short project explanation, big-picture ideas, and task-oriented links: run the project, find code, understand architecture, identify dependencies, and review unanswered questions. Its files form a reference library with MAP and NOTES subfolders. Getting Started separates prerequisites, installation, running, tests, and common problems.

PocketFlow Codebase Knowledge's actual generated tutorial has a project index and concept relationship diagram, ordered chapter files, cross-references, motivation and analogy, concrete code examples, internal explanations, and a conclusion leading into the next chapter. The Markdown frontmatter establishes parent/child hierarchy and chapter ordering. These are teaching pages, rather than a list of reference topics.

Sources:
- https://github.com/pallavrustogi/Buddy/blob/main/templates/.buddy/README_FOR_HUMANS.md
- https://github.com/pallavrustogi/Buddy/blob/main/templates/.buddy/GETTING_STARTED.md
- https://github.com/pallavrustogi/Buddy/blob/main/templates/.buddy/ARCHITECTURE.md
- https://github.com/The-Pocket/PocketFlow-Tutorial-Codebase-Knowledge/tree/main/docs/PocketFlow

## Application changes

Keep two ways through the same evidence-linked collection: a handbook for finding an answer, and a course for learning in order. Use an actionable home page, grouped handbook navigation, chapter sequencing, and stable page URLs. Navigation is generated only from pages actually present in the collection; future-generation instructions request the more complete handbook structure without fabricating missing pages in existing editions.

Exported HTML has a handbook contents list, an ordered chapter contents list, previous/next navigation, a return-to-contents link on each page, custom SVG diagrams, and source evidence. Curated examples retain their provenance label.

New analysis instructions request ten handbook pages (getting started, architecture, technology stack, integrations, repository map, entry points, data flow, development/testing, open questions, assumptions). Chapters request motivation, analogy, cited example, internals, and recap, with glossary and practical plan at the end. This does not imply that an existing collection has been regenerated or that provider authentication has been repaired.
