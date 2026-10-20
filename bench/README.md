# Render-cost benchmark

Playwright is **not** a dependency of this package (the harness must never ship
with the plugin), so install it once, outside the package:

```sh
mkdir -p /tmp/mm-bench && cd /tmp/mm-bench && npm init -y \
  && npm i playwright@1.63.0 && npx playwright install chromium
```

Then, from the package root, one command reproduces every number:

```sh
node bench/bench.mjs --reps 9 --label baseline
```

`bench/bench.mjs` starts its own static server (`bench/serve.mjs`), launches
headless Chromium at 1440x900 / DPR 1, and drives the **real plugin**: it loads
`dist/client.js` through a `window.__ModuleLoader__` stub, calls the plugin's
`apply(ctx)` with a minimal Cordis context (`effect` / `get` / `on`), injects
`.md-code-block` fences (`[data-code-block-banner]` + `[data-code-block-content]
> pre`) into a 2400px-tall card container inside a ~260-node conversation, and
waits for the plugin's own `data-dsh-mermaid="done"` marker. Nothing inside
`src/` or `dist/` is stubbed, patched or copied: `scan`, the 250 ms settle
timer, the serial queue, `configure()`, `mermaid.render()`, `innerHTML` and
`fitReading()` are all the shipped code. Mermaid is loaded from the same
vendored engine the plugin ships with (`dist/client.mermaid.js`), and the first
two renders are discarded (JIT, font and dagre warmup). Flags: `--variant <name>` (default `radix`, written to the
plugin's own `localStorage` preference key), `--scheme light|dark`,
`--reps N`, `--label NAME`, `--init-mode every|once|paired`, `--cv`,
`--contain`, `--iso`, `--no-probe`, `--no-burst`, `--no-json`. Output goes to
stdout and to `bench/results-<label>.json`.

| metric | what it measures |
| --- | --- |
| `init` | `mermaid.initialize()`, which the plugin's `configure()` calls once per paint (measured by wrapping `mermaid.initialize`; the config object build itself is separate and free) |
| `render` | `mermaid.render(id, code)` total, the call `paint()` awaits, **net of** the forced-layout probe |
| `insert` | from `canvas.innerHTML = result.svg` through the first layout read the plugin makes in `fitReading()` — the DOM build plus the style/layout flush the new SVG forces |
| `total` | `init + render + insert` = one diagram's paint cost |
| `firstPaint` | fence injection → the first frame that can show the finished diagram (includes the plugin's 250 ms settle) |
| `wall` | fence injection → the `data-dsh-mermaid="done"` marker |
| `probe` | instrument-added: at mermaid's temporary host insertion (`document.body.appendChild`), a forced `getBoundingClientRect()` on the 2400px container. Reported separately and excluded from `render` |
| `burst` | the whole corpus appended in one tick, the realistic "one message, nine diagrams" shape; `burstWall` = inject → all done, `burstFirstPaint` = inject → first frame after the last diagram, `burstWork` = init + render + insert summed over all nine, `burstRender` = render alone |
| `parked` | the long-conversation shape (`--park`): all nine fences mounted while the viewport sits elsewhere, then 1.5s of quiet. Reports how many `mermaid.render` calls the plugin chose to make — the number the visibility gate is about |

## Cache and visibility (since 0.6.0)

The plugin no longer renders every fence it sees, and it caches finished SVG
strings. Two flags keep that measurable:

- **Cache busting is on by default.** Every injected fence gets a trailing
  `%% bench <n>` Mermaid comment so its text is unique, which makes every rep a
  real `mermaid.render` and keeps these numbers comparable with a build that has
  no cache. `--cache` turns busting off and measures the cache instead: the
  warmup fills it, so every rep is a hit and `render` reads 0.
- **Cards are presented before being measured.** The plugin renders on
  visibility, so `measureOne` and the warmup scroll each card to 120px below the
  viewport top before the settle window elapses (`presentCard`). The `--park`
  arm deliberately does not. The burst arm brings each card into view and holds
  it there until the plugin finishes it, because the browser samples
  intersections once per frame and a card that flashes past between two samples
  is (correctly) treated as unseen.

`--artifact <file>` serves a different bundle as `/dist/client.js`, which is how
this revision was compared against the released one without touching the working
tree — copy the old artifact out of git first, e.g.
`git show HEAD~1:dist/client.js > /tmp/before-client.js`, then run the same
command with `--artifact /tmp/before-client.js`.

What the numbers do **not** prove: they are one machine (Apple Silicon, macOS)
under a background load of roughly 8–10 at measurement time, so per-diagram cv
is 20–30% on the cheap diagrams and run-to-run drift on the corpus total is
5–12%. Cross-run deltas smaller than ~10% are therefore not resolvable — which
is why the initialize experiment uses a paired design (`--init-mode paired`:
both arms inside one run, order flipped per rep) rather than two runs. Mermaid
is preloaded and already parsed before the measured window, so the engine load
is excluded by construction; the plugin's own lazy-load path is still
exercised once by the warmup. Renders started after the plugin's 250 ms settle
are measurably more expensive than back-to-back renders (CPU/JIT state), so
`burst` per-diagram costs are not comparable to single-diagram costs — compare
like shapes only. Finally, `insert` is measured against the plugin's default
`fit=scroll` layout (canvas capped at `min(900px, 85vh)`, `overflow:auto`), and
the two direct-mode micro-experiments (`--iso`) bypass the plugin by design and
are labelled as such in the output.

Two further flags exist and are historical: `--cv` re-applies the
`content-visibility: auto` experiment from the page (the plugin itself does not
use it — see the CHANGELOG's "Rejected" section), and `--contain` / `--iso` are
the other rejected micro-experiments. They are kept because the negative result
is worth reproducing.

`bench/.gitignore` keeps `results-*.json` out of git; nothing here is in the
package's `files` list, so none of it ships.
