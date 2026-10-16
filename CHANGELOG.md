# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-10-16

Answers the DSH STORE author-fix request `AI-Scarlett/DSH-Store#910`
(`DSH_LATEST_THREE_COMPATIBILITY_HOLD`): the catalog had no exact compatible
record for any release in its rolling window, so the plugin was unlisted.

### Added

- `dsh.compatibility` in the manifest: a DSH range, a Node range, and an exact
  per-release `dshReleases` matrix. A range alone is not installable evidence
  for the store; exact records are.
- `docs/compatibility.md`: the five checks behind every `compatible` entry, the
  versions they were run against, and an explicit statement of what those
  claims do **not** cover (no runtime acceptance, no visual verification).
- `npm run check` now validates the declaration's shape (full-SemVer keys,
  known statuses, Node range agreement with `engines.node`, at least one
  `compatible`).

### Compatibility evidence

`compatible` was declared for `0.2.0-rc.1`, `0.2.0-rc.2`, and
`0.2.1-alpha.1` … `0.2.1-alpha.4` after, for each version, running **that
version's own published `@deepseek-ai/dsh-client-modules` scanner** against this
package and confirming the CodeBlock DOM, locale API, and `inject` target row
the plugin depends on are still present. `0.1.7-rc.1` and `0.1.7-rc.2` stay
`unknown`: the same markers happen to hold there, but the 0.1 line was not
exercised and is not claimed.

## [0.3.0] - 2026-10-16

Rebuilt against dsh 0.2.0-rc.2 and the plugin spec shipped with it
(`cordis-plugin-development` skill). **Install steps changed — read
[docs/install.md](./docs/install.md).**

### Fixed

- **The plugin was inert on current dsh.** `dsh plugin --profile web add` is a
  pnpm passthrough: it installs the dependency but never registers a bundle
  layer, so the row was absent from the composed profile. The docs claimed
  otherwise; both the docs and the packaging now match reality, and
  `plugin_manager install_bundle` is the documented path.
- **Mermaid fences were no longer detectable.** Current dsh renders a fence
  header through `CodeToolbar`, which prints the *generic* code label for a
  language shiki does not know — the `mermaid` info string never reaches the DOM.
  Detection is now content-based (leading Mermaid statement) with the explicit
  label still honored where a surface prints one.
- **Diagrams fought React.** The old code replaced the React-owned `<pre>`. It
  now appends its holder after React's children and hides the original body with
  an attribute, so re-renders (theme switch, streaming settle) cannot orphan it,
  and the built-in copy button keeps working.
- Legacy `dsh.client.inject: ["@deepseek-ai/dsh-client-runtime"]` removed: that
  package no longer exists and never ordered anything.

### Added

- `index.js` Host half with the spec's named `apply` export (was a client-shaped
  default export used as the package entry).
- `locale/en.json` + `locale/zh.json` display metadata, `icon.svg`, and the
  `exports` entries dsh reads them through.
- Client locale integration: the source/diagram toggle follows the interface
  language and refreshes on `locale/change`.
- `suppressErrorRendering: true` so a parse failure cannot inject mermaid's own
  error graphic into the page.
- `npm run check`: syntax, manifest contract, `dist`/`src` freshness, 25
  detection cases, and one Mermaid pin across plugin/demo/docs.

### Changed

- Client artifact renamed to `dist/client.js` (`exports["./client"]`); the dynamic
  payload stays at `dist/dsh-mermaid-preview.client.js`. One `scripts/build.mjs`
  emits both; `cordis.yml` became `cordis.patch.yml`.
- Render scheduling: 250 ms settle debounce and a serialized render queue, so
  streaming and multi-diagram messages no longer thrash the main thread.
- Mermaid pinned to 11.17.2 (was 11.16.1).
- Every side effect is now fiber-owned and removed on dispose, including timers
  and the injected `<script>`.

## [0.2.1] - 2026-08-14

### Fixed

- Native `dsh plugin add` install actually loaded: the previous release only
  shipped the dynamic-runner payload, so the web `client-modules` loader never
  served the plugin (404 on `/plugins/dsh-mermaid-preview/client.js`, absent from
  `window.__DSH_BOOT__`) and nothing rendered. Two changes fix it:
  - `package.json` `exports` now exposes `./package.json` (required for the
    client-modules manifest discovery scan).
  - `exports["./client"]` now points at a browser-loadable bundle
    (`dist/dsh-mermaid-preview.bundle.js`) that calls
    `window.__ModuleLoader__.load({ id, factory })` with a CommonJS factory
    exporting `apply` — the same shape dsh's own native client plugins use.
- Added `scripts/build-client-bundle.mjs` to derive that native bundle from
  `src/client.js`; `npm run build`/`check` now emit and verify both artifacts
  (dynamic payload + native bundle).

## [0.2.0] - 2026-08-14

### Added

- `dsh bundle` support: `package.json` now declares `dsh.bundle.patch` and
  `dsh.client.inject`, enabling native installation via `dsh plugin --profile web add`.
- `cordis.yml` composition file for automatic plugin registration.
- `assets/banner.png` repository banner (1280×640, dark gradient).
- README.md / README.en.md embed the banner image.

### Changed

- Installation docs now lead with `dsh plugin add` as the primary method.
- Dynamic plugin (cordis_define) demoted to Option 4 / fallback.

## [0.1.0] - 2026-08-14

### Added

- Initial release: dynamic Cordis client plugin that renders Mermaid fenced code
  blocks in every dsh web Markdown surface (chat, trajectory, plan review, …).
- MutationObserver-based DOM hook with no modification to the dsh web shell.
- Mermaid 11 (UMD) loaded from jsDelivr via a `<script>` tag; no build step,
  no bundling into the host app.
- Follows the dsh light/dark theme and re-renders diagrams on theme change.
- Per-diagram "show source / show diagram" toggle; copy button of the original
  code block keeps working.
- Graceful fallback: on CDN or syntax failure the original code block is kept
  and an inline error note is shown.
- Dependency-free standalone demo page (`demo/`) with 10 diagram-type presets.
- Bilingual documentation (中文 / English), install guide, architecture notes.
