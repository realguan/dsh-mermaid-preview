# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
