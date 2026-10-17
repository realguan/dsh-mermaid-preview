# dsh-mermaid-preview

<p align="center">
  <img src="assets/banner.png" alt="dsh-mermaid-preview banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white" alt="powered by dsh" width="121" height="20" /></a>
</p>

A Cordis plugin that renders Markdown `mermaid` fenced code blocks as diagrams
inside the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(dsh) Web UI.

Diagrams are not pasted-in Mermaid defaults: they are redrawn with one of
**seven open-source design-system themes** (Radix Colors by default) and live
inside dsh as native cards — a type label coloured per diagram kind with
theme / copy / source / zoom, horizontal scrolling for wide diagrams, a
full-window zoom viewer, and a quiet banner when rendering fails.

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
- 🌈 **Switchable design-system themes** — the default is **Radix Colors** (the
  author's final pick); seven styles ship: **Radix Colors, Apple HIG,
  GitHub Primer, IBM Carbon, Atlassian Design System, Material Design 2,
  Shopify Polaris**, plus the original neutral dsh theme. Each derives pastel nodes, data-viz ramps, sequence/note/
  autonumber accents from that system's published solid + neutral tokens, and
  follows its corner-radius language (Carbon/Material squarer, Radix/Apple
  rounder)
- 🎨 **Switch themes right in the card** — the palette button in every diagram
  header opens a theme menu with a three-dot swatch per style and a check on the
  live one; picking a style repaints every diagram at once and is remembered
  (localStorage). To change the default instead, edit `THEME_VARIANT` in
  `src/theme.js` (see [design.md](./docs/design.md)); the demo page's "style"
  picker also flips them live
- 🌗 **Follows the theme** — light/dark aware; a theme switch repaints diagrams,
  the card chrome, and the viewer together
- 🌐 **Follows the locale** — copy goes through the Client locale service
- 📋 **One header per card** — no React node is replaced; the plugin draws its own
  header: a colour-coded type tag on the left (Apple system-colour tint) and
  theme / copy source / show source / zoom on the right. The source view is
  React's original `<pre>`; the shell's generic code banner is hidden with an
  attribute instead of stacking a second header
- 🧾 **A diagram is not code** — the card header shows the diagram type
  (`flowchart`, `sequenceDiagram`, `gantt`, …) instead of a meaningless "Code"
  label
- 📐 **Wide diagrams stay readable** — they fit when they can, and keep their
  natural size with horizontal scroll when they cannot (the right edge fades until
  you reach the end); click the diagram or the header's zoom control for the
  full-window viewer: blurred mask, floating toolbar, wheel zoom, drag to pan,
  fit / 1:1, `Esc` to close (see [architecture.md](./docs/architecture.md) §7)
- 🛟 **Fails soft, without shouting** — a CDN or syntax failure keeps the source
  and shows a calm note (a human sentence plus expandable parser detail) instead
  of a wall of red; editing the fence retries automatically
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

The demo imports the plugin's own `src/theme.js`, so what it renders is exactly
what chat renders — including every design-system theme. The header's new
"style" picker switches Radix / Apple / GitHub / Carbon / Atlassian / Material /
Polaris / neutral live, in both light and dark.

| Light | Dark |
| --- | --- |
| <img src="assets/demo-light.png" alt="Demo page in light theme" width="100%" /> | <img src="assets/demo-dark.png" alt="Demo page in dark theme" width="100%" /> |

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
[docs/architecture.md](./docs/architecture.md). Visual rules, design tokens, and
the diagram theme: [docs/design.md](./docs/design.md).

## Layout

```
index.js                        Host half (empty apply; gives the bundle a mountable row)
cordis.patch.yml                Bundle layer (dsh.bundle.patch)
src/client.js                   Plugin logic source (ES module, export default)
src/theme.js                    Diagram theme (light/dark theme variables + diagram config; inlined at build)
scripts/build.mjs               Emits dist/client.js and dist/dsh-mermaid-preview.client.js
scripts/check.mjs               Syntax / manifest / artifact freshness / detection / version pins
dist/client.js                  Native bundle (exports["./client"], loaded by client-modules)
dist/dsh-mermaid-preview.client.js  Dynamic payload for cordis_define
locale/{en,zh}.json             Plugin display title and description
icon.svg                        Plugin icon
demo/                           Dependency-free standalone demo page
docs/install.md                 Install / uninstall / update / verify / FAQ
docs/architecture.md            Implementation notes and safety
docs/design.md                  Visual design: tokens, diagram theme, card and viewer specs
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
- **The diagram is too wide to read**: the card keeps a readable size and scrolls
  horizontally (with a fade cue at the right edge); click the diagram or the zoom
  control in the card header for the full-window viewer. Fit is the default; wheel
  zooms about the pointer, drag pans, double-click toggles fit ↔ 1:1, `0` resets,
  `Esc` closes. The viewer works on an SVG copy, so the code block itself is
  untouched.
- **The diagram colors changed**: since 0.5.0 the default is a Radix Colors
  diagram theme instead of Mermaid's stock palette, so the old lavender/purple
  nodes are gone. Open the palette button in any diagram header to switch styles;
  the choice applies immediately and is remembered. To change the default
  instead, set `THEME_VARIANT` at the top of `src/theme.js` to `radix` / `apple` /
  `github` / `carbon` / `atlassian` / `material` / `polaris` / `quiet` and run
  `npm run build`. A `%%{init: …}%%` directive in the fence can still override the
  theme.
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
