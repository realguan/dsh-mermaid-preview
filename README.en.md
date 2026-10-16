# dsh-mermaid-preview

<p align="center">
  <img src="assets/banner.png" alt="dsh-mermaid-preview banner" width="100%" />
</p>

A Cordis plugin that renders Markdown `mermaid` fenced code blocks as diagrams
inside the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(dsh) Web UI.

Chat, trajectory, plan review, compaction summaries — every surface rendered by
`MarkdownText` gets Mermaid support from one hook.

> 中文 README: [README.md](./README.md)

## Install

> **⚠️ Installation changed in 0.3.0.** `dsh plugin --profile web add <pkg>` is a
> pnpm passthrough: it installs the dependency but does **not** register a bundle
> layer. A package that is installed but missing from `dsh.profile.bundles` never
> activates — that is exactly why older releases looked "installed but dead".
> See [docs/install.md](./docs/install.md).

### Option 1 — let the agent install it (recommended)

In a dsh session, have the model call `plugin_manager`:

```
action: install_bundle
target: <absolute path to this package>   # or github:realguan/dsh-mermaid-preview
```

That installs, registers the bundle, and activates through HMR in one step.

### Option 2 — manual

```bash
dsh plugin --profile web add github:realguan/dsh-mermaid-preview
```

Then **register the bundle**: add `"dsh-mermaid-preview"` to
`dsh.profile.bundles` in `~/.dsh/profiles/web/package.json` and run
`pnpm install`, or add it to the profile's user patch layer
(`~/.dsh/profiles/web/cordis.patch.yml`):

```yaml
- insert:
    - id: mermaid-preview
      name: dsh-mermaid-preview
```

### Option 3 — dynamic plugin (no install)

Hand the contents of `dist/dsh-mermaid-preview.client.js` to `cordis_define` as
`code.client`, then `cordis_run` and allow it. Details in
[docs/install.md](./docs/install.md).

### Verify the install

```bash
dsh --profile web --dump-config | grep -A2 mermaid-preview
```

