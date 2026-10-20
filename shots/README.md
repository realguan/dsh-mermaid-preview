# README screenshots

Every screenshot in the README is a **real plugin render**: `shots/` loads the
shipped `dist/client.js` through the real `window.__ModuleLoader__` contract, lets the
plugin render into fences built in the shell's documented DOM shape, and screenshots
the result. Nothing about the plugin is re-implemented, and the Mermaid engine is the
vendored one from `dist/client.mermaid.js`.

The only fabricated part is the *shell*: `page.html` is a minimal stand-in for the
dsh Web UI (left rail, thread column, composer) styled with the shell's **own design
tokens**, copied verbatim into `tokens-light.css` / `tokens-dark.css` from
`@deepseek-ai/dsh-client-ui-theme`. Regenerate those two files when the shell's theme
changes; nothing else here fakes a colour.

## Usage

Playwright is **not** a dependency of this package, so install it once outside the
package (same as `bench/`):

```sh
mkdir -p /tmp/mm-bench && cd /tmp/mm-bench && npm init -y \
  && npm i playwright@1.63.0 && npx playwright install chromium
```

Then, from the package root:

```sh
node shots/run.mjs
```

It starts its own server, opens the page once per (scene, theme) pair, waits for the
plugin's own `data-dsh-mermaid="done"` marker, writes the PNGs into `assets/`, and
fails on a scene that never renders. Output:

| file | what it shows |
| --- | --- |
| `shot-overview-light.png` | full window, light theme — a flowchart card in a conversation |
| `shot-overview-dark.png` | the same conversation in the dark theme |
| `shot-sequence.png` | full window, a sequence diagram |
| `shot-gantt.png` | the card alone, a gantt |
| `shot-timeline.png` | the card alone, a timeline with per-period solids |
| `shot-class.png` | the card alone, a class diagram in the dark theme |
| `shot-journey.png` | the card alone, a user journey |
| `shot-mindmap.png` | the card alone, a mindmap |
| `shot-pie.png` | the card alone, a pie |
| `shot-error.png` | full window, the calm syntax-error note |

`mode: 'context'` captures the whole window; `mode: 'card'` screenshots the diagram
card's own box (Playwright's element screenshot), which is why the close-ups have no
surrounding chrome.

## Adding a scene

Add an entry to `scenes.mjs` (a short conversation plus a Mermaid source), then a row
in the `SHOTS` table in `run.mjs`. The scenes were written to look like something a
reader would actually ask — a real question, a real diagram answer — rather than
diagram-type specimens; keep that shape when extending them.

## Why not just screenshot the real app?

Because the shots must be reproducible on any machine, without an installed plugin, a
running dsh, a profile, or a session full of diagrams — and because a screenshot that
depends on someone's local conversation history rots the moment that history changes.
Driving the shipped artifact keeps the pixels honest while making the pipeline
re-runnable. What this **cannot** prove: that the shell's real CSS and the real
plugin compose the same way. That check stays manual, and `docs/install.md` § 验证
lists what to look at.