Then send a message containing a ```mermaid fence and confirm you get a diagram.
Full checklist: [docs/install.md](./docs/install.md).

## Features

- 🖼️ **No shell changes** — the plugin observes the DOM; dsh sources stay untouched
- 🧭 **Tracks the current render contract** — detection is "unhighlighted fence +
  a leading Mermaid statement", not the language label that current dsh no longer
  prints (see [architecture.md](./docs/architecture.md) §2)
- 🌗 **Follows the theme** — light/dark aware, repaints on `theme/change`
- 🌐 **Follows the locale** — button copy goes through the Client locale service
- 📋 **Keeps the host controls** — no React node is replaced, so the built-in copy
  button still works; a "show source / show diagram" toggle is added
- 🔍 **Click to enlarge** — models love very wide diagrams, and the fence's width
  shrinks them to unreadable type. Click the diagram (or the "Zoom" button) for a
  full-window viewer: wheel zoom, drag to pan, fit / 1:1, `Esc` to close
  (see [architecture.md](./docs/architecture.md) §7)
- 🧾 **No code banner over a diagram** — a diagram is not code, so the shell's
  generic code label and its collapse/copy buttons step aside while one is on
  screen; they come back with the source view
- 🛟 **Fails soft** — a CDN or syntax failure keeps the original code block and
  shows an inline note
- 🧹 **Clean disposal** — styles, observer, timers, script tag, and injected DOM
  all belong to the plugin fiber
- 🧪 **Self-checking** — `npm run check` validates syntax, manifest, artifact
  freshness, detection cases, and version pins
- 📚 **Many diagram types** — flowchart / sequenceDiagram / classDiagram /
  stateDiagram-v2 / gantt / pie / erDiagram / journey / mindmap / gitGraph /
  timeline and more

## Try the standalone demo (no dsh needed)

```bash
npm run demo        # → http://localhost:8090
```

## How it works (30 seconds)

The dsh Markdown renderer emits `.md-code-block`: a `[data-code-block-banner]`
header plus a `[data-code-block-content]` body. For a language shiki does not know
(including `mermaid`) the header shows a generic label and the body is a plain
`<pre>`.

The plugin uses a `MutationObserver` to find blocks whose body's first element is
that `<pre>`, checks whether the fence's first statement opens a Mermaid diagram,
then lazily loads Mermaid 11 (jsDelivr CDN) and injects the SVG into a
`.dsh-mermaid` holder appended **after** React's children — hiding the original
body with an attribute instead of replacing any React-owned node.

Full rationale, DOM contract, disposal strategy, and known limits:
[docs/architecture.md](./docs/architecture.md).

## Layout

```
index.js                        Host half (empty apply; gives the bundle a mountable row)
cordis.patch.yml                Bundle layer (dsh.bundle.patch)
src/client.js                   The only logic source (ES module, export default)
scripts/build.mjs               Emits dist/client.js and dist/dsh-mermaid-preview.client.js
scripts/check.mjs               Syntax / manifest / artifact freshness / detection / version pins
dist/client.js                  Native bundle (exports["./client"], loaded by client-modules)
dist/dsh-mermaid-preview.client.js  Dynamic payload for cordis_define
locale/{en,zh}.json             Plugin display title and description
icon.svg                        Plugin icon
demo/                           Dependency-free standalone demo page
docs/install.md                 Install / uninstall / update / verify / FAQ
docs/architecture.md            Implementation notes and safety
docs/compatibility.md           Per-release DSH compatibility claims and their evidence
```

## Facts

| Item | Value |
| --- | --- |
| Platform | dsh Web (Client half) + empty Host half |
| Plugin form | dsh bundle client plugin (`dsh.bundle.patch` + `dsh.client`) |
| DSH compatibility | Declared per release in `dsh.compatibility.dshReleases`; evidence in [docs/compatibility.md](./docs/compatibility.md) |
| Mermaid | 11.17.2 (UMD, jsDelivr CDN; swap the constant for a mirror) |
| Dependencies | None at runtime; scripts use Node built-ins only |
| Safety | `securityLevel: 'strict'`, `suppressErrorRendering`, no telemetry |
| License | MIT |

## FAQ

- **Installed but nothing renders**: make sure the package name is in
  `dsh.profile.bundles` and that `dsh --profile web --dump-config` shows the
  `mermaid-preview` row.
- **Console shows `client-modules:` errors**: the message names the package and
  the broken declaration (missing `./client` export, module-graph cycle, …).
- **CDN load failure**: offline, or jsDelivr unreachable. Change `MERMAID_CDN` at
  the top of `src/client.js` and run `npm run build`.
- **Nothing renders while streaming**: by design; a fence must be quiet for 250 ms.
- **A non-Mermaid fence became a diagram**: detection is content-based, so a fence
  whose first line happens to be `graph TD` is claimed. Change that first line.
- **The diagram is too wide to read**: click it, or the "Zoom" button under it, for
  the full-window viewer. Fit is the default; wheel zooms about the pointer, drag
  pans, double-click toggles fit ↔ 1:1, `0` resets, `Esc` closes. The viewer works
  on an SVG copy, so the code block itself is untouched.
- **Copy is English while the interface is Chinese**: the plugin follows dsh's
  language setting — it binds the locale service's namespace dictionary once that
  service is up, and falls back to the built-in dictionary picked by `<html lang>`
  before then. If it still shows English, the shell offered neither.

More in [docs/install.md](./docs/install.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). After editing `src/client.js`, run
`npm run build` and commit `dist/` (`npm run check` catches a stale build).

## Credits

- [mermaid](https://github.com/mermaid-js/mermaid) — the diagram engine
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — the platform
- [jsDelivr](https://www.jsdelivr.com/) — CDN delivery

## License

[MIT](./LICENSE) © 2026 realguan
