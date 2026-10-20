window.__ModuleLoader__.load({
	id: "dsh-mermaid-preview",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
/**
 * dsh-mermaid-preview — the diagram theme.
 *
 * Two hand-built Mermaid `base` themes, both derived from the host's type stack
 * and geometry:
 *
 *   radix  (default) — Radix Colors: 12-step scales, step-9 solids for strokes,
 *          slate neutrals for text/surfaces. Open, even, modern.
 *   apple  — Apple HIG system colours: pastel tints with saturated same-hue
 *          strokes, vivid data-viz ramps.
 *   github / carbon / atlassian / material / polaris — the same factory over
 *          each system's published solid + neutral tokens (shape language
 *          follows each system's corner radius).
 *   quiet  — the DSH-native neutral theme (white/graphite nodes, hairline
 *          strokes, DeepSeek blue accents).
 *
 * Switch with `THEME_VARIANT` below (one line, rebuild). `CONFIG` and the font
 * stack are shared; only the palettes, per-scheme Journey band arrays and the
 * generated `themeCSS` differ.
 *
 * Fonts are literal, not `inherit`: Mermaid measures HTML labels on a detached
 * SVG under <body> (host text font) but renders the finished SVG inside the
 * code card (host *code* font). Inheriting the font makes measurement and
 * rendering disagree, which clips class/state labels. A concrete stack makes
 * both passes agree.
 *
 * This module is the single source of the theme. `scripts/build.mjs` inlines it
 * (with the `export` keywords stripped) into both client artifacts, so the
 * plugin still ships as a single wrapped source with no bundler. The standalone
 * demo imports it directly through the demo server.
 *
 * MIT License. Apple system colours are Apple HIG design token values (no
 * assets); DSH palette from DeepSeek Harness client-ui-theme (MIT).
 */

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif"

/** Parse #rgb/#rrggbb to {r,g,b}. */
const rgbOf = (hex) => {
  const value = String(hex).replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const n = Number.parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** {r,g,b} (already in range) to #rrggbb. */
const hexOf = ({ r, g, b }) => `#${[r, g, b]
  .map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0'))
  .join('')}`

/** Mix two colours; `weight` is the portion of `a` (0..1). */
const mix = (a, b, weight) => {
  const x = rgbOf(a)
  const y = rgbOf(b)
  return hexOf({
    r: x.r * weight + y.r * (1 - weight),
    g: x.g * weight + y.g * (1 - weight),
    b: x.b * weight + y.b * (1 - weight),
  })
}

/** WCAG relative luminance. */
const luminance = (hex) => {
  const { r, g, b } = rgbOf(hex)
  const channel = (value) => {
    const n = value / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two colours. */
const contrast = (a, b) => {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** White or near-black, whichever reads better on `color`. */
const bestText = (color) => (contrast(color, '#FFFFFF') >= contrast(color, '#111111') ? '#FFFFFF' : '#111111')

/** Same-hue legible text colour on this scheme's tint (stronger, not pastel). */
const strongOnTint = (color, mode) => (mode === 'dark' ? mix(color, '#FFFFFF', 0.18) : mix(color, '#000000', 0.2))

/**
 * A solid hue with enough body for white text (4.5:1).
 *
 * The design systems pick their step-9 solids for large text; a 12px node label
 * is not large text, so walk the token toward black until it is. Used for the
 * diagram types where colour encodes a category.
 */
const solidOf = (hue) => {
  let fill = hue
  for (let i = 0; i < 12 && contrast(fill, '#FFFFFF') < 4.5; i += 1) {
    fill = mix('#000000', fill, 0.12)
  }
  return fill
}

/**
 * Give a palette the semantic slope, derived from its own hues.
 *
 * `buildPalette` computes these for the six design-system variants; the
 * hand-written `quiet` and `apple` palettes do not carry them, and without them
 * those two fell back to plain tints — which is how apple's C4 external box
 * ended up painted in the card surface colour. Deriving instead of hard-coding
 * keeps both variants on their own hues.
 */
const withSemantic = (p) => {
  // A palette with neither a slope nor the hue table it would be derived from
  // (the `quiet` sheet is a literal themeVariables-shaped object) is returned
  // untouched rather than half-populated.
  if (p.solid !== undefined || p.sys === undefined || p.card === undefined) return p
  const mode = p.mode ?? (p.darkMode ? 'dark' : 'light')
  const solid = {}
  const tintStrong = {}
  for (const [name, hue] of Object.entries(p.sys)) {
    solid[name] = solidOf(hue)
    tintStrong[name] = mix(hue, p.card, mode === 'dark' ? 0.5 : 0.34)
  }
  return { ...p, solid, tintStrong }
}

/* ------------------------------------------------------------------------- *
 * Light
 * ------------------------------------------------------------------------- */

const LIGHT = {
  /* --- base ------------------------------------------------------------- */
  background: '#F9FAFB', // host card surface (neutral-bluish-50)
  darkMode: false,
  fontSize: '14px',
  // Literal DSH text stack, NOT `inherit`: Mermaid measures HTML labels in a
  // detached temp container on <body> (DSH text font) but the final SVG lands
  // inside .md-code-block, which sets the DSH *code* font. `inherit` therefore
  // renders wider than it measured and clips (class/state/flowchart labels).
  fontFamily: FONT_STACK,
  useGradient: false,
  dropShadow: 'none',
  radius: 8,
  strokeWidth: 1,

  primaryColor: '#FFFFFF',
  primaryTextColor: '#0F1115', // label-primary (neutral-bluish-1000)
  primaryBorderColor: 'rgba(0,0,0,0.16)',
  secondaryColor: '#F5F6F7', // neutral-bluish-60
  secondaryTextColor: '#0F1115',
  secondaryBorderColor: 'rgba(0,0,0,0.10)',
  tertiaryColor: '#F1F3F5',
  tertiaryTextColor: '#61666B', // label-secondary (neutral-bluish-700)
  tertiaryBorderColor: 'rgba(0,0,0,0.08)',

  textColor: '#0F1115',
  lineColor: '#8A9099', // neutral-bluish-500 nudged for 3:1 on the card
  arrowheadColor: '#8A9099',
  titleColor: '#0F1115',
  errorBkgColor: '#FBE9E9',
  errorTextColor: '#8A2E2E',

  /* --- flowchart -------------------------------------------------------- */
  mainBkg: '#FFFFFF',
  nodeBkg: '#FFFFFF',
  nodeBorder: 'rgba(0,0,0,0.16)',
  nodeTextColor: '#0F1115',
  clusterBkg: '#F5F6F7',
  clusterBorder: 'rgba(0,0,0,0.08)',
  defaultLinkColor: '#8A9099',
  edgeLabelBackground: '#F9FAFB',

  /* --- notes / callouts -------------------------------------------------- */
  noteBkgColor: '#F1F3F6',
  noteTextColor: '#0F1115',
  noteBorderColor: 'rgba(0,0,0,0.12)',
  noteFontWeight: 'normal',
  border2: 'rgba(0,0,0,0.12)',

  /* --- sequence --------------------------------------------------------- */
  actorBkg: '#FFFFFF',
  actorBorder: 'rgba(0,0,0,0.16)',
  actorTextColor: '#0F1115',
  actorLineColor: 'rgba(0,0,0,0.12)',
  signalColor: '#8A9099',
  signalTextColor: '#0F1115',
  labelBoxBkgColor: '#EFF1F4',
  labelBoxBorderColor: 'rgba(0,0,0,0.12)',
  labelTextColor: '#5B6067',
  loopTextColor: '#0F1115',
  activationBkgColor: '#E9EDF3',
  activationBorderColor: 'rgba(0,0,0,0.18)',
  sequenceNumberColor: '#F9FAFB',
  rectBkgColor: '#F1F3F5',

  /* --- state ------------------------------------------------------------ */
  stateBkg: '#FFFFFF',
  stateBorder: 'rgba(0,0,0,0.16)',
  stateLabelColor: '#0F1115',
  labelBackgroundColor: '#F9FAFB',
  compositeBackground: '#FFFFFF',
  altBackground: '#F5F6F7',
  compositeTitleBackground: '#F5F6F7',
  compositeBorder: 'rgba(0,0,0,0.10)',
  innerEndBackground: '#0F1115',
  specialStateColor: '#0F1115',
  transitionColor: '#8A9099',
  transitionLabelColor: '#0F1115',
  attributeBackgroundColorOdd: '#FFFFFF',
  attributeBackgroundColorEven: '#F6F7F9',

  /* --- class ------------------------------------------------------------ */
  classText: '#0F1115',

  /* --- er --------------------------------------------------------------- */
  rowOdd: '#FFFFFF',
  rowEven: '#F6F7F9',

  /* --- gantt ------------------------------------------------------------ */
  sectionBkgColor: '#E8EDF4',
  altSectionBkgColor: '#FFFFFF',
  sectionBkgColor2: '#F0F3F8',
  excludeBkgColor: '#F1F3F5',
  taskBkgColor: '#DCE6F5',
  taskBorderColor: '#A8BBD9',
  taskTextColor: '#1B2A44',
  taskTextOutsideColor: '#61666B',
  taskTextDarkColor: '#0F1115',
  taskTextLightColor: '#1B2A44',
  taskTextClickableColor: '#4176E6',
  activeTaskBkgColor: '#C9D8F0',
  activeTaskBorderColor: '#7E9CC9',
  doneTaskBkgColor: '#ECEEF1',
  doneTaskBorderColor: '#C6CBD2',
  critBkgColor: '#F6E7E7',
  critBorderColor: '#C98B8B',
  todayLineColor: '#4176E6',
  vertLineColor: '#B7BDC6',
  gridColor: '#E1E5EA',

  /* --- journey ---------------------------------------------------------- */
  faceColor: '#F1F3F6',
  actor0: '#EFF2F6',
  actor1: '#E9EDF3',
  actor2: '#F2F4F7',
  actor3: '#EAEFF5',
  actor4: '#F0F3F6',
  actor5: '#E7ECF2',
  fillType0: '#EDF1F8',
  fillType1: '#E7EDF7',
  fillType2: '#F1F3F6',
  fillType3: '#E6ECF5',
  fillType4: '#EFF2F7',
  fillType5: '#E3EAF4',
  fillType6: '#EBEFF5',
  fillType7: '#E9EDF3',

  /* --- pie -------------------------------------------------------------- */
  pie1: '#7C9DE8',
  pie2: '#A9BEE9',
  pie3: '#C9D5E8',
  pie4: '#8A96A6',
  pie5: '#DDE3EA',
  pie6: '#6F8299',
  pie7: '#B6C6DD',
  pie8: '#E4E8EE',
  pie9: '#93A3B8',
  pie10: '#C2CBD8',
  pie11: '#7E8EA3',
  pie12: '#D5DCE6',
  pieTitleTextSize: '15px',
  pieTitleTextColor: '#0F1115',
  pieSectionTextSize: '12px',
  pieSectionTextColor: '#0F1115',
  pieLegendTextSize: '12px',
  pieLegendTextColor: '#61666B',
  pieStrokeColor: '#F9FAFB',
  pieStrokeWidth: '2px',
  pieOuterStrokeWidth: '1px',
  pieOuterStrokeColor: 'rgba(0,0,0,0.10)',
  pieOpacity: 1,

  /* --- git graph -------------------------------------------------------- */
  git0: '#7C9DE8',
  git1: '#8B96A4',
  git2: '#7E9DBF',
  git3: '#A3AEBB',
  git4: '#8FA0B6',
  git5: '#9DA9B8',
  git6: '#B8C1CC',
  git7: '#8496AC',
  gitInv0: '#F9FAFB',
  gitInv1: '#F9FAFB',
  gitInv2: '#F9FAFB',
  gitInv3: '#F9FAFB',
  gitInv4: '#F9FAFB',
  gitInv5: '#F9FAFB',
  gitInv6: '#F9FAFB',
  gitInv7: '#F9FAFB',
  branchLabelColor: '#0F1115',
  gitBranchLabel0: '#0F1115',
  gitBranchLabel1: '#0F1115',
  gitBranchLabel2: '#0F1115',
  gitBranchLabel3: '#0F1115',
  gitBranchLabel4: '#0F1115',
  gitBranchLabel5: '#0F1115',
  gitBranchLabel6: '#0F1115',
  gitBranchLabel7: '#0F1115',
  commitLineColor: '#C3C9D2',
  commitLabelColor: '#5B6067',
  commitLabelBackground: '#F9FAFB',
  commitLabelFontSize: '11px',
  tagLabelColor: '#0F1115',
  tagLabelBackground: '#F1F3F6',
  tagLabelBorder: 'rgba(0,0,0,0.12)',
  tagLabelFontSize: '11px',

  /* --- timeline / mindmap ----------------------------------------------- */
  cScale0: '#DCE4F0',
  cScale1: '#E3E8F0',
  cScale2: '#D3DDEA',
  cScale3: '#E8ECF2',
  cScale4: '#D8E1EE',
  cScale5: '#DFE5EE',
  cScale6: '#CFD9E7',
  cScale7: '#E5E9F0',
  cScale8: '#D9E2EF',
  cScale9: '#E1E7F0',
  cScale10: '#D5DEEC',
  cScale11: '#E7EBF1',
  cScaleLabel0: '#0F1115',
  cScaleLabel1: '#0F1115',
  cScaleLabel2: '#0F1115',
  cScaleLabel3: '#0F1115',
  cScaleLabel4: '#0F1115',
  cScaleLabel5: '#0F1115',
  cScaleLabel6: '#0F1115',
  cScaleLabel7: '#0F1115',
  cScaleLabel8: '#0F1115',
  cScaleLabel9: '#0F1115',
  cScaleLabel10: '#0F1115',
  cScaleLabel11: '#0F1115',
  cScaleInv0: 'rgba(0,0,0,0.14)',
  cScaleInv1: 'rgba(0,0,0,0.14)',
  cScaleInv2: 'rgba(0,0,0,0.14)',
  cScaleInv3: 'rgba(0,0,0,0.14)',
  cScaleInv4: 'rgba(0,0,0,0.14)',
  cScaleInv5: 'rgba(0,0,0,0.14)',
  cScaleInv6: 'rgba(0,0,0,0.14)',
  cScaleInv7: 'rgba(0,0,0,0.14)',
  cScaleInv8: 'rgba(0,0,0,0.14)',
  cScaleInv9: 'rgba(0,0,0,0.14)',
  cScaleInv10: 'rgba(0,0,0,0.14)',
  cScaleInv11: 'rgba(0,0,0,0.14)',
  scaleLabelColor: '#0F1115',

  /* --- quadrant --------------------------------------------------------- */
  quadrant1Fill: '#F4F6F9',
  quadrant2Fill: '#EFF2F6',
  quadrant3Fill: '#F7F8FA',
  quadrant4Fill: '#F1F3F7',
  quadrant1TextFill: '#0F1115',
  quadrant2TextFill: '#0F1115',
  quadrant3TextFill: '#0F1115',
  quadrant4TextFill: '#0F1115',
  quadrantPointFill: '#4176E6',
  quadrantPointTextFill: '#0F1115',
  quadrantXAxisTextFill: '#61666B',
  quadrantYAxisTextFill: '#61666B',
  quadrantInternalBorderStrokeFill: 'rgba(0,0,0,0.10)',
  quadrantExternalBorderStrokeFill: 'rgba(0,0,0,0.16)',
  quadrantTitleFill: '#0F1115',

  /* --- xychart ---------------------------------------------------------- */
  xyChart: {
    backgroundColor: 'transparent',
    titleColor: '#0F1115',
    dataLabelColor: '#61666B',
    legendTextColor: '#61666B',
    xAxisTitleColor: '#61666B',
    xAxisLabelColor: '#61666B',
    xAxisTickColor: 'rgba(0,0,0,0.16)',
    xAxisLineColor: 'rgba(0,0,0,0.16)',
    yAxisTitleColor: '#61666B',
    yAxisLabelColor: '#61666B',
    yAxisTickColor: 'rgba(0,0,0,0.16)',
    yAxisLineColor: 'rgba(0,0,0,0.16)',
    plotColorPalette: '#7C9DE8,#93AEDD,#8A96A6,#B6C6DD,#5C6C82',
  },

  /* --- architecture / C4 / radar (newer diagram types) ------------------ */
  archEdgeColor: '#8A9099',
  archEdgeArrowColor: '#8A9099',
  archEdgeWidth: '2',
  archGroupBorderColor: 'rgba(0,0,0,0.16)',
  archGroupBorderWidth: '1.5px',
  personBkg: '#E9EFF8',
  personBorder: 'rgba(77,107,254,0.42)',
  radar: {
    axisColor: '#8A9099',
    axisStrokeWidth: 1,
    axisLabelFontSize: 12,
    graticuleColor: 'rgba(0,0,0,0.12)',
    graticuleOpacity: 0,
    graticuleStrokeWidth: 1,
    legendFontSize: 12,
    curveOpacity: 0.22,
    curveStrokeWidth: 2,
  },

  /* --- CSS that variables cannot reach ---------------------------------- */
  /* Appended AFTER the generated diagram CSS, so equal-specificity rules win.
   * Mermaid scopes these to the SVG's own id, and `securityLevel:'strict'`
   * keeps them: they are configuration, not diagram text. No child
   * combinators / `<` so Mermaid's config sanitiser can never drop the block. */
  themeCSS: `
  /* class diagrams: the stock sheet paints member text with nodeBorder when a
     diagram still uses SVG-text labels. Only fill is safe to override here:
     font-size/weight changes would desync Mermaid's text measurement and clip
     the label boxes (the HTML-label renderer already ships 14px text). */
  g.classGroup text { fill: #0F1115; stroke: none; }
  g.classGroup line { stroke: rgba(0,0,0,0.10); }
  .classLabel .box { fill: #FFFFFF; }
  .classLabel .label { fill: #0F1115; }

  /* state diagrams: same rule — fill only, never metrics */
  g.stateGroup text { fill: #0F1115; }
  g.stateGroup .state-title { fill: #0F1115; }
  .stateLabel text { fill: #0F1115; }
  .state-note text { fill: #0F1115; }

  /* journey: stock sheet hard-codes #333 label text / #999 face stroke.
     Task + section titles are injected with a white fill attribute and a
     config font-family, so both need CSS/config rescue. */
  .label text { fill: #0F1115; }
  text.task, text.journey-section { fill: #0F1115; }
  .face { stroke: rgba(0,0,0,0.18); }
  circle.actor-0, circle.actor-1, circle.actor-2,
  circle.actor-3, circle.actor-4, circle.actor-5 { stroke: rgba(0,0,0,0.18); }

  /* mindmap: the root paints with git0; keep the accent for git branches and
     give the root a quiet accent tint instead of a saturated fill */
  .section-root rect, .section-root path, .section-root circle, .section-root polygon { fill: #DCE6F7; }
  .section-root text, .section-root span { fill: #0F1115; color: #0F1115; }

  /* git graph: ids/messages keep the stock lightgrey */
  .commit-id, .commit-msg { fill: #5B6067; }
  .branch-label { font-size: 12px; }

  /* gantt: hairlines instead of the stock 2px task outline, quieter title */
  .task { stroke-width: 1px; }
  .taskText, .taskTextOutsideLeft, .taskTextOutsideRight { font-size: 12px; }
  .taskTextOutsideRight, .taskTextOutsideLeft { fill: #61666B !important; }
  .titleText { font-size: 15px; }
  .sectionTitle { font-size: 12px; }
  .grid .tick text { font-size: 11px; }

  /* timeline writes its title as a bare <text font-size="4ex"> (~29px); an
     attribute selector is the only stable hook for it */
  text[font-size="4ex"] { font-size: 16px; }

  /* heavy stock connectors: journey's activity rail, timeline's rail and the
     matching arrowheads are plain black SVG lines */
  line[stroke="black"] { stroke: rgba(0,0,0,0.14); stroke-width: 1.5px; }
  line.task-line { stroke: rgba(0,0,0,0.14); }
  marker path { fill: rgba(0,0,0,0.22); stroke: rgba(0,0,0,0.22); }
  .mouth { stroke: rgba(0,0,0,0.35); }

  /* git graph: 8px branch rails are too loud for a chat card */
  .arrow { stroke-width: 3px; }
  .commit-merge { fill: #FFFFFF; stroke: rgba(0,0,0,0.16); }

  /* packet: mermaid ships hard-coded #efefef cells with black rules */
  .packetBlock { fill: #EFF3F8; stroke: #8A9099; stroke-width: 1px; }
  .packetLabel { fill: #0F1115; font-size: 12px; }
  .packetTitle { fill: #0F1115; font-size: 14px; font-weight: 600; }
  .packetByte, .packetByte.start, .packetByte.end { fill: #61666B; }

  /* C4: white label text on the canonical palette; repaint text only */
  .c4-shape .label text,
  .c4-shape .label .text-outer-tspan,
  .c4-shape .label .text-inner-tspan { fill: #0F1115; }
  [stroke="#444444"] { stroke: #8A9099; }
  [fill="#444444"] { fill: #0F1115; }

  /* architecture-beta: built-in icons carry a hard-coded blue background */
  .architecture-service rect[width="80"] { fill: #4176E6 !important; }

  /* sankey: node fills are hard-coded attributes from the stock palette */
  .nodes g.node:nth-of-type(6n+1) rect { fill: #DCE4F0; stroke: #B4C2D8; }
  .nodes g.node:nth-of-type(6n+2) rect { fill: #E3E8F0; stroke: #C3CCDA; }
  .nodes g.node:nth-of-type(6n+3) rect { fill: #D3DDEA; stroke: #AEBED4; }
  .nodes g.node:nth-of-type(6n+4) rect { fill: #E8ECF2; stroke: #C9D1DC; }
  .nodes g.node:nth-of-type(6n+5) rect { fill: #D8E1EE; stroke: #B7C5DA; }
  .nodes g.node:nth-of-type(6n+6) rect { fill: #DFE5EE; stroke: #BEC9D9; }
  .node-labels text { fill: #0F1115; }

  /* radar: stock graticule is a filled grey disk, curves stroke their tint */
  .radarGraticule { fill: none; stroke: rgba(0,0,0,0.12); stroke-width: 1px; }
  .radarCurve-0, .radarCurve-1, .radarCurve-2, .radarCurve-3,
  .radarCurve-4, .radarCurve-5, .radarCurve-6, .radarCurve-7,
  .radarCurve-8, .radarCurve-9, .radarCurve-10, .radarCurve-11 { stroke: rgba(0,0,0,0.28); }
  .radarLegendBox-0, .radarLegendBox-1, .radarLegendBox-2, .radarLegendBox-3,
  .radarLegendBox-4, .radarLegendBox-5, .radarLegendBox-6, .radarLegendBox-7,
  .radarLegendBox-8, .radarLegendBox-9, .radarLegendBox-10, .radarLegendBox-11 { stroke: rgba(0,0,0,0.28); }

  /* journey: stock section/task borders are a hard-coded #666666 */
  .journey-section, [class*="task-type-"] { stroke: rgba(0,0,0,0.14); }
  /* journey faces: the eyes are hard-coded #666 circles */
  circle[fill="#666"], circle[stroke="#666"] { fill: #61666B; stroke: #61666B; }

  /* gantt: the d3 axis writes stroke="currentColor" on the grid tick lines */
  .grid .tick line, .grid path.domain { stroke: rgba(0,0,0,0.10); }

  /* sankey: the stock link layer blends with multiply */
  .links .link { mix-blend-mode: normal !important; }

  /* sequence autonumber discs: the stock text font is sans-serif */
  .sequenceNumber { font-family: ${FONT_STACK}; }

  /* block: labelled edges carry a hard-coded dark label stroke */
  .block .edgeLabel rect { fill: #F9FAFB; stroke: rgba(0,0,0,0.14); }
  .block .edgeLabel text, .block .edgeLabel span { fill: #0F1115; }

  /* gitGraph: HIGHLIGHT commits get a visible edge */
  .commit-highlight-outer { fill: #F9FAFB; stroke: rgba(0,0,0,0.14); }
  .commit-highlight-inner { fill: #E9EFF8; stroke: #4176E6; stroke-width: 1px; }

  /* treemap: cap the renderer's 38px leaf labels */
  .treemapLabel { font-size: 20px !important; }
  .treemapValue { font-size: 13px !important; }

  /* pie title follows the markdown heading weight, not the stock 400 */
  .pieTitleText { font-weight: 600; }

  /* gantt bars + mindmap/class corners follow the DSH radius ladder */
  rect.task { rx: 3px; ry: 3px; }
  .mindmap-node rect { rx: 6px; ry: 6px; }
  g.classGroup rect { rx: 4px; ry: 4px; }

  /* flowchart / er / sequence: soften stock geometry to DSH radii */
  .node rect { rx: 6px; ry: 6px; }
  .entityBox { rx: 6px; ry: 6px; }
  rect.actor { rx: 6px; ry: 6px; }
  .labelBox { rx: 4px; ry: 4px; }

  /* sequence: 1.5px signals read heavy at 660px; hairline them down */
  .messageLine0, .messageLine1 { stroke-width: 1.25px; }
  .actor-line { stroke-dasharray: 3 3; }
  `,
}

/* ------------------------------------------------------------------------- *
 * Dark
 * ------------------------------------------------------------------------- */

const DARK = {
  /* --- base ------------------------------------------------------------- */
  background: '#1B1B1C', // host card surface (neutral-bluish-900)
  darkMode: true,
  fontSize: '14px',
  fontFamily: FONT_STACK,
  useGradient: false,
  dropShadow: 'none',
  radius: 8,
  strokeWidth: 1,

  primaryColor: '#232324',
  primaryTextColor: '#EBEEF2', // neutral-bluish-100
  primaryBorderColor: 'rgba(255,255,255,0.16)',
  secondaryColor: '#1F1F22',
  secondaryTextColor: '#EBEEF2',
  secondaryBorderColor: 'rgba(255,255,255,0.10)',
  tertiaryColor: '#26272A',
  tertiaryTextColor: '#A8ADB6',
  tertiaryBorderColor: 'rgba(255,255,255,0.09)',

  textColor: '#EBEEF2',
  lineColor: '#8A9099',
  arrowheadColor: '#8A9099',
  titleColor: '#EBEEF2',
  errorBkgColor: '#3A2626',
  errorTextColor: '#F0A0A0',

  /* --- flowchart -------------------------------------------------------- */
  mainBkg: '#232324',
  nodeBkg: '#232324',
  nodeBorder: 'rgba(255,255,255,0.16)',
  nodeTextColor: '#EBEEF2',
  clusterBkg: '#1F1F22',
  clusterBorder: 'rgba(255,255,255,0.09)',
  defaultLinkColor: '#8A9099',
  edgeLabelBackground: '#1B1B1C',

  /* --- notes / callouts -------------------------------------------------- */
  noteBkgColor: '#26272A',
  noteTextColor: '#EBEEF2',
  noteBorderColor: 'rgba(255,255,255,0.14)',
  noteFontWeight: 'normal',
  border2: 'rgba(255,255,255,0.14)',

  /* --- sequence --------------------------------------------------------- */
  actorBkg: '#232324',
  actorBorder: 'rgba(255,255,255,0.16)',
  actorTextColor: '#EBEEF2',
  actorLineColor: 'rgba(255,255,255,0.14)',
  signalColor: '#8A9099',
  signalTextColor: '#EBEEF2',
  labelBoxBkgColor: '#2A2B2F',
  labelBoxBorderColor: 'rgba(255,255,255,0.14)',
  labelTextColor: '#A8ADB6',
  loopTextColor: '#EBEEF2',
  activationBkgColor: '#2E3034',
  activationBorderColor: 'rgba(255,255,255,0.22)',
  sequenceNumberColor: '#1B1B1C',
  rectBkgColor: '#242529',

  /* --- state ------------------------------------------------------------ */
  stateBkg: '#232324',
  stateBorder: 'rgba(255,255,255,0.16)',
  stateLabelColor: '#EBEEF2',
  labelBackgroundColor: '#1B1B1C',
  compositeBackground: '#1F1F22',
  altBackground: '#232326',
  compositeTitleBackground: '#2A2B2E',
  compositeBorder: 'rgba(255,255,255,0.12)',
  innerEndBackground: '#EBEEF2',
  specialStateColor: '#EBEEF2',
  transitionColor: '#8A9099',
  transitionLabelColor: '#EBEEF2',
  attributeBackgroundColorOdd: '#232325',
  attributeBackgroundColorEven: '#26262A',

  /* --- class ------------------------------------------------------------ */
  classText: '#EBEEF2',

  /* --- er --------------------------------------------------------------- */
  rowOdd: '#232325',
  rowEven: '#26262A',

  /* --- gantt ------------------------------------------------------------ */
  sectionBkgColor: '#2A2E36',
  altSectionBkgColor: '#232327',
  sectionBkgColor2: '#262A31',
  excludeBkgColor: '#26272A',
  taskBkgColor: '#2E3C52',
  taskBorderColor: '#44597A',
  taskTextColor: '#EBEEF2',
  taskTextOutsideColor: '#A8ADB6',
  taskTextDarkColor: '#EBEEF2',
  taskTextLightColor: '#EBEEF2',
  taskTextClickableColor: '#7AAAFF',
  activeTaskBkgColor: '#3A4B66',
  activeTaskBorderColor: '#5D7BA8',
  doneTaskBkgColor: '#2A2B2E',
  doneTaskBorderColor: '#44464B',
  critBkgColor: '#3A2A2C',
  critBorderColor: '#7E5658',
  todayLineColor: '#7AAAFF',
  vertLineColor: '#3F4045',
  gridColor: '#2C2D31',

  /* --- journey ---------------------------------------------------------- */
  faceColor: '#2A2C30',
  actor0: '#35383D',
  actor1: '#303338',
  actor2: '#3A3D42',
  actor3: '#33363B',
  actor4: '#373A3F',
  actor5: '#2E3136',
  fillType0: '#24262B',
  fillType1: '#262830',
  fillType2: '#232529',
  fillType3: '#272A31',
  fillType4: '#25272C',
  fillType5: '#282A30',
  fillType6: '#24262A',
  fillType7: '#26292E',

  /* --- pie -------------------------------------------------------------- */
  pie1: '#6E92D8',
  pie2: '#8FA6C7',
  pie3: '#AEBCCD',
  pie4: '#5E7699',
  pie5: '#9FB0C6',
  pie6: '#4F6FA8',
  pie7: '#8296B1',
  pie8: '#B8C4D2',
  pie9: '#6E819C',
  pie10: '#33404F',
  pie11: '#8A9DB8',
  pie12: '#55657E',
  pieTitleTextSize: '15px',
  pieTitleTextColor: '#EBEEF2',
  pieSectionTextSize: '12px',
  pieSectionTextColor: '#EBEEF2',
  pieLegendTextSize: '12px',
  pieLegendTextColor: '#A8ADB6',
  pieStrokeColor: '#1B1B1C',
  pieStrokeWidth: '2px',
  pieOuterStrokeWidth: '1px',
  pieOuterStrokeColor: 'rgba(255,255,255,0.14)',
  pieOpacity: 1,

  /* --- git graph -------------------------------------------------------- */
  git0: '#7AAAFF',
  git1: '#9AA6B5',
  git2: '#8FB0D8',
  git3: '#A9B5C4',
  git4: '#B8C2CE',
  git5: '#8494A8',
  git6: '#C3CBD5',
  git7: '#A0AEBF',
  gitInv0: '#1B1B1C',
  gitInv1: '#1B1B1C',
  gitInv2: '#1B1B1C',
  gitInv3: '#1B1B1C',
  gitInv4: '#1B1B1C',
  gitInv5: '#1B1B1C',
  gitInv6: '#1B1B1C',
  gitInv7: '#1B1B1C',
  branchLabelColor: '#EBEEF2',
  gitBranchLabel0: '#0F1115',
  gitBranchLabel1: '#0F1115',
  gitBranchLabel2: '#0F1115',
  gitBranchLabel3: '#0F1115',
  gitBranchLabel4: '#0F1115',
  gitBranchLabel5: '#0F1115',
  gitBranchLabel6: '#0F1115',
  gitBranchLabel7: '#0F1115',
  commitLineColor: '#3F4045',
  commitLabelColor: '#A8ADB6',
  commitLabelBackground: '#1B1B1C',
  commitLabelFontSize: '11px',
  tagLabelColor: '#EBEEF2',
  tagLabelBackground: '#2A2C30',
  tagLabelBorder: 'rgba(255,255,255,0.14)',
  tagLabelFontSize: '11px',

  /* --- timeline / mindmap ----------------------------------------------- */
  cScale0: '#2E3746',
  cScale1: '#333A43',
  cScale2: '#2B3442',
  cScale3: '#363B43',
  cScale4: '#303A4A',
  cScale5: '#343A42',
  cScale6: '#2C3544',
  cScale7: '#373C44',
  cScale8: '#2F3948',
  cScale9: '#353A42',
  cScale10: '#2D3645',
  cScale11: '#363B44',
  cScaleLabel0: '#EBEEF2',
  cScaleLabel1: '#EBEEF2',
  cScaleLabel2: '#EBEEF2',
  cScaleLabel3: '#EBEEF2',
  cScaleLabel4: '#EBEEF2',
  cScaleLabel5: '#EBEEF2',
  cScaleLabel6: '#EBEEF2',
  cScaleLabel7: '#EBEEF2',
  cScaleLabel8: '#EBEEF2',
  cScaleLabel9: '#EBEEF2',
  cScaleLabel10: '#EBEEF2',
  cScaleLabel11: '#EBEEF2',
  cScaleInv0: 'rgba(255,255,255,0.14)',
  cScaleInv1: 'rgba(255,255,255,0.14)',
  cScaleInv2: 'rgba(255,255,255,0.14)',
  cScaleInv3: 'rgba(255,255,255,0.14)',
  cScaleInv4: 'rgba(255,255,255,0.14)',
  cScaleInv5: 'rgba(255,255,255,0.14)',
  cScaleInv6: 'rgba(255,255,255,0.14)',
  cScaleInv7: 'rgba(255,255,255,0.14)',
  cScaleInv8: 'rgba(255,255,255,0.14)',
  cScaleInv9: 'rgba(255,255,255,0.14)',
  cScaleInv10: 'rgba(255,255,255,0.14)',
  cScaleInv11: 'rgba(255,255,255,0.14)',
  scaleLabelColor: '#EBEEF2',

  /* --- quadrant --------------------------------------------------------- */
  quadrant1Fill: '#202126',
  quadrant2Fill: '#1E1F24',
  quadrant3Fill: '#222328',
  quadrant4Fill: '#1F2125',
  quadrant1TextFill: '#EBEEF2',
  quadrant2TextFill: '#EBEEF2',
  quadrant3TextFill: '#EBEEF2',
  quadrant4TextFill: '#EBEEF2',
  quadrantPointFill: '#7AAAFF',
  quadrantPointTextFill: '#EBEEF2',
  quadrantXAxisTextFill: '#A8ADB6',
  quadrantYAxisTextFill: '#A8ADB6',
  quadrantInternalBorderStrokeFill: 'rgba(255,255,255,0.10)',
  quadrantExternalBorderStrokeFill: 'rgba(255,255,255,0.16)',
  quadrantTitleFill: '#EBEEF2',

  /* --- xychart ---------------------------------------------------------- */
  xyChart: {
    backgroundColor: 'transparent',
    titleColor: '#EBEEF2',
    dataLabelColor: '#A8ADB6',
    legendTextColor: '#A8ADB6',
    xAxisTitleColor: '#A8ADB6',
    xAxisLabelColor: '#A8ADB6',
    xAxisTickColor: 'rgba(255,255,255,0.16)',
    xAxisLineColor: 'rgba(255,255,255,0.16)',
    yAxisTitleColor: '#A8ADB6',
    yAxisLabelColor: '#A8ADB6',
    yAxisTickColor: 'rgba(255,255,255,0.16)',
    yAxisLineColor: 'rgba(255,255,255,0.16)',
    plotColorPalette: '#6F92D8,#8FA6C7,#9AA6B5,#4F6FA8,#B8C2CE',
  },

  /* --- architecture / C4 / radar (newer diagram types) ------------------ */
  archEdgeColor: '#8A9099',
  archEdgeArrowColor: '#8A9099',
  archEdgeWidth: '2',
  archGroupBorderColor: 'rgba(255,255,255,0.18)',
  archGroupBorderWidth: '1.5px',
  personBkg: '#23262E',
  personBorder: 'rgba(255,255,255,0.24)',
  radar: {
    axisColor: '#8A9099',
    axisStrokeWidth: 1,
    axisLabelFontSize: 12,
    graticuleColor: 'rgba(255,255,255,0.12)',
    graticuleOpacity: 0,
    graticuleStrokeWidth: 1,
    legendFontSize: 12,
    curveOpacity: 0.22,
    curveStrokeWidth: 2,
  },

  themeCSS: `
  g.classGroup text { fill: #EBEEF2; stroke: none; }
  g.classGroup line { stroke: rgba(255,255,255,0.12); }
  .classLabel .box { fill: #232324; }
  .classLabel .label { fill: #EBEEF2; }

  g.stateGroup text { fill: #EBEEF2; }
  g.stateGroup .state-title { fill: #EBEEF2; }
  .stateLabel text { fill: #EBEEF2; }
  .state-note text { fill: #EBEEF2; }

  .label text { fill: #EBEEF2; }
  text.task, text.journey-section { fill: #EBEEF2; }
  .face { stroke: rgba(255,255,255,0.18); }
  circle.actor-0, circle.actor-1, circle.actor-2,
  circle.actor-3, circle.actor-4, circle.actor-5 { stroke: rgba(255,255,255,0.18); }

  .section-root rect, .section-root path, .section-root circle, .section-root polygon { fill: #2C3A55; }
  .section-root text, .section-root span { fill: #EBEEF2; color: #EBEEF2; }

  .commit-id, .commit-msg { fill: #A8ADB6; }
  .branch-label { font-size: 12px; }

  .task { stroke-width: 1px; }
  .taskText, .taskTextOutsideLeft, .taskTextOutsideRight { font-size: 12px; }
  .taskTextOutsideRight, .taskTextOutsideLeft { fill: #A8ADB6 !important; }
  .titleText { font-size: 15px; }
  .sectionTitle { font-size: 12px; }
  .grid .tick text { font-size: 11px; }

  text[font-size="4ex"] { font-size: 16px; }

  line[stroke="black"] { stroke: rgba(255,255,255,0.14); stroke-width: 1.5px; }
  line.task-line { stroke: rgba(255,255,255,0.14); }
  marker path { fill: rgba(255,255,255,0.22); stroke: rgba(255,255,255,0.22); }
  .mouth { stroke: rgba(255,255,255,0.35); }

  .arrow { stroke-width: 3px; }
  .commit-merge { fill: #232324; stroke: rgba(255,255,255,0.16); }

  /* packet: mermaid ships hard-coded #efefef cells with black rules */
  .packetBlock { fill: #23262C; stroke: #8A9099; stroke-width: 1px; }
  .packetLabel { fill: #EBEEF2; font-size: 12px; }
  .packetTitle { fill: #EBEEF2; font-size: 14px; font-weight: 600; }
  .packetByte, .packetByte.start, .packetByte.end { fill: #A8ADB6; }

  /* C4: white label text on the canonical palette; repaint text only */
  .c4-shape .label text,
  .c4-shape .label .text-outer-tspan,
  .c4-shape .label .text-inner-tspan { fill: #EBEEF2; }
  [stroke="#444444"] { stroke: #8A9099; }
  [fill="#444444"] { fill: #EBEEF2; }

  /* architecture-beta: built-in icons carry a hard-coded blue background */
  .architecture-service rect[width="80"] { fill: #4176E6 !important; }

  /* sankey: node fills are hard-coded attributes from the stock palette */
  .nodes g.node:nth-of-type(6n+1) rect { fill: #2E3746; stroke: #4A5668; }
  .nodes g.node:nth-of-type(6n+2) rect { fill: #333A43; stroke: #4F5764; }
  .nodes g.node:nth-of-type(6n+3) rect { fill: #2B3442; stroke: #465365; }
  .nodes g.node:nth-of-type(6n+4) rect { fill: #363B43; stroke: #525864; }
  .nodes g.node:nth-of-type(6n+5) rect { fill: #303A4A; stroke: #4B596D; }
  .nodes g.node:nth-of-type(6n+6) rect { fill: #343A42; stroke: #505763; }
  .node-labels text { fill: #EBEEF2; }

  /* radar: stock graticule is a filled grey disk, curves stroke their tint */
  .radarGraticule { fill: none; stroke: rgba(255,255,255,0.12); stroke-width: 1px; }
  .radarCurve-0, .radarCurve-1, .radarCurve-2, .radarCurve-3,
  .radarCurve-4, .radarCurve-5, .radarCurve-6, .radarCurve-7,
  .radarCurve-8, .radarCurve-9, .radarCurve-10, .radarCurve-11 { stroke: rgba(255,255,255,0.36); }
  .radarLegendBox-0, .radarLegendBox-1, .radarLegendBox-2, .radarLegendBox-3,
  .radarLegendBox-4, .radarLegendBox-5, .radarLegendBox-6, .radarLegendBox-7,
  .radarLegendBox-8, .radarLegendBox-9, .radarLegendBox-10, .radarLegendBox-11 { stroke: rgba(255,255,255,0.36); }

  /* journey: stock section/task borders are a hard-coded #666666 */
  .journey-section, [class*="task-type-"] { stroke: rgba(255,255,255,0.14); }
  /* journey faces: the eyes are hard-coded #666 circles */
  circle[fill="#666"], circle[stroke="#666"] { fill: #A8ADB6; stroke: #A8ADB6; }

  /* gantt: the d3 axis writes stroke="currentColor" on the grid tick lines */
  .grid .tick line, .grid path.domain { stroke: rgba(255,255,255,0.14); }

  /* sankey: the stock link layer blends with multiply */
  .links .link { mix-blend-mode: normal !important; }

  /* sequence autonumber discs: the stock text font is sans-serif */
  .sequenceNumber { font-family: ${FONT_STACK}; }

  /* gitGraph: HIGHLIGHT commits get a visible edge */
  .commit-highlight-outer { fill: #1B1B1C; stroke: rgba(255,255,255,0.18); }
  .commit-highlight-inner { fill: #262A33; stroke: #8A9099; stroke-width: 1px; }

  /* block: labelled edges carry a hard-coded dark label stroke */
  .block .edgeLabel rect { fill: #1B1B1C; stroke: rgba(255,255,255,0.14); }
  .block .edgeLabel text, .block .edgeLabel span { fill: #EBEEF2; }

  /* treemap: cap the renderer's 38px leaf labels */
  .treemapLabel { font-size: 20px !important; }
  .treemapValue { font-size: 13px !important; }

  .pieTitleText { font-weight: 600; }

  rect.task { rx: 3px; ry: 3px; }
  .mindmap-node rect { rx: 6px; ry: 6px; }
  g.classGroup rect { rx: 4px; ry: 4px; }

  .node rect { rx: 6px; ry: 6px; }
  .entityBox { rx: 6px; ry: 6px; }
  rect.actor { rx: 6px; ry: 6px; }
  .labelBox { rx: 4px; ry: 4px; }

  .messageLine0, .messageLine1 { stroke-width: 1.25px; }
  .actor-line { stroke-dasharray: 3 3; }
  `,
}

/* ------------------------------------------------------------------------- *
 * Exports
 * ------------------------------------------------------------------------- */

/** `theme:'base'` + DSH-native variables, per scheme. */
const QUIET_THEMES = {
  light: { theme: 'base', themeVariables: LIGHT, themeCSS: LIGHT.themeCSS },
  dark: { theme: 'base', themeVariables: DARK, themeCSS: DARK.themeCSS },
}

/* ------------------------------------------------------------------------- *
 * C4 helpers (context / container / component)
 *
 * Mermaid's C4 renderer paints every box with an inline `!important` style
 * whose colours come from the `c4` diagram config, not from themeVariables —
 * so the only way to theme C4 is to hand it palette values.
 * ------------------------------------------------------------------------- */

/** Element types the C4 renderer knows; each has bg/border config keys. */
const C4_ELEMENT_TYPES = ['person', 'system', 'system_db', 'system_queue', 'container', 'container_db', 'container_queue', 'component', 'component_db', 'component_queue']

/** Every C4 type also has an `external_` twin. */
const C4_ALL_TYPES = C4_ELEMENT_TYPES.flatMap((type) => [type, `external_${type}`])

/** C4 config keys that accept a font family. */
const C4_FONT_KEYS = [...C4_ALL_TYPES, 'boundary', 'message']

/** Pastel hue for each C4 element family (externals stay neutral). */
const C4_HUE = {
  person: 'purple',
  system: 'blue',
  system_db: 'blue',
  system_queue: 'blue',
  container: 'green',
  container_db: 'green',
  container_queue: 'green',
  component: 'orange',
  component_db: 'orange',
  component_queue: 'orange',
}

/**
 * Diagram-type config that themeVariables cannot express: the font bridge,
 * density, and the per-diagram sizing knobs. Spread this into the same
 * `initialize()` call as the chosen theme.
 */
const CONFIG = {
  fontFamily: FONT_STACK, // must be concrete: Mermaid measures text off-canvas
  useMaxWidth: true,
  look: 'classic',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 12,
    nodeSpacing: 32,
    rankSpacing: 36,
    diagramPadding: 6,
    useMaxWidth: true,
  },
  sequence: {
    useMaxWidth: true,
    diagramMarginX: 10,
    diagramMarginY: 8,
    actorMargin: 36,
    width: 122,
    height: 44,
    boxMargin: 8,
    boxTextMargin: 4,
    noteMargin: 8,
    messageMargin: 26,
    bottomMarginAdj: 2,
    wrap: true,
    actorFontSize: 14,
    actorFontWeight: 500,
    noteFontSize: 13,
    messageFontSize: 13,
  },
  class: {
    useMaxWidth: true,
    htmlLabels: true,
    hideEmptyMembersBox: true,
  },
  state: {
    useMaxWidth: true,
    padding: 8,
  },
  er: {
    useMaxWidth: true,
    diagramPadding: 8,
    minEntityWidth: 96,
    minEntityHeight: 60,
    entityPadding: 12,
    fontSize: 13,
  },
  gantt: {
    // Gantt sizes itself from the temp render container (the page <body>, not
    // the chat column), so pin it to the reading column. Deprecated but the
    // only supported width knob in 11.x.
    useWidth: 660,
    useMaxWidth: true,
    axisFormat: '%m-%d',
    titleTopMargin: 16,
    barHeight: 20,
    barGap: 4,
    topPadding: 34,
    leftPadding: 64,
    gridLineStartPadding: 24,
    fontSize: 12,
    sectionFontSize: 12,
    numberSectionStyles: 3,
  },
  pie: {
    useMaxWidth: true,
    textPosition: 0.62,
  },
  journey: {
    useMaxWidth: true,
    diagramMarginX: 8,
    diagramMarginY: 8,
    leftMargin: 56,
    width: 92,
    height: 42,
    taskMargin: 12,
    boxMargin: 8,
    boxTextMargin: 4,
    noteMargin: 8,
    messageMargin: 20,
    /* A number, not '13px': mermaid computes `i * taskFontSize` for multi-line
       task labels, and `2 * '13px'` is NaN, which silently drops the line
       offsets and stacks the lines on top of each other. */
    taskFontSize: 13,
    taskFontFamily: FONT_STACK,
    actorFontSize: 12,
    titleFontFamily: FONT_STACK,
    titleFontSize: '16px',
  },
  mindmap: {
    useMaxWidth: true,
    padding: 6,
    maxNodeWidth: 170,
  },
  timeline: {
    useMaxWidth: true,
    padding: 6,
    leftMargin: 16,
    diagramMarginX: 24,
    taskFontSize: '12px',
    taskFontFamily: FONT_STACK,
  },
  gitGraph: {
    useMaxWidth: true,
    rotateCommitLabel: true,
    showBranches: true,
    showCommitLabel: true,
    mainBranchName: 'main',
  },
  quadrantChart: {
    useMaxWidth: true,
    chartWidth: 400,
    chartHeight: 400,
    titleFontSize: 14,
    quadrantLabelFontSize: 12,
    pointLabelFontSize: 12,
    xAxisLabelFontSize: 12,
    yAxisLabelFontSize: 12,
  },
  xyChart: {
    useMaxWidth: true,
    width: 600,
    height: 320,
    titleFontSize: 15,
    titlePadding: 8,
    legendFontSize: 11,
    showDataLabel: false,
    xAxis: { labelFontSize: 11, titleFontSize: 12, tickWidth: 1, axisLineWidth: 1, tickLength: 4 },
    yAxis: { labelFontSize: 11, titleFontSize: 12, tickWidth: 1, axisLineWidth: 1, tickLength: 4 },
  },
  /* C4: fonts + density. Colours are scheme-dependent (see schemeConfig). */
  c4: {
    useMaxWidth: true,
    diagramMarginX: 40,
    diagramMarginY: 8,
    c4ShapeMargin: 40,
    c4ShapePadding: 16,
    boxMargin: 8,
    c4ShapeInRow: 4,
    c4BoundaryInRow: 2,
    ...Object.fromEntries(C4_FONT_KEYS.map((key) => [`${key}FontFamily`, FONT_STACK])),
    ...Object.fromEntries(C4_FONT_KEYS.filter((key) => key !== 'message').map((key) => [`${key}FontSize`, 14])),
    messageFontSize: 12,
  },
  /* architecture-beta: edges/groups are theme variables; these are layout. */
  architecture: {
    useMaxWidth: true,
    iconSize: 64,
    padding: 28,
    fontSize: 14,
    nodeSeparation: 60,
  },
  /* sankey-beta: colours come from `sankey.nodeColors` (CSS cycles node fills)
     and `sankey.linkColor` (scheme-dependent, neutral). */
  sankey: {
    useMaxWidth: true,
    width: 600,
    height: 400,
    showValues: true,
    nodeWidth: 12,
    nodePadding: 16,
  },
  /* radar-beta: sizes only; colours are themeVariables.radar + themeCSS. */
  radar: {
    useMaxWidth: true,
    width: 520,
    height: 520,
    marginTop: 40,
    marginRight: 40,
    marginBottom: 40,
    marginLeft: 40,
  },
  /* Newer beta diagram types: keep them inside the reading column. */
  packet: { useMaxWidth: true },
  block: { useMaxWidth: true, padding: 8 },
}

/**
 * Scheme-dependent diagram config. Most diagram config is scheme-neutral, but
 * Journey paints its section bands from `journey.sectionFills` (a config array,
 * not a theme variable — the stock defaults are navy/indigo/magenta), so those
 * have to switch with the theme.
 */
const QUIET_SCHEME_CONFIG = {
  light: {
    journey: {
      sectionFills: ['#E9EFF8', '#E4EAF4', '#EFF2F7', '#E7EDF6', '#EBF0F7', '#E6EBF3', '#EDF1F6'],
      sectionColours: ['#0F1115'],
      actorColours: ['#EFF2F6', '#E9EDF3', '#F2F4F7', '#EAEFF5', '#F0F3F6', '#E7ECF2'],
    },
    c4: c4ConfigFor(quietPalette('light')),
    sankey: { linkColor: 'gradient' },
  },
  dark: {
    journey: {
      sectionFills: ['#262A31', '#23272E', '#2A2E36', '#252932', '#282C33', '#242830', '#292D34'],
      sectionColours: ['#EBEEF2'],
      actorColours: ['#35383D', '#303338', '#3A3D42', '#33363B', '#373A3F', '#2E3136'],
    },
    c4: c4ConfigFor(quietPalette('dark')),
    sankey: { linkColor: 'gradient' },
  },
}

/* ------------------------------------------------------------------------- *
 * Apple variant (default)
 *
 * Apple HIG system colours, pastel node tints, vivid data-viz ramps. The parts
 * Mermaid has no variables for are generated in `themeCSS`: per-node hue
 * cycling, sequence number discs, git branch chips, gantt bar labels, pie
 * percentage halo, mindmap root, kanban columns, quadrant points.
 * ------------------------------------------------------------------------- */

const APPLE_LIGHT = {
  mode: 'light',
  card: '#F9FAFB',
  fill: '#F5F5F7',
  separator: '#D2D2D7',
  hairline: 'rgba(0,0,0,0.14)',
  label: { primary: '#1D1D1F', secondary: '#6E6E73', tertiary: '#8E8E93' },
  edge: '#8E8E93',
  sys: {
    blue: '#007AFF',
    green: '#34C759',
    orange: '#FF9500',
    pink: '#FF2D55',
    purple: '#AF52DE',
    teal: '#30B0C7',
    indigo: '#5856D6',
    yellow: '#FFCC00',
    red: '#FF3B30',
    mint: '#00C7BE',
    brown: '#A2845E',
    gray: '#8E8E93',
  },
  tint: {
    blue: '#D6EAFF',
    green: '#D2F5DE',
    orange: '#FFE8CC',
    pink: '#FFD9E2',
    purple: '#EBD8FA',
    teal: '#D0F0F5',
    indigo: '#DDE0FF',
    yellow: '#FFF2BF',
    red: '#FFDAD6',
    mint: '#CFF5F2',
    brown: '#F0E6D8',
    gray: '#EFEFF4',
  },
  /** Slightly paler companion tint (ER alternating rows). */
  tintAlt: {
    blue: '#EDF6FF',
    green: '#ECFAF1',
    orange: '#FFF6EA',
    pink: '#FFEFF3',
    purple: '#F6EEFE',
    teal: '#EAFAFC',
    indigo: '#F0F1FF',
    yellow: '#FFFAE2',
    red: '#FFEFED',
    mint: '#EAFBF9',
    brown: '#F8F3EC',
    gray: '#F7F7FA',
  },
  /** Deep accent for fills that must carry white text. */
  deepBlue: '#0066D6',
  /** Text on a vivid (active) gantt bar. */
  activeText: '#FFFFFF',
  softBg: '#F5F5F7',
  darkTint: false,
}

/** Dark: iOS/macOS dark-mode system colours on tinted dark surfaces. */
const APPLE_DARK = {
  mode: 'dark',
  card: '#1B1B1C',
  fill: '#1F1F22',
  separator: 'rgba(255,255,255,0.14)',
  hairline: 'rgba(255,255,255,0.18)',
  label: { primary: '#F5F5F7', secondary: '#A1A1A6', tertiary: '#8E8E93' },
  edge: '#98989D',
  sys: {
    blue: '#0A84FF',
    green: '#30D158',
    orange: '#FF9F0A',
    pink: '#FF375F',
    purple: '#BF5AF2',
    teal: '#40C8E0',
    indigo: '#5E5CE6',
    yellow: '#FFD60A',
    red: '#FF453A',
    mint: '#63E6E2',
    brown: '#AC8E68',
    gray: '#98989D',
  },
  tint: {
    blue: '#14325B',
    green: '#123B26',
    orange: '#4A3115',
    pink: '#4A1F2E',
    purple: '#3A2255',
    teal: '#143C44',
    indigo: '#25295E',
    yellow: '#4A3F12',
    red: '#4A1F1C',
    mint: '#123D3B',
    brown: '#3A2E22',
    gray: '#2C2C2E',
  },
  tintAlt: {
    blue: '#193A68',
    green: '#174630',
    orange: '#563A1C',
    pink: '#582839',
    purple: '#452B63',
    teal: '#1A4751',
    indigo: '#2E3370',
    yellow: '#574B1B',
    red: '#582723',
    mint: '#184944',
    brown: '#46382A',
    gray: '#333336',
  },
  /** Deep blue that carries white text (mindmap root); #0A84FF is too light. */
  deepBlue: '#0066D6',
  /** #1D1D1F on #0A84FF = 4.6:1, white does not reach 4.5 on iOS dark blue. */
  activeText: '#1D1D1F',
  softBg: '#232324',
  darkTint: true,
}

/** Node hue order used by the themeCSS nth-of-type cycle. */
const NODE_CYCLE = ['blue', 'green', 'orange', 'pink', 'purple', 'teal']

/* ------------------------------------------------------------------------- *
 * themeVariables (factory keeps light/dark in lockstep)
 * ------------------------------------------------------------------------- */

/**
 * @param {typeof APPLE_LIGHT} p
 */
const makeThemeVariables = (rawPalette) => {
  const p = withSemantic(rawPalette)
  const white = '#FFFFFF'
  const isDark = p.mode === 'dark'
  const nodeFill = p.nodeFill ?? (isDark ? '#232324' : white)
  const rowAlt = p.rowAlt ?? (isDark ? '#26262A' : '#F7F7FA')
  const text = p.label.primary
  const secondary = p.label.secondary

  return {
    /* --- base ----------------------------------------------------------- */
    background: p.card,
    darkMode: isDark,
    fontSize: '14px',
    fontFamily: FONT_STACK,
    useGradient: false,
    dropShadow: 'none',
    radius: p.radius ?? 8,
    strokeWidth: 1,

    primaryColor: p.tint.blue,
    primaryTextColor: text,
    primaryBorderColor: p.sys.blue,
    secondaryColor: p.tint.green,
    secondaryTextColor: text,
    secondaryBorderColor: p.sys.green,
    tertiaryColor: p.tint.orange,
    tertiaryTextColor: text,
    tertiaryBorderColor: p.sys.orange,

    textColor: text,
    lineColor: p.edge,
    arrowheadColor: p.edge,
    titleColor: text,
    errorBkgColor: p.tint.red,
    errorTextColor: p.sys.red,
    border2: p.separator,

    /* --- flowchart ------------------------------------------------------ */
    mainBkg: nodeFill,
    nodeBkg: nodeFill,
    nodeBorder: p.hairline,
    nodeTextColor: text,
    clusterBkg: p.fill,
    clusterBorder: p.separator,
    defaultLinkColor: p.edge,
    edgeLabelBackground: p.card,

    /* --- notes / callouts ---------------------------------------------- */
    noteBkgColor: p.yellowTint ?? p.tint.yellow,
    noteTextColor: text,
    noteBorderColor: p.yellowEdge ?? p.sys.yellow,
    noteFontWeight: 'normal',

    /* --- sequence ------------------------------------------------------- */
    actorBkg: p.tint.blue,
    actorBorder: p.sys.blue,
    actorTextColor: text,
    actorLineColor: p.separator,
    signalColor: p.edge,
    signalTextColor: text,
    labelBoxBkgColor: p.tint.purple,
    labelBoxBorderColor: p.sys.purple,
    labelTextColor: p.labelText ?? (isDark ? '#EBD8FA' : '#6B2E9C'),
    loopTextColor: text,
    activationBkgColor: p.tint.blue,
    activationBorderColor: p.sys.blue,
    sequenceNumberColor: white,
    rectBkgColor: p.tint.green,

    /* --- state ---------------------------------------------------------- */
    stateBkg: nodeFill,
    stateBorder: p.hairline,
    stateLabelColor: text,
    labelBackgroundColor: p.card,
    compositeBackground: p.card,
    altBackground: p.tint.yellow,
    compositeTitleBackground: p.tint.indigo,
    compositeBorder: p.sys.indigo,
    innerEndBackground: text,
    specialStateColor: p.sys.blue,
    transitionColor: p.edge,
    transitionLabelColor: text,
    attributeBackgroundColorOdd: nodeFill,
    attributeBackgroundColorEven: rowAlt,

    /* --- class / er ----------------------------------------------------- */
    classText: text,
    rowOdd: nodeFill,
    rowEven: rowAlt,

    /* --- gantt ---------------------------------------------------------- */
    /* Section bands are drawn at `opacity: 0.2` by mermaid's gantt sheet, so a
       saturated hue lands as a wash that the task bar (a 16% tint at 100%) sits
       inside at 1.05:1 — the bar dissolves into its own band. Bands are
       structure, bars are data: keep the bands neutral and let the bars carry
       the colour. */
    sectionBkgColor: p.rowAlt,
    altSectionBkgColor: p.fill,
    sectionBkgColor2: p.rowAlt,
    excludeBkgColor: p.fill,
    taskBkgColor: p.taskBkg ?? (isDark ? '#1F3A5E' : '#CFE5FF'),
    taskBorderColor: p.sys.blue,
    taskTextColor: text,
    taskTextOutsideColor: p.textOutside ?? (isDark ? secondary : '#636366'),
    taskTextDarkColor: text,
    taskTextLightColor: white,
    taskTextClickableColor: p.sys.blue,
    /* `deepBlue` is a *text* accent — it exists so white labels can sit on it.
       Used as a bar fill it was the only near-black object in the chart (15.9:1
       against a card whose other bar classes sit at 1.18-1.31:1) and, with the
       border set to the same value, it also lost its outline. Active is now
       simply the task blue pushed one step, which is how done/crit already
       work. */
    activeTaskBkgColor: p.sys.blue,
    activeTaskBorderColor: p.deepBlue,
    doneTaskBkgColor: p.tintStrong?.green ?? p.tint.green,
    doneTaskBorderColor: p.sys.green,
    critBkgColor: p.tintStrong?.red ?? p.tint.red,
    critBorderColor: p.sys.red,
    todayLineColor: p.sys.red,
    vertLineColor: p.separator,
    gridColor: p.separator,

    /* --- journey -------------------------------------------------------- */
    /* The score faces were painted in the card surface itself — 1.01:1, i.e.
       invisible discs with only a 1px stroke. A face has to read as a filled
       disc, so it gets a neutral tint one step stronger than the surface. */
    faceColor: p.tintStrong?.gray ?? p.fill,
    /* Actor dots: 16% tints measured 1.20:1 and, because a CSS fill beats the
       renderer's fill attribute, these variables silently overrode the stronger
       `journey.actorColours` the scheme config also sets. Solid hues make the
       actor identity readable and stop the config array being dead code. */
    actor0: p.solid?.blue ?? p.tint.blue,
    actor1: p.solid?.green ?? p.tint.green,
    actor2: p.solid?.orange ?? p.tint.orange,
    actor3: p.solid?.pink ?? p.tint.pink,
    actor4: p.solid?.purple ?? p.tint.purple,
    actor5: p.solid?.teal ?? p.tint.teal,

    /* --- pie (vivid Apple ramp; white % labels carry a themeCSS halo) --- */
    pie1: p.solid?.blue ?? p.sys.blue,
    pie2: p.solid?.green ?? p.sys.green,
    pie3: p.solid?.orange ?? p.sys.orange,
    pie4: p.solid?.pink ?? p.sys.pink,
    pie5: p.solid?.purple ?? p.sys.purple,
    pie6: p.solid?.teal ?? p.sys.teal,
    pie7: p.solid?.indigo ?? p.sys.indigo,
    pie8: p.solid?.yellow ?? p.vividYellow ?? p.sys.yellow,
    pie9: p.solid?.red ?? p.sys.red,
    pie10: p.solid?.mint ?? p.sys.mint,
    pie11: p.solid?.brown ?? p.sys.brown,
    pie12: p.solid?.gray ?? p.sys.gray,
    pieTitleTextSize: '15px',
    pieTitleTextColor: text,
    pieSectionTextSize: '12px',
    pieSectionTextColor: white,
    pieLegendTextSize: '12px',
    pieLegendTextColor: secondary,
    pieStrokeColor: p.card,
    pieStrokeWidth: '2px',
    pieOuterStrokeWidth: '1px',
    pieOuterStrokeColor: p.separator,
    pieOpacity: 1,

    /* --- git graph ------------------------------------------------------ */
    git0: p.sys.blue,
    git1: p.sys.green,
    git2: p.sys.orange,
    git3: p.sys.pink,
    git4: p.sys.purple,
    git5: p.sys.teal,
    git6: p.sys.indigo,
    git7: p.sys.red,
    gitInv0: p.card,
    gitInv1: p.card,
    gitInv2: p.card,
    gitInv3: p.card,
    gitInv4: p.card,
    gitInv5: p.card,
    gitInv6: p.card,
    gitInv7: p.card,
    branchLabelColor: text,
    gitBranchLabel0: text,
    gitBranchLabel1: text,
    gitBranchLabel2: text,
    gitBranchLabel3: text,
    gitBranchLabel4: text,
    gitBranchLabel5: text,
    gitBranchLabel6: text,
    gitBranchLabel7: text,
    commitLineColor: p.separator,
    commitLabelColor: secondary,
    commitLabelBackground: p.card,
    commitLabelFontSize: '11px',
    tagLabelColor: text,
    tagLabelBackground: p.yellowTint ?? p.tint.yellow,
    tagLabelBorder: p.yellowEdge ?? p.sys.yellow,
    tagLabelFontSize: '11px',

    /* --- timeline / mindmap --------------------------------------------- */
    cScale0: p.tint.blue,
    cScale1: p.tint.green,
    cScale2: p.tint.orange,
    cScale3: p.tint.pink,
    cScale4: p.tint.purple,
    cScale5: p.tint.teal,
    cScale6: p.tint.indigo,
    cScale7: p.yellowTint ?? p.tint.yellow,
    cScale8: p.tint.red,
    cScale9: p.tint.mint,
    cScale10: p.tint.brown,
    cScale11: p.tint.gray,
    cScaleLabel0: text,
    cScaleLabel1: text,
    cScaleLabel2: text,
    cScaleLabel3: text,
    cScaleLabel4: text,
    cScaleLabel5: text,
    cScaleLabel6: text,
    cScaleLabel7: text,
    cScaleLabel8: text,
    cScaleLabel9: text,
    cScaleLabel10: text,
    cScaleLabel11: text,
    cScaleInv0: p.edge,
    cScaleInv1: p.edge,
    cScaleInv2: p.edge,
    cScaleInv3: p.edge,
    cScaleInv4: p.edge,
    cScaleInv5: p.edge,
    cScaleInv6: p.edge,
    cScaleInv7: p.edge,
    cScaleInv8: p.edge,
    cScaleInv9: p.edge,
    cScaleInv10: p.edge,
    cScaleInv11: p.edge,
    scaleLabelColor: text,

    /* --- quadrant (four pastel quadrants + vivid points) ---------------- */
    quadrant1Fill: p.tint.blue,
    quadrant2Fill: p.tint.green,
    quadrant3Fill: p.tint.orange,
    quadrant4Fill: p.tint.pink,
    quadrant1TextFill: text,
    quadrant2TextFill: text,
    quadrant3TextFill: text,
    quadrant4TextFill: text,
    quadrantPointFill: p.sys.blue,
    quadrantPointTextFill: text,
    quadrantXAxisTextFill: secondary,
    quadrantYAxisTextFill: secondary,
    quadrantInternalBorderStrokeFill: p.separator,
    quadrantExternalBorderStrokeFill: p.hairline,
    quadrantTitleFill: text,

    /* --- xychart (vivid Apple palette) ---------------------------------- */
    xyChart: {
      backgroundColor: 'transparent',
      titleColor: text,
      dataLabelColor: secondary,
      legendTextColor: secondary,
      xAxisTitleColor: secondary,
      xAxisLabelColor: secondary,
      xAxisTickColor: p.separator,
      xAxisLineColor: p.separator,
      yAxisTitleColor: secondary,
      yAxisLabelColor: secondary,
      yAxisTickColor: p.separator,
      yAxisLineColor: p.separator,
      plotColorPalette: `${p.sys.blue},${p.sys.green},${p.sys.orange},${p.sys.pink},${p.sys.purple}`,
    },

    /* --- architecture-beta (edges/groups are theme variables) ------------ */
    archEdgeColor: p.edge,
    archEdgeArrowColor: p.edge,
    archEdgeWidth: '2',
    archGroupBorderColor: p.separator,
    archGroupBorderWidth: '1.5px',

    /* --- C4: only the person silhouette is a theme variable -------------- */
    /* The person element is a circle + rect painted from `personBkg`; the
       `person_bg_color` config key does not reach it. Now that C4 labels are
       white, this fill has to be the same solid the other element classes use. */
    personBkg: p.tintStrong?.purple ?? p.tint.purple,
    personBorder: p.sys.purple,

    /* --- radar-beta: the graticule/axis/curve knobs live in `radar` ------ */
    radar: {
      axisColor: p.edge,
      axisStrokeWidth: 1,
      axisLabelFontSize: 12,
      graticuleColor: p.separator,
      graticuleOpacity: 0,
      graticuleStrokeWidth: 1,
      legendFontSize: 12,
      curveOpacity: 0.42,
      curveStrokeWidth: 2,
    },
  }
}

/* ------------------------------------------------------------------------- *
 * themeCSS
 * ------------------------------------------------------------------------- */

/**
 * 6-colour node cycle. Targets only `.nodes g.node` so subgraph/cluster boxes
 * (drawn in `.clusters`) are never swallowed. `:not(.mindmap-node)` keeps the
 * mindmap's own cScale section colouring intact. ER entities get tinted rows;
 * class diagram boxes are drawn as `<path>` outlines.
 * @param {typeof APPLE_LIGHT} p
 */
const nodeCycleCSS = (p) =>
  NODE_CYCLE.map((name, index) => {
    const n = index + 1
    const fill = p.tint[name]
    const fillAlt = p.tintAlt[name]
    const stroke = p.sys[name]
    // Flowchart-family renderers put nodes under `.nodes`; block-beta puts them
    // straight under `g.block`, so both scopes need the same cycle. The block
    // scope is spelled out separately because mermaid namespaces every themeCSS
    // selector with the diagram id (no `:is()` rewriting assumed).
    const scope = (parent) => `${parent} g.node:nth-of-type(6n+${n}):not(.mindmap-node)`
    const scopes = [scope('.nodes'), scope('.block')]
    const shapes = [
      '.outer-path path',
      'g.basic.label-container path',
      'rect.basic',
      'polygon.label-container',
      'circle.basic',
      'path.outer-path',
      'path.basic',
      'path.label-container',
      'ellipse.basic',
      'ellipse.label-container',
    ]
      .flatMap((shape) => scopes.map((s) => `${s} ${shape}`))
      .join(',\n  ')
    const rows = (className) =>
      scopes.map((s) => `${s} .${className} path`).join(',\n  ')
    return `
  ${shapes} { fill: ${fill}; stroke: ${stroke}; }
  ${rows('row-rect-odd')} { fill: ${fill}; }
  ${rows('row-rect-even')} { fill: ${fillAlt}; }`
  }).join('\n')

/**
 * Rules shared by both schemes (geometry, text metrics, structure) with the
 * scheme colours injected.
 * @param {typeof APPLE_LIGHT} p
 */
const sharedCSS = (rawPalette) => {
  const p = withSemantic(rawPalette)
  const text = p.label.primary
  const secondary = p.label.secondary
  /* Design-system shape language: corner radius, with a slightly tighter
     inner radius for nested labels. */
  const corner = p.radius ?? 8
  const cornerSmall = Math.max(2, corner - 2)
  /* Strong same-hue label colours for the pastel kanban columns: design-system
     variants provide these from their own system colours. */
  /* Derived from this variant's own hues. The hand-written `quiet` and `apple`
     palettes do not carry `headingShades`, and the previous fallback was four
     hard-coded RGB values belonging to neither system — the one place in this
     generated stylesheet where a colour did not come from the preset palette.
     (`buildPalette` supplies the field for the six design-system variants.) */
  const pMode = p.mode ?? (p.darkMode ? 'dark' : 'light')
  const headingShades = p.headingShades
    ?? [p.sys.blue, p.sys.green, p.sys.orange, p.sys.pink].map((c) => strongOnTint(c, pMode))
  const kanbanHeading = (index) => headingShades[index]
  /* Git branch chips are tinted so the (dark/light) label always contrasts. */
  const gitOrder = ['blue', 'green', 'orange', 'pink', 'purple', 'teal', 'indigo', 'red']
  const gitChipRules = gitOrder
    .map(
      (name, i) =>
        `  .branchLabelBkg.label${i} { fill: ${p.tint[name]}; stroke: ${p.sys[name]}; }`
    )
    .join('\n')

  /* Kanban: pastel columns + coloured column headings. */
  const kanbanRules = `
  .sections .cluster.section-1 rect { fill: ${p.tint.blue}; }
  .sections .cluster.section-2 rect { fill: ${p.tint.green}; }
  .sections .cluster.section-3 rect { fill: ${p.tint.orange}; }
  .sections .cluster.section-4 rect { fill: ${p.tint.pink}; }
  .sections .cluster.section-1 .cluster-label text, .sections .cluster.section-1 .cluster-label span { fill: ${kanbanHeading(0)}; color: ${kanbanHeading(0)}; }
  .sections .cluster.section-2 .cluster-label text, .sections .cluster.section-2 .cluster-label span { fill: ${kanbanHeading(1)}; color: ${kanbanHeading(1)}; }
  .sections .cluster.section-3 .cluster-label text, .sections .cluster.section-3 .cluster-label span { fill: ${kanbanHeading(2)}; color: ${kanbanHeading(2)}; }
  .sections .cluster.section-4 .cluster-label text, .sections .cluster.section-4 .cluster-label span { fill: ${kanbanHeading(3)}; color: ${kanbanHeading(3)}; }
  .items g.node rect.basic.label-container { fill: ${p.nodeFill ?? (p.darkTint ? '#232324' : '#FFFFFF')}; stroke: ${p.separator}; }`

  /* Timeline and treemap are the two types where the scale IS the content: a
     reader has to be able to tell period A from period B, group A from group B.
     Their real DOM classes are `.timeline-node.section-N` / `.section--1` (note
     the -1 offset: the first period is `--1`) and `rect.treemapSection.sectionN`
     (1-based) — an earlier attempt targeted `.section-N rect`, matched nothing,
     and washed 17 labels out to 1.05:1. Fill and label colour are emitted as a
     pair per index so the two can never drift apart again.
     `solid` is undefined on the hand-written quiet/apple palettes, in which case
     the block is empty and those variants keep their previous look. */
  const scaleRules = (() => {
    if (p.solid === undefined) return ''
    const order = ['blue', 'green', 'orange', 'pink', 'purple', 'teal', 'indigo', 'yellow', 'red', 'mint', 'brown', 'gray']
    const out = []
    order.forEach((hue, i) => {
      // timeline: i-th period is class `.section-(i-1)`, first one is `--1`
      out.push(`  g.timeline-node.section-${i === 0 ? '-1' : i - 1} path.node-bkg { fill: ${p.solid[hue]}; }`)
      out.push(`  g.timeline-node.section-${i === 0 ? '-1' : i - 1} text { fill: #FFFFFF; }`)
      // treemap: i-th group is `section${i + 1}`
      out.push(`  rect.treemapSection.section${i + 1} { stroke: ${p.solid[hue]}; stroke-width: 2; }`)
    })
    return out.join('\n')
  })()

  /* Radar curves: fill from the pastel tint, stroke from the solid hue. */
  const radarHues = ['blue', 'green', 'orange', 'pink', 'purple', 'teal', 'indigo', 'yellow', 'red', 'mint', 'brown', 'gray']
  const radarRules = radarHues
    .map((name, index) => `  .radarCurve-${index} { fill: ${p.tint[name]}; stroke: ${p.sys[name]}; }
  .radarLegendBox-${index} { fill: ${p.tint[name]}; stroke: ${p.sys[name]}; }`)
    .join('\n')

  return `
  /* class/state stock sheets paint SVG-text fills; HTML labels ignore these */
  g.classGroup text { fill: ${text}; stroke: none; }
  g.classGroup line { stroke: ${p.separator}; }
  .classLabel .box { fill: ${p.nodeFill ?? (p.darkTint ? '#232324' : '#FFFFFF')}; }
  .classLabel .label { fill: ${text}; }
  g.stateGroup text { fill: ${text}; }
  g.stateGroup .state-title { fill: ${text}; }
  .stateLabel text { fill: ${text}; }
  .state-note text { fill: ${text}; }

  /* journey paints the section band (rect.journey-section) and its task boxes
     (rect.task) from the SAME journey.sectionFills entry, and the band's box
     ends exactly where the task row begins -- measured gap 0px. The two
     therefore merge into one slab and the only separation left is a hairline.
     The band is structure, the task is content: draw the band as a wash so the
     same hue reads at two strengths and the hierarchy comes back. */
  rect.journey-section { fill-opacity: 0.55; }

  /* journey: task/section titles are stamped with a config fill + font */
  .label text { fill: ${text}; }
  text.task, text.journey-section { fill: ${text}; }
  /* The score face was a pale disc with a 12%-black outline, so both the fill
     and the edge disappeared against the card. A full edge colour turns it back
     into a badge without darkening the fill (a dark fill would fight the eyes
     and mouth, which are patched to label.secondary). */
  .face { stroke: ${p.edge}; stroke-width: 1.25; }
  circle.actor-0, circle.actor-1, circle.actor-2,
  circle.actor-3, circle.actor-4, circle.actor-5 { stroke: ${p.hairline}; }

  /* mindmap: root is the accent — deep accent fill with on-accent text */
  .section-root rect, .section-root path, .section-root circle, .section-root polygon { fill: ${p.deepBlue}; }
  .section-root text, .section-root span { fill: ${p.onDeep ?? '#FFFFFF'}; color: ${p.onDeep ?? '#FFFFFF'}; }

  /* git: tinted label chips, visible merge ring, calmer rails */
  .branch-label { fill: ${text}; font-size: 12px; }
${gitChipRules}
  .commit-id, .commit-msg { fill: ${secondary}; }
  .arrow { stroke-width: 3px; }
  .commit-merge { fill: ${p.card}; stroke: ${p.edge}; }

  /* gantt: hairlines, 12px task text, coloured done/active/crit labels */
  .task { stroke-width: 1px; }
  .taskText, .taskTextOutsideLeft, .taskTextOutsideRight { font-size: 12px; }
  .titleText { font-size: 15px; }
  .sectionTitle { font-size: 12px; }
  .grid .tick text { font-size: 11px; }
  rect.task { rx: 3px; ry: 3px; }
  .activeText0, .activeText1, .activeText2, .activeText3 { fill: ${p.activeText} !important; }
  .doneText0, .doneText1, .doneText2, .doneText3 { fill: ${p.doneText ?? (p.darkTint ? '#7FE3A0' : '#0B6B2F')} !important; }
  /* doneCrit = done + crit: it is filled with the *done* tint (#d9ece4), so a
     hard-coded white label measured 1.23:1. Every sibling rule picks its text
     from the palette; this one now does too. */
  .doneCritText0, .doneCritText1, .doneCritText2, .doneCritText3 { fill: ${p.doneText} !important; }
  .activeCritText0, .activeCritText1, .activeCritText2, .activeCritText3 { fill: ${p.activeText} !important; }
  /* When a bar is narrower than its label, mermaid moves the label outside and
     keeps the in-bar active/done/crit classes on it — those !important colours
     (white on a pastel section band) become unreadable. Outside labels always
     take the outside colour; this must stay after the rules above. */
  .taskTextOutsideRight, .taskTextOutsideLeft { fill: ${p.textOutside ?? secondary} !important; }

  /* pie: vivid slices, white percentage labels with a legibility halo */
  .pieTitleText { font-weight: 600; }
  .slice {
    fill: #FFFFFF;
    paint-order: stroke;
    stroke: ${p.darkTint ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.46)'};
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  /* packet: mermaid ships hard-coded #efefef cells with black rules; map the
     bit-field onto the active design system instead. Cell fills stay calm
     (pastel), rules use the system accent, labels use the theme text colour. */
  .packetBlock { fill: ${p.tint.blue}; stroke: ${p.sys.blue}; stroke-width: 1px; }
  .packetLabel { fill: ${text}; font-size: 12px; }
  .packetTitle { fill: ${text}; font-size: 14px; font-weight: 600; }
  .packetByte, .packetByte.start, .packetByte.end { fill: ${secondary}; }

  /* sequence numbers: indigo chips with on-accent digits */
  [id$="-sequencenumber"] { fill: ${p.sys.indigo}; }
  .sequenceNumber { fill: ${p.onAccentText ?? '#FFFFFF'}; }
  .messageLine0, .messageLine1 { stroke-width: 1.25px; }
  .actor-line { stroke-dasharray: 3 3; }

  /* heavy stock connectors (journey/timeline rails) become hairlines */
  text[font-size="4ex"] { font-size: 16px; }
  line[stroke="black"] { stroke: ${p.darkTint ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'}; stroke-width: 1.5px; }
  line.task-line { stroke: ${p.darkTint ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'}; }
  marker path { fill: ${p.darkTint ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)'}; stroke: ${p.edge}; }
  .mouth { stroke: ${p.darkTint ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}; }

  /* radii follow the design system's shape language */
  .node rect { rx: ${corner}px; ry: ${corner}px; }
  g.classGroup rect { rx: ${cornerSmall}px; ry: ${cornerSmall}px; }
  rect.actor { rx: ${corner}px; ry: ${corner}px; }
  .labelBox { rx: ${cornerSmall}px; ry: ${cornerSmall}px; }
  .mindmap-node rect { rx: ${corner}px; ry: ${corner}px; }

  /* timeline periods / treemap group edges */
${scaleRules}

  /* mermaid brightens every timeline event box by 20% on top of an already pale
     fill, which is what made the event row read as "uncoloured". */
  .eventWrapper { filter: none; }

  /* kanban columns */
${kanbanRules}

  /* quadrant points: cycle the data points through the system palette */
  .data-point circle { stroke: ${p.nodeFill ?? '#FFFFFF'}; stroke-width: 1.5px; }
  .data-point:nth-of-type(5n+1) circle { fill: ${p.sys.blue}; }
  .data-point:nth-of-type(5n+2) circle { fill: ${p.sys.green}; }
  .data-point:nth-of-type(5n+3) circle { fill: ${p.sys.orange}; }
  .data-point:nth-of-type(5n+4) circle { fill: ${p.sys.pink}; }
  .data-point:nth-of-type(5n+5) circle { fill: ${p.sys.purple}; }

  /* C4: element fills/borders come from the c4 config (inline !important),
     but C4 hard-codes a white label colour; repaint only the text so the
     label background rectangles keep their current paint. */
  .c4-shape .label text,
  .c4-shape .label .text-outer-tspan,
  .c4-shape .label .text-inner-tspan { fill: ${text}; }
  /* C4 relationship lines, boundary rect and boundary label use a hard-coded
     #444444 attribute — the only stable hook is the attribute itself. */
  [stroke="#444444"] { stroke: ${p.edge}; }
  [fill="#444444"] { fill: ${text}; }

  /* treemap multiplies its cScale fill by 0.6 (sections) and 0.3 (leaves); with
     a pastel scale that landed every cell within a few percent of the card and
     the chart read as an empty grid (closest pair measured 1.00:1). The scale
     is a solid now, so let it through at full strength. */
  .treemapSection rect, .treemapLeafGroup rect, .treemapLeaf rect { fill-opacity: 1 !important; }

  /* architecture-beta: the built-in service icons carry a hard-coded #087ebf
     inline background; put the system hue behind the white glyphs. */
  .architecture-service rect[width="80"] { fill: ${p.sys.blue} !important; }

  /* sankey-beta: node fills are hard-coded attributes from the stock Tableau
     ramp; cycle the system tints instead (links stay neutral via config). */
  .nodes g.node:nth-of-type(6n+1) rect { fill: ${p.tint.blue}; stroke: ${p.sys.blue}; }
  .nodes g.node:nth-of-type(6n+2) rect { fill: ${p.tint.green}; stroke: ${p.sys.green}; }
  .nodes g.node:nth-of-type(6n+3) rect { fill: ${p.tint.orange}; stroke: ${p.sys.orange}; }
  .nodes g.node:nth-of-type(6n+4) rect { fill: ${p.tint.pink}; stroke: ${p.sys.pink}; }
  .nodes g.node:nth-of-type(6n+5) rect { fill: ${p.tint.purple}; stroke: ${p.sys.purple}; }
  .nodes g.node:nth-of-type(6n+6) rect { fill: ${p.tint.teal}; stroke: ${p.sys.teal}; }
  .node-labels text { fill: ${text}; }

  /* radar-beta: the stock graticule is a filled grey disk and the curves use
     their pastel cScale tint for the stroke as well; both need correcting. */
  .radarGraticule { fill: none; stroke: ${p.separator}; stroke-width: 1px; }
${radarRules}

  /* journey: the stock section/task borders are a hard-coded #666666 */
  .journey-section, [class*="task-type-"] { stroke: ${p.separator}; }
  /* journey faces: the eyes are hard-coded #666 circles */
  circle[fill="#666"], circle[stroke="#666"] { fill: ${secondary}; stroke: ${secondary}; }

  /* gantt: the d3 axis writes stroke="currentColor" on the grid tick lines, so
     the gridColor theme variable never wins; key the hairlines to the palette */
  .grid .tick line, .grid path.domain { stroke: ${p.separator}; }

  /* sankey: the stock link layer blends with multiply, which turns a neutral
     link colour into near-black on the dark card; normal blending keeps the
     flow bands visible in both schemes */
  .links .link { mix-blend-mode: normal !important; }

  /* sequence autonumber discs: the stock text font is sans-serif */
  .sequenceNumber { font-family: ${FONT_STACK}; }

  /* block: labelled edges carry a hard-coded dark label stroke */
  .block .edgeLabel rect { fill: ${p.card}; stroke: ${p.separator}; }
  .block .edgeLabel text, .block .edgeLabel span { fill: ${text}; }

  /* gitGraph: HIGHLIGHT commits are painted with primaryColor for the inner
     square (a pastel with no edge), which reads like an empty hole next to the
     vivid branch commits. Give the square the accent edge and a quiet outer
     footprint. */
  .commit-highlight-outer { fill: ${p.card}; stroke: ${p.separator}; }
  .commit-highlight-inner { fill: ${p.tint.blue}; stroke: ${p.sys.blue}; stroke-width: 1px; }

  /* treemap: mermaid sizes leaf labels from the cell (38px base for a small
     tree), which reads like a poster next to every other 12-14px diagram.
     Cap label/value sizes; the renderer's inline font-size loses to this
     !important rule, and its fit loop then measures the capped size. */
  .treemapLabel { font-size: 20px !important; }
  .treemapValue { font-size: 13px !important; }
  `
}

/* ------------------------------------------------------------------------- *
 * Assembled themes
 * ------------------------------------------------------------------------- */

const lightVariables = makeThemeVariables(APPLE_LIGHT)
const darkVariables = makeThemeVariables(APPLE_DARK)

/** `theme:'base'` + Apple HIG variables, per scheme. */
const APPLE_THEMES = {
  light: {
    theme: 'base',
    themeVariables: lightVariables,
    themeCSS: sharedCSS(APPLE_LIGHT) + '\n' + nodeCycleCSS(APPLE_LIGHT),
  },
  dark: {
    theme: 'base',
    themeVariables: darkVariables,
    themeCSS: sharedCSS(APPLE_DARK) + '\n' + nodeCycleCSS(APPLE_DARK),
  },
}

/* ------------------------------------------------------------------------- *
 * Diagram config — identical to the quiet theme (layout, density, gantt fit)
 * ------------------------------------------------------------------------- */

/** Diagram-type config. Identical to the quiet variant's CONFIG by design. */

const APPLE_SCHEME_CONFIG = {
  light: {
    journey: {
      sectionFills: ['#D6EAFF', '#D2F5DE', '#FFE8CC', '#FFD9E2', '#EBD8FA', '#D0F0F5', '#FFF2BF'],
      sectionColours: ['#1D1D1F'],
      actorColours: ['#B7DAFF', '#B3ECCB', '#FFD9A8', '#FFC2D0', '#E4C6F7', '#B7E7EF'],
    },
    c4: c4ConfigFor(APPLE_LIGHT),
    sankey: { linkColor: 'gradient' },
  },
  dark: {
    journey: {
      sectionFills: ['#14325B', '#123B26', '#4A3115', '#4A1F2E', '#3A2255', '#143C44', '#4A3F12'],
      sectionColours: ['#F5F5F7'],
      actorColours: ['#2A4E7A', '#1F5C3B', '#6B4A22', '#6B3145', '#553572', '#215C66'],
    },
    c4: c4ConfigFor(APPLE_DARK),
    sankey: { linkColor: 'gradient' },
  },
}

/* ------------------------------------------------------------------------- *
 * Open-source design-system variants
 *
 * Each system only supplies its published solid hues + neutrals; pastel tints,
 * row shades, accent text and on-accent text are derived from those values so
 * the same Mermaid factory can render any system's palette. Values live in
 * DESIGN_PALETTES below (sourced from each project's published tokens).
 * ------------------------------------------------------------------------- */


/** Turn a design system's solid palette into the factory's full palette. */
const buildPalette = ({ mode, surface, separator, label, edge, hues, radius = 8 }) => {
  const card = mode === 'dark' ? '#1B1B1C' : '#F9FAFB'
  const rawHues = { ...hues }
  const tint = {}
  const tintAlt = {}
  const tintWeight = mode === 'dark' ? 0.3 : 0.16
  const tintAltWeight = mode === 'dark' ? 0.2 : 0.09
  for (const [name, hue] of Object.entries(hues)) {
    // Some canonical solids (yellow/mint) are luminous on purpose; as 1px node
    // strokes they would disappear. Walk them toward the card until visible.
    let color = hue
    for (let i = 0; i < 4 && contrast(color, card) < 2.2; i += 1) {
      color = mode === 'dark' ? mix(color, '#FFFFFF', 0.2) : mix(color, '#000000', 0.22)
    }
    hues[name] = color
    tint[name] = mix(color, card, tintWeight)
    tintAlt[name] = mix(color, card, tintAltWeight)
  }
  // Yellow is luminous on purpose, so the readability walk above pushes it
  // through several black mixes and turns it into a muddy olive. Notes, git
  // tags and yellow timeline bands should keep the design system's own warm
  // hue: derive their pastel/edge from the untouched token instead.
  const rawYellow = rawHues.yellow ?? hues.yellow
  const yellowTint = mix(rawYellow, card, mode === 'dark' ? 0.3 : 0.16)
  const yellowEdge = mode === 'dark' ? mix(rawYellow, '#FFFFFF', 0.85) : mix(rawYellow, '#000000', 0.82)
  const deepBlue = mix(hues.blue, '#000000', mode === 'dark' ? 0.35 : 0.22)
  const onDeep = contrast(deepBlue, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#111111'
  /* `activeText` is the label colour for the gantt active bar, and that bar is
     now the design system's own solid blue in both schemes — not `deepBlue`. */
  const activeBase = hues.blue

  /* Solid fills for the diagram types where colour *encodes* a category rather
     than decorating a node: C4 element classes, timeline periods, treemap
     groups, gantt task states. A tint cannot do that job — twelve 16% tints sit
     within a couple of percent of each other and of the card (measured: the
     closest pair of treemap cells was 1.00:1, i.e. identical), so the reader
     gets no information from the palette. A hue can.
     Each solid is walked toward black until WHITE text clears 4.5:1, because
     the design systems pick their step-9 solids for large text, and a 12px node
     label is not large text. Dark mode uses the same map on purpose: a
     saturated fill separates from a near-black card by chroma even when its
     luminance is close, and a semantic colour should not change between schemes. */
  const solid = {}
  for (const [name, hue] of Object.entries(rawHues)) {
    let fill = hue
    for (let i = 0; i < 12 && contrast(fill, '#FFFFFF') < 4.5; i += 1) {
      fill = mix('#000000', fill, 0.12)
    }
    solid[name] = fill
  }
  /* A tint one step stronger than `tint`, for shapes that must separate from a
     surface without becoming solid (gantt bars, journey faces).
     Both maps live here because the colour helpers below are declared after the
     hand-written `quiet`/`apple` palettes and cannot run at their load time; the
     variables read them as `p.solid?.x ?? <old tint>`, so those two variants keep
     their previous look instead of regressing. */
  const tintStrong = {}
  for (const [name, hue] of Object.entries(hues)) {
    tintStrong[name] = mix(hue, card, mode === 'dark' ? 0.5 : 0.34)
  }

  return {
    mode,
    card,
    fill: surface,
    separator,
    hairline: mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
    label,
    edge,
    sys: hues,
    tint,
    tintAlt,
    /* `mix(a, b, w)` returns `a*w + b*(1-w)`, so the FIRST argument is the small
       fraction. These two had the card as the small share, which produced a
       near-white node/cell fill in every dark variant (#f1f1f1 on a #1B1B1C
       card) while the text stayed dark-mode light — kanban cards measured
       1.03:1. Read as "lift the card 6% toward white", which is what the light
       branch has always meant. */
    nodeFill: mode === 'dark' ? mix('#FFFFFF', card, 0.06) : '#FFFFFF',
    rowAlt: mode === 'dark' ? mix('#FFFFFF', card, 0.05) : mix('#000000', card, 0.02),
    solid,
    onSolid: Object.fromEntries(Object.keys(solid).map((name) => [name, '#FFFFFF'])),
    tintStrong,
    labelText: strongOnTint(hues.purple, mode),
    taskBkg: mix(hues.blue, card, mode === 'dark' ? 0.42 : 0.24),
    /* Text drawn outside a gantt bar sits on the bar's own pale tint, where the
       secondary colour measured 4.34:1. The primary label colour clears 9:1. */
    textOutside: label.primary,
    headingShades: [hues.blue, hues.green, hues.orange, hues.pink].map((c) => strongOnTint(c, mode)),
    doneText: strongOnTint(hues.green, mode),
    onDeep,
    onAccentText: bestText(hues.indigo),
    deepBlue,
    activeText: bestText(activeBase),
    softBg: surface,
    radius,
    darkTint: mode === 'dark',
    rawHues,
    yellowTint,
    yellowEdge,
    vividYellow: rawYellow,
  }
}

/** Journey paints its bands from config arrays, not theme variables. */
const journeyConfigFor = (p) => ({
  sectionFills: [p.tint.blue, p.tint.green, p.tint.orange, p.tint.pink, p.tint.purple, p.tint.teal, p.yellowTint ?? p.tint.yellow],
  sectionColours: [p.label.primary],
  actorColours: ['blue', 'green', 'orange', 'pink', 'purple', 'teal'].map((name) =>
    mix(p.sys[name], p.card, p.mode === 'dark' ? 0.45 : 0.3)),
})

/**
 * A palette-shaped view of the quiet (DSH-native) theme, so the C4 builder can
 * colour C4 elements without a second code path. Values mirror LIGHT/DARK.
 */
function quietPalette(mode) {
  const dark = mode === 'dark'
  return {
    fill: dark ? '#1F1F22' : '#FFFFFF',
    separator: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)',
    tint: {
      purple: dark ? '#23262E' : '#E9EFF8',
      blue: dark ? '#232427' : '#F5F6F7',
      green: dark ? '#212427' : '#F1F3F5',
      orange: dark ? '#25262A' : '#F7F8FA',
    },
    sys: {
      purple: dark ? 'rgba(255,255,255,0.24)' : 'rgba(77,107,254,0.42)',
      blue: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)',
      green: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)',
      orange: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
    },
  }
}

/**
 * C4 element colours from any palette: internal families get their pastel fill
 * + solid border, `external_*` elements stay on the neutral surface so "outside
 * the system" still reads. C4 writes these as inline styles; text is re-painted
 * to the label colour by themeCSS because C4 hard-codes a white label colour.
 */
function c4ConfigFor(rawPalette) {
  const p = withSemantic(rawPalette)
  const config = {}
  const solid = p.solid !== undefined
  for (const type of C4_ELEMENT_TYPES) {
    const hue = C4_HUE[type]
    /* C4's whole point is that the element class is readable at a glance:
       person vs system vs external. Pastel tints measured 1.20:1 (person),
       1.20:1 (system) and 1.01:1 (external, which used the card surface
       itself), i.e. three categories that differ by a couple of percent. The
       solid ramp carries the class; the border becomes the card colour so the
       boxes read as separate plates rather than as outlined pastel cards. */
    config[`${type}_bg_color`] = solid ? p.tintStrong[hue] : p.tint[hue]
    config[`${type}_border_color`] = p.sys[hue]
    config[`external_${type}_bg_color`] = solid ? p.tintStrong.gray : p.fill
    config[`external_${type}_border_color`] = solid ? p.sys.gray : p.separator
  }
  return config
}

/** Assemble one variant from a light/dark palette pair. */
const makeVariant = (light, dark) => ({
  themes: {
    light: {
      theme: 'base',
      themeVariables: makeThemeVariables(light),
      themeCSS: sharedCSS(light) + '\n' + nodeCycleCSS(light),
    },
    dark: {
      theme: 'base',
      themeVariables: makeThemeVariables(dark),
      themeCSS: sharedCSS(dark) + '\n' + nodeCycleCSS(dark),
    },
  },
  schemeConfig: {
    light: {
      journey: journeyConfigFor(light),
      c4: c4ConfigFor(light),
      sankey: { linkColor: 'gradient' },
    },
    dark: {
      journey: journeyConfigFor(dark),
      c4: c4ConfigFor(dark),
      sankey: { linkColor: 'gradient' },
    },
  },
})

/**
 * Solid hues + neutrals read from each open-source design system's published
 * tokens (light = the system's light-mode solid/accent weight, dark = its dark
 * mode equivalent). Replace this table to audit/update a system.
 */
const DESIGN_PALETTES = {
  /* GitHub Primer · MIT · https://unpkg.com/@primer/primitives@11.10.0/dist/internalCss/light.css */
  github: {
    light: {
      radius: 6, surface: '#f6f8fa', separator: '#d1d9e0', edge: '#818b98',
      label: { primary: '#1f2328', secondary: '#59636e', tertiary: '#818b98' },
      hues: { blue: '#0969da', green: '#1a7f37', orange: '#bc4c00', pink: '#bf3989', purple: '#8250df', teal: '#127e81', indigo: '#5a61e7', yellow: '#9a6700', red: '#cf222e', mint: '#167e53', brown: '#856d4c', gray: '#59636e' },
    },
    dark: {
      radius: 6, surface: '#151b23', separator: '#3d444d', edge: '#656c76',
      label: { primary: '#f0f6fc', secondary: '#9198a1', tertiary: '#656c76' },
      hues: { blue: '#1f6feb', green: '#238636', orange: '#bd561d', pink: '#bf4b8a', purple: '#8957e5', teal: '#158a8a', indigo: '#7070e1', yellow: '#9e6a03', red: '#da3633', mint: '#18915e', brown: '#94774c', gray: '#9198a1' },
    },
  },
  /* Radix Colors · MIT · https://unpkg.com/@radix-ui/colors@3.0.0/slate.css */
  radix: {
    light: {
      radius: 8, surface: '#f9f9fb', separator: '#d9d9e0', edge: '#8b8d98',
      label: { primary: '#1c2024', secondary: '#60646c', tertiary: '#80838d' },
      hues: { blue: '#0090ff', green: '#30a46c', orange: '#f76b15', pink: '#d6409f', purple: '#8e4ec6', teal: '#12a594', indigo: '#3e63dd', yellow: '#ffe629', red: '#e5484d', mint: '#86ead4', brown: '#ad7f58', gray: '#8d8d8d' },
    },
    dark: {
      radius: 8, surface: '#18191b', separator: '#363a3f', edge: '#696e77',
      label: { primary: '#edeef0', secondary: '#b0b4ba', tertiary: '#777b84' },
      hues: { blue: '#0090ff', green: '#30a46c', orange: '#f76b15', pink: '#d6409f', purple: '#8e4ec6', teal: '#12a594', indigo: '#3e63dd', yellow: '#ffe629', red: '#e5484d', mint: '#86ead4', brown: '#ad7f58', gray: '#6e6e6e' },
    },
  },
  /* IBM Carbon · Apache-2.0 · https://unpkg.com/@carbon/colors@11.60.0/js/generated/colors.js */
  carbon: {
    light: {
      radius: 2, surface: '#f4f4f4', separator: '#e0e0e0', edge: '#8d8d8d',
      label: { primary: '#161616', secondary: '#525252', tertiary: '#6f6f6f' },
      hues: { blue: '#0f62fe', green: '#198038', orange: '#ba4e00', pink: '#d02670', purple: '#8a3ffc', teal: '#007d79', indigo: '#0043ce', yellow: '#8e6a00', red: '#da1e28', mint: '#24a148', brown: '#8a3800', gray: '#6f6f6f' },
    },
    dark: {
      radius: 2, surface: '#262626', separator: '#393939', edge: '#6f6f6f',
      label: { primary: '#f4f4f4', secondary: '#c6c6c6', tertiary: '#a8a8a8' },
      hues: { blue: '#4589ff', green: '#24a148', orange: '#eb6200', pink: '#ee5396', purple: '#a56eff', teal: '#009d9a', indigo: '#4589ff', yellow: '#f1c21b', red: '#fa4d56', mint: '#42be65', brown: '#ba4e00', gray: '#a8a8a8' },
    },
  },
  /* Atlassian Design System · Apache-2.0 · https://unpkg.com/@atlaskit/tokens@20.6.1/dist/esm/artifacts/palettes-raw/palette.js */
  atlassian: {
    light: {
      radius: 4, surface: '#f0f1f2', separator: '#dddee1', edge: '#8c8f97',
      label: { primary: '#292a2e', secondary: '#505258', tertiary: '#6b6e76' },
      hues: { blue: '#1868db', green: '#1f845a', orange: '#bd5b00', pink: '#ae4787', purple: '#964ac0', teal: '#227d9b', indigo: '#1868db', yellow: '#946f00', red: '#c9372c', mint: '#1f845a', brown: '#bd5b00', gray: '#6b6e76' },
    },
    dark: {
      radius: 4, surface: '#1f1f21', separator: '#303134', edge: '#7e8188',
      label: { primary: '#cecfd2', secondary: '#a9abaf', tertiary: '#96999e' },
      hues: { blue: '#669df1', green: '#4bce97', orange: '#fca700', pink: '#e774bb', purple: '#c97cf4', teal: '#6cc3e0', indigo: '#669df1', yellow: '#ddb30e', red: '#f87168', mint: '#4bce97', brown: '#fca700', gray: '#96999e' },
    },
  },
  /* Material Design 2 · Apache-2.0 · https://unpkg.com/material-design-lite@1.3.0/src/_color-definitions.scss */
  material: {
    light: {
      radius: 2, surface: '#f5f5f5', separator: '#e0e0e0', edge: '#9e9e9e',
      label: { primary: '#212121', secondary: '#616161', tertiary: '#757575' },
      hues: { blue: '#1976d2', green: '#388e3c', orange: '#f57c00', pink: '#c2185b', purple: '#7b1fa2', teal: '#00796b', indigo: '#303f9f', yellow: '#fbc02d', red: '#d32f2f', mint: '#689f38', brown: '#5d4037', gray: '#616161' },
    },
    dark: {
      radius: 2, surface: '#212121', separator: '#424242', edge: '#9e9e9e',
      label: { primary: '#fafafa', secondary: '#e0e0e0', tertiary: '#bdbdbd' },
      hues: { blue: '#90caf9', green: '#a5d6a7', orange: '#ffcc80', pink: '#f48fb1', purple: '#ce93d8', teal: '#80cbc4', indigo: '#9fa8da', yellow: '#fff59d', red: '#ef9a9a', mint: '#c5e1a5', brown: '#bcaaa4', gray: '#eeeeee' },
    },
  },
  /* Shopify Polaris · MIT · https://unpkg.com/@shopify/polaris-tokens@9.4.2/dist/esm/src/colors.mjs */
  polaris: {
    light: {
      radius: 6, surface: '#f7f7f7', separator: '#e3e3e3', edge: '#8a8a8a',
      label: { primary: '#303030', secondary: '#616161', tertiary: '#8a8a8a' },
      hues: { blue: '#005bd3', green: '#047b5d', orange: '#b28400', pink: '#e30c76', purple: '#8051ff', teal: '#12837c', indigo: '#005bd3', yellow: '#998a00', red: '#c70a24', mint: '#12837c', brown: '#7c5800', gray: '#616161' },
    },
    dark: {
      radius: 6, surface: '#303030', separator: '#4a4a4a', edge: '#8a8a8a',
      label: { primary: '#e3e3e3', secondary: '#b5b5b5', tertiary: '#8a8a8a' },
      hues: { blue: '#4188ff', green: '#18bf79', orange: '#e5a500', pink: '#fe8eb1', purple: '#aa95ff', teal: '#1ec7bc', indigo: '#4188ff', yellow: '#c5b200', red: '#f78086', mint: '#1ec7bc', brown: '#b28400', gray: '#b5b5b5' },
    },
  },
}

const DESIGN_VARIANTS = Object.fromEntries(
  Object.entries(DESIGN_PALETTES).map(([name, { light, dark }]) => [
    name,
    makeVariant(buildPalette({ ...light, mode: 'light' }), buildPalette({ ...dark, mode: 'dark' })),
  ]),
)

/**
 * The default variant. `radix` is the default (Radix Colors, the author's pick);
 * other options: `apple`, `github`, `carbon`, `atlassian`, `material`, `polaris`,
 * or `quiet` for the DSH-native neutral look. The plugin's card header switches
 * variants at runtime; this constant is the fallback until the reader picks one.
 */
const THEME_VARIANT = 'radix'

/** Theme data per variant; `CONFIG` and `FONT_STACK` are shared. */
const THEME_VARIANTS = {
  quiet: { themes: QUIET_THEMES, schemeConfig: QUIET_SCHEME_CONFIG },
  apple: { themes: APPLE_THEMES, schemeConfig: APPLE_SCHEME_CONFIG },
  ...DESIGN_VARIANTS,
}

/**
 * Three representative solid hues per variant, for the in-card theme menu.
 * Derived from the same palette the diagrams are drawn with, so a swatch can
 * never drift from the variant it names.
 */
const THEME_SWATCHES = {
  quiet: ['#4d6bfe', '#8a9099', '#c4c8cc'],
  apple: ['#0a84ff', '#30d158', '#ff9f0a'],
  ...Object.fromEntries(
    Object.entries(DESIGN_PALETTES).map(([name, palette]) => [
      name,
      [palette.light.hues.blue, palette.light.hues.green, palette.light.hues.orange],
    ]),
  ),
}

/**
 * Config for one scheme + variant, ready to spread into `mermaid.initialize()`:
 *
 *   mermaid.initialize({ startOnLoad:false, securityLevel:'strict',
 *     suppressErrorRendering:true, ...configForVariant(scheme, 'github') })
 *
 * @param {'light'|'dark'|string} scheme
 * @param {string} variantName key of THEME_VARIANTS
 */
const configForVariant = (scheme, variantName) => {
  const variant = THEME_VARIANTS[variantName]
    ?? THEME_VARIANTS[THEME_VARIANT]
    ?? THEME_VARIANTS.apple
  const key = scheme === 'dark' ? 'dark' : 'light'
  const schemeConfig = variant.schemeConfig[key]
  return {
    ...CONFIG,
    ...schemeConfig,
    ...variant.themes[key],
    journey: { ...CONFIG.journey, ...schemeConfig.journey },
    c4: { ...CONFIG.c4, ...schemeConfig.c4 },
    sankey: { ...CONFIG.sankey, ...schemeConfig.sankey },
    architecture: { ...CONFIG.architecture, ...schemeConfig.architecture },
  }
}

/** The active variant's config for one scheme. */
const configFor = (scheme) => configForVariant(scheme, THEME_VARIANT)

/**
 * dsh-mermaid-preview — Client (browser) half.
 *
 * Renders `mermaid` fenced code blocks as diagrams in every DeepSeek Harness
 * (dsh) Web Markdown surface: chat messages, the trajectory view, plan review,
 * compaction summaries — anywhere the shared `MarkdownText` renderer draws a
 * fence.
 *
 * ## How it works
 *
 * 1. `MarkdownText` renders a fence as a `.md-code-block` root holding a
 *    `[data-code-block-banner]` header and a `[data-code-block-content]` body.
 *    A language the shiki grammar table does not know (which includes
 *    `mermaid`) renders **plain**: the body's first child is a `<pre>`. A
 *    highlighted language renders shiki output inside a `<div>` instead, so
 *    "the body's first child is a `<pre>`" is the plugin's cheap, stable
 *    "unhighlighted fence" test.
 * 2. The header is a `CodeToolbar`, which prints the *generic* code label for an
 *    unsupported language — the info string `mermaid` is therefore **not** in
 *    the DOM on current dsh. Detection is content-based: the first Mermaid
 *    statement of the fence (`flowchart`, `sequenceDiagram`, …) decides. A
 *    surface that does print the info string (older layouts, the demo page) is
 *    still honored directly.
 * 3. The plugin appends its own holder as the block's **trailing** child and
 *    leaves every React-owned node in place. CSS lays the card out as a column
 *    with the holder first, so one plugin-owned header serves both views: the
 *    diagram card shows a type label and copy / source / zoom controls, and the
 *    source view is the original `<pre>` with the hidden attribute lifted. The
 *    shell's generic code banner is hidden with a reversible attribute (never
 *    by removing the node), so React always keeps its own DOM.
 * 4. Mermaid 11 (UMD, jsDelivr) is fetched once, lazily, only when the first
 *    candidate fence appears. Renders are serialized so a message full of
 *    diagrams cannot block the main thread with parallel work.
 * 5. A diagram is always fit to the card's width: a wide one is scaled down
 *    until the whole diagram is visible instead of being cropped or scrolled
 *    sideways; a small-and-short one grows up to MAX_READING_SCALE; a tall one
 *    keeps 1:1 and lets the card grow taller. The canvas is not a scroll
 *    container, so the wheel always scrolls the message list even when the
 *    pointer is over a chart. Readability of a very wide diagram comes from the
 *    viewer: click the diagram — or the zoom control in the header — to open a
 *    full-window viewer with a framed paper on a blurred mask, a floating
 *    toolbar, wheel zoom, drag-to-pan, fit-to-window, double-click 1:1, arrow
 *    keys and Esc.
 * 6. A render failure is never final. Streaming cuts a fence mid-statement
 *    whenever the model pauses for longer than the settle window, and a
 *    half-written diagram is a parse error, not a user error: the block retries
 *    with backoff, and only a fence whose text has stopped changing and still
 *    fails earns the note. That note is a calm inline panel with a human
 *    summary; the parser's own message stays one click away. New text on the
 *    same block clears the note and starts over — a block is never poisoned by
 *    one bad snapshot of itself.
 * 7. Theme switches repaint through `ctx.on('theme/change')`; UI copy comes from
 *    the Client locale service (`ctx.get('locale')`), so it follows the
 *    interface language. A repaint closes the viewer, which would otherwise
 *    keep showing the previous theme's picture.
 * 8. Diagrams are drawn with a hand-built Mermaid theme (`THEMES` below): the
 *    shell's own palette, type stack, and hairline geometry, so a diagram reads
 *    as part of dsh rather than a pasted widget.
 * 9. Every side effect — styles, observer, listeners, timers, script tag,
 *    injected DOM, the viewer — is owned by the plugin fiber and removed on
 *    stop/update.
 *
 * This module is the canonical plugin source; the diagram theme lives in
 * `src/theme.js` and is inlined by the build (the plugin ships as one wrapped
 * source, with no bundler). `scripts/build.mjs` derives `dist/client.js` (the
 * native bundle a profile loads) and `dist/dsh-mermaid-preview.client.js` (the
 * paste-ready dynamic payload).
 *
 * MIT License — see LICENSE.
 */

/** Package name. It is the browser module identity, so it must equal `name`. */
const PLUGIN_ID = 'dsh-mermaid-preview'

/** Locale namespace for this plugin's own interface copy. */
const NS = PLUGIN_ID

/** Fence language this plugin takes over. */
const LANGUAGE = 'mermaid'

/** Pinned Mermaid release (UMD). Change this line to use a mirror. */
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js'

/** Quiet period before a fence is considered settled and worth rendering. */
const SETTLE_MS = 250

/**
 * Backoff after a failed render, in milliseconds. A fence that fails while it
 * is still being streamed usually fails because it is half-written, so the
 * plugin stays quiet and tries again; only a fence that keeps failing after
 * these retries — one whose text has stopped changing — earns the error note.
 */
const RETRY_MS = [400, 900, 1800]

/**
 * How far outside the viewport a diagram may start rendering, in pixels.
 *
 * A Mermaid render costs 20-190ms of main thread and is 95% of this plugin's
 * work; a diagram the reader never scrolls to is work nobody sees. So a card
 * below the fold waits for the visibility observer instead of rendering at
 * mount — a conversation with thirty diagrams in its history now renders the
 * two or three that are actually on screen. The margin is generous on purpose:
 * the work starts while the card is still off screen, so it is normally ready
 * before the reader arrives.
 */
const VISIBLE_MARGIN_PX = 400

/** The same margin as CSS `rootMargin` accepts it. */
const VISIBLE_MARGIN = `${VISIBLE_MARGIN_PX}px 0px`

/**
 * Bounds of the rendered-diagram cache. A cache entry is one SVG string
 * (20-80KB for the diagrams measured); 40 entries keeps the worst case around
 * 3MB, and the byte bound keeps that true if a message contains one huge chart.
 */
const CACHE_ENTRIES = 40
const CACHE_BYTES = 4 * 1024 * 1024

/** Padding left around the diagram by the viewer's fit-to-window scale. */
const ZOOM_PAD = 40

/** Scale bounds of the viewer; `ZOOM_MAX` covers a diagram of a few nodes. */
const ZOOM_MIN = 0.1
const ZOOM_MAX = 8

/**
 * Upper bound of the viewer's fit scale. The full-window viewer is the place
 * where a small diagram may be magnified to use the window, but a 14px Mermaid
 * label should never turn into a poster: 2.5x keeps it at about 35px even on a
 * 1920px-wide window, and normal-sized diagrams never reach the cap.
 */
const ZOOM_FIT_MAX = 2.5

/** One press of the viewer's +/- buttons. */
const ZOOM_STEP = 1.25

/** Breathing room around the diagram on the viewer's paper. */
const ZOOM_PAPER_PAD = 22

/** Travel, in pixels, below which a pointer gesture is a click, not a pan. */
const ZOOM_DRAG_MIN = 4

/** How far one arrow key moves the diagram. */
const ZOOM_ARROW_PX = 80

/** Highest sane stacking order: the viewer must clear anything the shell draws. */
const ZOOM_Z_INDEX = 2147483000

/** The theme menu sits just under the viewer (the two are never open together). */
const THEME_Z_INDEX = ZOOM_Z_INDEX - 1

/** localStorage key holding the reader's diagram theme choice. */
const THEME_STORAGE_KEY = `${PLUGIN_ID}:theme`
/** Local layout preference: 'scroll' (default) or 'grow'. */
const FIT_STORAGE_KEY = `${PLUGIN_ID}:fit-mode`

/**
 * Diagram themes offered in the card header, in reading order. The system names
 * stay untranslated; `quiet` is the plugin's own neutral theme and follows the
 * interface language through `themeNeutral`.
 */
const THEME_CHOICES = [
  { id: 'radix', label: 'Radix Colors' },
  { id: 'apple', label: 'Apple HIG' },
  { id: 'github', label: 'GitHub Primer' },
  { id: 'carbon', label: 'IBM Carbon' },
  { id: 'atlassian', label: 'Atlassian' },
  { id: 'material', label: 'Material Design' },
  { id: 'polaris', label: 'Shopify Polaris' },
  { id: 'quiet', key: 'themeNeutral' },
]

/**
 * The reader's stored theme choice, when it still names a shipped variant.
 * Storage can be unavailable (private mode, disabled cookies), in which case
 * the plugin simply starts from `THEME_VARIANT`.
 */
const storedFitMode = () => {
  try {
    return window.localStorage.getItem(FIT_STORAGE_KEY) === 'grow' ? 'grow' : 'scroll'
  } catch {
    return 'scroll'
  }
}

const storeFitMode = (mode) => {
  try {
    window.localStorage.setItem(FIT_STORAGE_KEY, mode)
  } catch {
    /* storage unavailable: the choice lasts for this session */
  }
}

const storedTheme = () => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return typeof value === 'string' && THEME_SWATCHES[value] !== undefined ? value : null
  } catch {
    return null
  }
}

/** Remember a theme choice; a failed write must never cost the switch itself. */
const storeTheme = (variant) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, variant)
  } catch {
    /* private mode or a full quota: the choice still applies to this session */
  }
}

/**
 * Largest upscale the card applies to a diagram that already fits. 1.5x keeps
 * a 14px Mermaid label at 21px — larger than body text, still readable as a
 * figure; filling the card would need 2.5-4.7x and turn the card into a poster,
 * which is what the full-window viewer is for.
 */
const MAX_READING_SCALE = 1.5

/**
 * Diagrams naturally taller than this keep their 1:1 size and let the card grow
 * taller instead of being magnified: a 14px label on a long sequence/C4 diagram
 * does not need to become a poster, and the page can scroll past the card.
 * Everything else may grow up to MAX_READING_SCALE.
 */
const TALL_DIAGRAM_HEIGHT = 600

/** Attribute marking the body we hide while the diagram is shown. */
const HIDDEN = 'data-dsh-mermaid-hidden'

/**
 * Attribute hiding the shell's own code banner (label, collapse, copy) while a
 * diagram stands in for the code. Toggled on the banner's wrapper, which React
 * owns — an attribute write is reversible, a node replacement is not.
 */
const BANNER_HIDDEN = 'data-dsh-mermaid-banner'

/**
 * Icon artwork for the plugin's own controls. 16px viewBox, `currentColor`,
 * 1px strokes — the same grammar as the shell's product icon set, so the card
 * toolbar reads as native chrome. Paths are derived from the DeepSeek Harness
 * icon set (MIT): code brackets, fullscreen, copy, check, close, plus, minus,
 * warning triangle.
 */
const ICONS = {
  source: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M4.67398 4.25061L1.36094 7.86484C1.29085 7.9413 1.29085 8.05866 1.36094 8.13513L4.67398 11.7494" stroke="currentColor"/><path d="M11.3262 4.25061L14.6392 7.86484C14.7093 7.9413 14.7093 8.05866 14.6392 8.13513L11.3262 11.7494" stroke="currentColor"/><path d="M9.56222 3.62573L6.43774 12.3743" stroke="currentColor"/></svg>',
  expand: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.33154 9.40576V13.1685C2.3318 13.4444 2.55556 13.6685 2.83154 13.6685H6.49463V14.6685H2.83154C2.00328 14.6685 1.3318 13.9967 1.33154 13.1685V9.40576H2.33154ZM13.1685 1.33154C13.9964 1.33199 14.6683 2.00352 14.6685 2.83154V6.40576H13.6685V2.83154C13.6683 2.5558 13.4441 2.33199 13.1685 2.33154H9.49463V1.33154H13.1685Z" fill="currentColor"/><path d="M9.4292 6.57077L13.914 2.08594" stroke="currentColor"/><path d="M6.57077 9.4292L2.08594 13.914" stroke="currentColor"/></svg>',
  copy: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><rect x="1.52075" y="4.07373" width="10.3932" height="10.3932" rx="2" stroke="currentColor"/><path d="M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.5 8.5L6 12L13.5 4.5" stroke="currentColor"/></svg>',
  palette: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M8 1.75a6.25 6.25 0 1 0 0 12.5c.9 0 1.55-.7 1.55-1.55 0-.4-.15-.77-.42-1.05a1.48 1.48 0 0 1-.43-1.04c0-.84.68-1.52 1.52-1.52h1.32a3.92 3.92 0 0 0 3.71-5.2C14.4 2.7 11.6 1.75 8 1.75Z" stroke="currentColor"/><circle cx="5.1" cy="6.1" r=".85" fill="currentColor" stroke="none"/><circle cx="8.1" cy="4.6" r=".85" fill="currentColor" stroke="none"/><circle cx="4.3" cy="9.3" r=".85" fill="currentColor" stroke="none"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.5 2.5L13.5 13.5" stroke="currentColor"/><path d="M13.5 2.5L2.5 13.5" stroke="currentColor"/></svg>',
  layout: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="1.5" width="11" height="13" rx="2" stroke="currentColor"/><path d="M8 4.25v3M8 8.75v3M6.1 6.15 8 4.25l1.9 1.9M6.1 9.85 8 11.75l1.9-1.9" stroke="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M8 2.5V13.5" stroke="currentColor"/><path d="M2.5 8H13.5" stroke="currentColor"/></svg>',
  minus: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1"><path d="M2.5 8H13.5" stroke="currentColor"/></svg>',
  warning: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6.87 2.6a1.33 1.33 0 0 1 2.26 0l5.34 9.33A1.33 1.33 0 0 1 13.33 14H2.67a1.33 1.33 0 0 1-1.14-2.07Z" stroke="currentColor"/><path d="M8 6v3m0 2.33h.01" stroke="currentColor"/></svg>',
}

/**
 * The fence keyword shown in the card header. Prefer the diagram's own
 * statement (`sequenceDiagram`, `gantt`, …) over the fence language: the
 * header then tells the reader what they are looking at, the way a code card
 * prints its language.
 */
const OPENERS = [
  [/^(?:graph|flowchart)(?:-elk)?\b/, 'flowchart'],
  [/^sequenceDiagram\b/, 'sequenceDiagram'],
  [/^classDiagram(?:-v2)?\b/, 'classDiagram'],
  [/^stateDiagram(?:-v2)?\b/, 'stateDiagram'],
  [/^erDiagram\b/, 'erDiagram'],
  [/^journey\b/, 'journey'],
  [/^gantt\b/, 'gantt'],
  [/^pie\b/, 'pie'],
  [/^quadrantChart\b/, 'quadrantChart'],
  [/^requirementDiagram\b/, 'requirementDiagram'],
  [/^gitGraph\b/, 'gitGraph'],
  [/^mindmap\b/, 'mindmap'],
  [/^timeline\b/, 'timeline'],
  [/^sankey(?:-beta)?\b/, 'sankey'],
  [/^xychart(?:-beta)?\b/, 'xychart'],
  [/^block(?:-beta)?\b/, 'block'],
  [/^packet(?:-beta)?\b/, 'packet'],
  [/^treemap(?:-beta)?\b/, 'treemap'],
  [/^radar-beta\b/, 'radar'],
  [/^architecture-beta\b/, 'architecture'],
  [/^kanban\b/, 'kanban'],
  [/^C4(Context|Container|Component|Dynamic|Deployment)\b/, 'C4'],
  [/^zenuml\b/, 'zenuml'],
  [/^info\b/, 'info'],
]

/** Copy for the built-in locales; `en` is the fallback. */
const DICT = {
  en: {
    showSource: 'Show source',
    showDiagram: 'Show diagram',
    copySource: 'Copy source',
    copied: 'Copied',
    zoom: 'Zoom',
    zoomViewer: 'Diagram viewer',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit',
    zoomClose: 'Close',
    zoomHint: 'Scroll to zoom · Drag to pan · Esc to close',
    theme: 'Theme',
    themeNeutral: 'dsh neutral',
    layoutGrowAction: 'Full expand: the card follows the diagram height',
    layoutScrollAction: 'Scroll container: tall diagrams scroll inside the card',
    loadFailed: 'Mermaid failed to load',
    loadFailedNote: 'The diagram engine could not be fetched. Check the network and try again.',
    renderFailed: 'Mermaid syntax error',
    renderFailedNote: 'The source is kept below — fix it and the diagram renders again.',
    details: 'Details',
  },
  zh: {
    showSource: '显示源码',
    showDiagram: '显示图表',
    copySource: '复制源码',
    copied: '已复制',
    zoom: '放大',
    zoomViewer: '图表查看器',
    zoomIn: '放大',
    zoomOut: '缩小',
    zoomFit: '适应窗口',
    zoomClose: '关闭',
    zoomHint: '滚轮缩放 · 拖拽平移 · Esc 关闭',
    theme: '主题',
    themeNeutral: 'dsh 中性',
    layoutGrowAction: '完整展开：卡片随图变高',
    layoutScrollAction: '滚动容器：高图在卡片内滚动',
    loadFailed: 'Mermaid 加载失败',
    loadFailedNote: '图表引擎没能加载，请检查网络后重试。',
    renderFailed: '图表语法有误',
    renderFailedNote: '已保留源码，修正后会自动重新渲染。',
    details: '查看详情',
  },
}

/**
 * Mermaid statements that may open a diagram. Case matters. The list tracks the
 * pinned Mermaid release (11.17.2): every keyword its `detectType` accepts, and
 * nothing else — a keyword mermaid does not know at all (`radar`, bare
 * `architecture`) must stay undetected, or the fence would be taken over only
 * to fail with "No diagram type detected". A hyphenated *suffix* on a known
 * keyword (`flowchart-v2`, rejected by mermaid since v9) still matches by
 * prefix on purpose: the fence looks like a diagram, so it is taken over and
 * mermaid's own error note explains the syntax. Verified against 11.17.2:
 * `radar-beta`, `kanban`, `treemap-beta`, the bare `sankey` / `xychart` /
 * `block` / `packet` / `treemap` forms and `flowchart-elk` are all accepted.
 */
const MERMAID_HEAD = /^(?:graph|flowchart(?:-elk)?|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|(?:sankey|xychart|block|packet|treemap)(?:-beta)?|radar-beta|architecture-beta|kanban|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|zenuml|info)\b/

/**
 * Diagram statements that attach behaviour instead of only drawing. Mermaid
 * binds these as closures over the diagram it parsed, so a replayed SVG string
 * comes back inert — such a fence is never cached.
 */
const INTERACTIVE = /(?:^|\n)[ \t]*click\b/

/**
 * Strip the front matter, directives, and comments Mermaid allows before the
 * first statement, then return that statement (leading whitespace removed).
 * @param code - the fence source.
 * @returns the first statement of the fence.
 */
const openingStatement = (code) => {
  let rest = code.replace(/^\uFEFF/, '')
  for (;;) {
    const before = rest
    rest = rest.replace(/^\s*%%[^\n]*(?:\n|$)/, '')
    rest = rest.replace(/^\s*%%\{[\s\S]*?\}%%\s*/, '')
    rest = rest.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\s*/, '')
    if (rest === before) break
  }
  return rest.replace(/^\s+/, '')
}

/**
 * Answer whether the fence's first statement opens a diagram.
 * @param code - the fence source.
 * @returns true when the fence is a plausible Mermaid diagram.
 */
const opensDiagram = (code) => MERMAID_HEAD.test(openingStatement(code))

/**
 * The keyword to print in the card header, or `mermaid` when the fence only
 * passed the generic opener test.
 * @param code - the fence source.
 * @returns the header label.
 */
const diagramKind = (code) => {
  const head = openingStatement(code)
  for (const [pattern, name] of OPENERS) {
    if (pattern.test(head)) return name
  }
  return 'mermaid'
}

/** Readable one-line form of a thrown value. */
const messageOf = (error) => {
  if (error instanceof Error && error.message !== '') return error.message
  const text = String(error)
  return text === '' ? 'unknown error' : text
}

const __plugin =  {
  name: PLUGIN_ID,
  /**
   * Register the DOM decorator. The host half is a no-op, so this runs in the
   * browser only; the guard keeps a non-DOM evaluation harmless.
   * @param ctx - the plugin's Cordis context.
   */
  apply(ctx) {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const state = {
      disposed: false,
      uid: 0,
      /** block -> record */
      records: new Map(),
      /** block -> settle timer */
      timers: new Map(),
      /** <script> tags this plugin owns */
      scripts: new Set(),
      /** serialized render queue */
      queue: Promise.resolve(),
      /** cached Mermaid load promise */
      mermaid: null,
      /** the enlarged viewer, built on first open */
      viewer: null,
      /** the diagram theme variant in use (persisted per reader) */
      variant: storedTheme() ?? THEME_VARIANT,
      /** card layout: 'scroll' caps tall diagrams, 'grow' lets the card grow */
      fitMode: storedFitMode(),
      /** the shared theme menu, built on first open */
      menu: null,
      /** cache key -> { svg, id, bytes }; insertion order is recency order */
      cache: new Map(),
      /** total size of the cached SVG strings, for the byte bound */
      cacheBytes: 0,
      /** the shared visibility observer, built on first record */
      visible: null,
      /** holder -> record, for the visibility observer's callback */
      byHolder: new WeakMap(),
    }

    // The layout preference is global; the canvas CSS keys off this attribute.
    document.documentElement.dataset.dshMermaidFit = state.fitMode

    // ---- interface copy -------------------------------------------------
    // The locale service is resolved lazily, not once here. Client modules
    // mount in dependency order, so this plugin can be applied before the
    // locale service exists — binding at mount time then leaves the plugin
    // speaking its shipped English while the rest of the interface is Chinese.
    // Until the service answers, the copy follows the document language, which
    // is what the service itself keeps in sync.
    let translate = null
    let requested = false

    /**
     * The locale service, or undefined. Reading a service *property* off a
     * Cordis context is not a lookup: when the service is not provided (or not
     * injected) the context proxy throws `cannot get property "locale" without
     * inject`. `ctx.get()` is the plain lookup and answers undefined instead,
     * so it is asked first and the accessor is only ever touched in a guard.
     */
    const localeService = () => {
      try {
        const viaGet = typeof ctx.get === 'function' ? ctx.get('locale') : undefined
        if (viaGet !== undefined) return viaGet
      } catch {
        /* not resolvable in this context */
      }
      try {
        return ctx.locale ?? undefined
      } catch {
        return undefined
      }
    }

    /** The active language as the page reports it. */
    const pageLanguage = () => {
      try {
        const lang = (typeof document === 'undefined' ? '' : document.documentElement.lang) || ''
        if (lang !== '') return lang.toLowerCase()
        return (typeof navigator === 'undefined' ? '' : (navigator.language ?? '')).toLowerCase()
      } catch {
        return ''
      }
    }

    /**
     * Resolve the bound translator, registering this namespace's dictionary the
     * first time the service is seen. Null while the service is missing or its
     * dictionary has not landed yet — the caller then uses its own copy.
     */
    const translator = () => {
      if (translate !== null) return translate
      const locale = localeService()
      if (locale === undefined || typeof locale.bind !== 'function') return null
      if (!requested) {
        requested = true
        if (typeof locale.register === 'function') {
          try {
            ctx.effect(() => {
              // A namespace collision (a double mount) must not fail the plugin.
              try {
                return locale.register(NS, DICT)
              } catch {
                return () => {}
              }
            }, `${PLUGIN_ID}: locale`)
          } catch {
            /* no effect scope here: the built-in copy still works */
          }
        }
      }
      let bound
      try {
        bound = locale.bind(NS)
      } catch {
        return null
      }
      // A namespace with no dictionary yet answers with the key itself, so this
      // doubles as "has the registration landed". Asking again on the next call
      // is cheaper than guessing when it will.
      try {
        if (bound('zoom') === 'zoom') return null
      } catch {
        return null
      }
      translate = bound
      // Copy already rendered came from the fallback dictionary; refresh it.
      queueMicrotask(() => {
        for (const record of state.records.values()) applyView(record)
        if (state.viewer !== null) state.viewer.refreshLabels()
      })
      return translate
    }

    /**
     * Interface copy: the locale service when it answers, own copy otherwise.
     * This never throws — a service hiccup must not cost a diagram its copy,
     * let alone its rendering.
     */
    const t = (key) => {
      try {
        const bound = translator()
        if (bound !== null) {
          const value = bound(key)
          if (typeof value === 'string' && value !== key) return value
        }
      } catch {
        /* fall through to the built-in dictionary */
      }
      const dict = pageLanguage().startsWith('zh') ? DICT.zh : DICT.en
      return dict[key] ?? DICT.en[key] ?? key
    }

    /** Reader-facing name of one theme variant. */
    const themeLabel = (variant) => {
      const choice = THEME_CHOICES.find((entry) => entry.id === variant)
      if (choice === undefined) return variant
      return choice.key === undefined ? choice.label : t(choice.key)
    }

    // ---- styles ---------------------------------------------------------
    // Colors are theme tokens only, so light/dark switching needs no repaint of
    // the frame around the diagram.
    ctx.effect(() => {
      const style = document.createElement('style')
      style.dataset.dshMermaidStyles = '1'
      style.textContent = `
      /* ---- card chrome ------------------------------------------------- */
      /* A diagram is not code. While this plugin owns a fence it draws the
         card header its own way (type label + copy / source / zoom) and hides
         the shell's generic code banner with a reversible attribute. React's
         nodes are never removed — the source view only lifts the hidden
         attribute from the original body. */
      [data-dsh-mermaid-banner] { display: none !important; }
      [${HIDDEN}] { display: none !important; }
      /* The holder is appended after React's body, so the card is laid out as
         a column with the holder ordered first: one header for both views
         instead of a second toolbar underneath the code. */
      .md-code-block[data-dsh-mermaid] { display: flex; flex-direction: column; }
      .md-code-block[data-dsh-mermaid] > [data-code-block-content] { display: contents; }
      .md-code-block[data-dsh-mermaid] > [data-code-block-content] > pre { order: 1; margin: 0 !important; }
      .dsh-mermaid { order: 0; display: flex; flex-direction: column; min-width: 0; }

      .dsh-mermaid-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 18px 8px 22px;
        border-top-left-radius: var(--dsw-radius-lg, 16px);
        border-top-right-radius: var(--dsw-radius-lg, 16px);
        background: var(--dsw-alias-markdown-code-block-banner, transparent);
        color: var(--dsw-alias-label-tertiary, #81868c);
        font: 11px/18px var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif);
      }
      /* The header label is an Apple-style tag: a soft system-colour tint with
         a same-hue readable label, one colour per diagram type. */
      .dsh-mermaid-kind,
      .dsh-mermaid-zoom-kind {
        display: inline-block;
        max-width: 100%;
        min-width: 0;
        padding: 1px 8px;
        overflow: hidden;
        border-radius: 6px;
        background: var(--dsh-kind-bg, var(--dsw-alias-markdown-tag, rgba(127, 127, 127, 0.1)));
        color: var(--dsh-kind-fg, var(--dsw-alias-label-tertiary, #81868c));
        font: 11px/18px var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='flowchart'] { --dsh-kind-bg: #e6f2ff; --dsh-kind-fg: #0058d6; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sequenceDiagram'] { --dsh-kind-bg: #e7f9ee; --dsh-kind-fg: #1e7f3f; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='classDiagram'] { --dsh-kind-bg: #f5ebff; --dsh-kind-fg: #7a2fb8; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='stateDiagram'] { --dsh-kind-bg: #fff3e0; --dsh-kind-fg: #b25e00; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='erDiagram'] { --dsh-kind-bg: #e3f7fa; --dsh-kind-fg: #147a8c; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gantt'] { --dsh-kind-bg: #ffe9ef; --dsh-kind-fg: #c21e45; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='pie'] { --dsh-kind-bg: #eae9ff; --dsh-kind-fg: #4543c4; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='journey'] { --dsh-kind-bg: #fff8d6; --dsh-kind-fg: #8a6200; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='mindmap'] { --dsh-kind-bg: #e0f8f6; --dsh-kind-fg: #0e7c74; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gitGraph'] { --dsh-kind-bg: #f3ebe4; --dsh-kind-fg: #7a5a3c; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='timeline'] { --dsh-kind-bg: #ffe8e6; --dsh-kind-fg: #c22f26; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='quadrantChart'] { --dsh-kind-bg: #eae9ff; --dsh-kind-fg: #4543c4; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='requirementDiagram'] { --dsh-kind-bg: #e3f7fa; --dsh-kind-fg: #147a8c; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='xychart'] { --dsh-kind-bg: #e6f2ff; --dsh-kind-fg: #0058d6; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sankey'] { --dsh-kind-bg: #e0f8f6; --dsh-kind-fg: #0e7c74; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='block'] { --dsh-kind-bg: #e7f9ee; --dsh-kind-fg: #1e7f3f; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='packet'] { --dsh-kind-bg: #fff3e0; --dsh-kind-fg: #b25e00; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='treemap'] { --dsh-kind-bg: #f5ebff; --dsh-kind-fg: #7a2fb8; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='radar'] { --dsh-kind-bg: #ffe9ef; --dsh-kind-fg: #c21e45; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='architecture'] { --dsh-kind-bg: #eae9ff; --dsh-kind-fg: #4543c4; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='kanban'] { --dsh-kind-bg: #fff3e0; --dsh-kind-fg: #b25e00; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='C4'] { --dsh-kind-bg: #f5ebff; --dsh-kind-fg: #7a2fb8; }
      :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='zenuml'] { --dsh-kind-bg: #e7f9ee; --dsh-kind-fg: #1e7f3f; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='flowchart'] { --dsh-kind-bg: rgba(10, 132, 255, 0.18); --dsh-kind-fg: #6fb6ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sequenceDiagram'] { --dsh-kind-bg: rgba(48, 209, 88, 0.18); --dsh-kind-fg: #6ee7a0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='classDiagram'] { --dsh-kind-bg: rgba(191, 90, 242, 0.2); --dsh-kind-fg: #d4a2ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='stateDiagram'] { --dsh-kind-bg: rgba(255, 159, 10, 0.18); --dsh-kind-fg: #ffc06a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='erDiagram'] { --dsh-kind-bg: rgba(64, 200, 224, 0.18); --dsh-kind-fg: #7fe3f0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gantt'] { --dsh-kind-bg: rgba(255, 55, 95, 0.2); --dsh-kind-fg: #ff93ab; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='pie'] { --dsh-kind-bg: rgba(94, 92, 230, 0.22); --dsh-kind-fg: #b0aeff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='journey'] { --dsh-kind-bg: rgba(255, 214, 10, 0.16); --dsh-kind-fg: #ffd60a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='mindmap'] { --dsh-kind-bg: rgba(99, 230, 226, 0.16); --dsh-kind-fg: #7cf0e8; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='gitGraph'] { --dsh-kind-bg: rgba(172, 142, 104, 0.22); --dsh-kind-fg: #d9b48a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='timeline'] { --dsh-kind-bg: rgba(255, 69, 58, 0.2); --dsh-kind-fg: #ff8a82; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='quadrantChart'] { --dsh-kind-bg: rgba(94, 92, 230, 0.22); --dsh-kind-fg: #b0aeff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='requirementDiagram'] { --dsh-kind-bg: rgba(64, 200, 224, 0.18); --dsh-kind-fg: #7fe3f0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='xychart'] { --dsh-kind-bg: rgba(10, 132, 255, 0.18); --dsh-kind-fg: #6fb6ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='sankey'] { --dsh-kind-bg: rgba(99, 230, 226, 0.16); --dsh-kind-fg: #7cf0e8; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='block'] { --dsh-kind-bg: rgba(48, 209, 88, 0.18); --dsh-kind-fg: #6ee7a0; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='packet'] { --dsh-kind-bg: rgba(255, 159, 10, 0.18); --dsh-kind-fg: #ffc06a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='treemap'] { --dsh-kind-bg: rgba(191, 90, 242, 0.2); --dsh-kind-fg: #d4a2ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='radar'] { --dsh-kind-bg: rgba(255, 55, 95, 0.2); --dsh-kind-fg: #ff93ab; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='architecture'] { --dsh-kind-bg: rgba(94, 92, 230, 0.22); --dsh-kind-fg: #b0aeff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='kanban'] { --dsh-kind-bg: rgba(255, 159, 10, 0.18); --dsh-kind-fg: #ffc06a; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='C4'] { --dsh-kind-bg: rgba(191, 90, 242, 0.2); --dsh-kind-fg: #d4a2ff; }
      body[data-ds-dark-theme] :is(.dsh-mermaid-head, .dsh-mermaid-zoom-bar)[data-dsh-mermaid-kind='zenuml'] { --dsh-kind-bg: rgba(48, 209, 88, 0.18); --dsh-kind-fg: #6ee7a0; }
      .dsh-mermaid-tool.is-copied { color: #34c759; }
      body[data-ds-dark-theme] .dsh-mermaid-tool.is-copied { color: #30d158; }
      .dsh-mermaid-tools { display: flex; flex: none; align-items: center; gap: 4px; }
      .dsh-mermaid-tool {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: var(--dsw-radius-sm, 8px);
        color: var(--dsw-alias-label-secondary, #61666b);
        background: transparent;
        cursor: pointer;
        transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-tool svg { display: block; width: 16px; height: 16px; }
      .dsh-mermaid-tool[hidden] { display: none !important; }
      .dsh-mermaid-tool:hover {
        color: var(--dsw-alias-label-primary, #0f1115);
        background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
      }
      .dsh-mermaid-tool[aria-pressed='true'] {
        color: var(--dsw-alias-label-primary, #0f1115);
        background: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.1));
      }
      .dsh-mermaid-tool:focus-visible {
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: 2px;
      }
      .dsh-mermaid-tool::after,
      .dsh-mermaid-zoom-button::after {
        content: attr(data-tip);
        position: absolute;
        left: 50%;
        z-index: 8;
        padding: 3px 7px;
        border-radius: var(--dsw-radius-sm, 8px);
        background: var(--dsw-alias-tooltip-bg, #2c2c2e);
        color: var(--dsw-static-neutral-bluish-00, #fff);
        font: 13px/20px var(--dsw-font-family, system-ui, sans-serif);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-tool::after { bottom: calc(100% + 6px); transform: translate(-50%, 2px); }
      .dsh-mermaid-tool:hover::after { opacity: 1; transform: translate(-50%, 0); }
      .dsh-mermaid-zoom-button::after { top: calc(100% + 6px); transform: translate(-50%, -2px); }
      .dsh-mermaid-zoom-button:hover::after { opacity: 1; transform: translate(-50%, 0); }
      .dsh-mermaid-tool[data-tip='']::after,
      .dsh-mermaid-zoom-button[data-tip='']::after { content: none; }

      /* ---- theme menu ---------------------------------------------------- */
      /* One shared popover, portaled to <body>: a card's scroll container can
         never clip it. The swatch is drawn from the variant's own palette. */
      .dsh-mermaid-theme-menu {
        position: fixed;
        z-index: ${THEME_Z_INDEX};
        min-width: 212px;
        padding: 5px;
        border: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
        border-radius: var(--dsw-radius-md, 12px);
        background: var(--dsw-alias-bg-layer-1, #fff);
        box-shadow: var(--dsw-elevation-prominent, 0 12px 32px rgba(0, 0, 0, 0.12));
        font: 13px/20px var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif);
        animation: dsh-mermaid-menu-in 120ms var(--ds-ease-in-out, ease);
      }
      @keyframes dsh-mermaid-menu-in { from { opacity: 0; transform: translateY(-2px); } }
      .dsh-mermaid-theme-menu[hidden] { display: none !important; }
      .dsh-mermaid-theme-item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 5px 8px;
        border: 0;
        border-radius: var(--dsw-radius-sm, 8px);
        background: transparent;
        color: var(--dsw-alias-label-primary, #0f1115);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .dsh-mermaid-theme-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
      .dsh-mermaid-theme-item:focus-visible {
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: -1px;
      }
      .dsh-mermaid-theme-item[aria-checked='true'] { background: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.1)); }
      .dsh-mermaid-theme-swatch { display: inline-flex; flex: none; gap: 2px; }
      .dsh-mermaid-theme-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12);
      }
      .dsh-mermaid-theme-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-mermaid-theme-check {
        display: inline-flex;
        flex: none;
        width: 16px;
        height: 16px;
        color: var(--dsw-alias-state-business-primary, #4d6bfe);
        opacity: 0;
      }
      .dsh-mermaid-theme-item[aria-checked='true'] .dsh-mermaid-theme-check { opacity: 1; }
      .dsh-mermaid-theme-check svg { display: block; width: 16px; height: 16px; }

      /* ---- diagram viewport ------------------------------------------- */
      /* The card itself is the surface — no second box inside it. */
      /* content-visibility:auto was measured here and rejected: it does cut
         the insert/layout segment by 70% (15.0ms -> 4.3ms for nine diagrams,
         1.3% of a pass), but a card the browser is skipping has only its
         intrinsic size, so a never-scrolled diagram paints blank in a
         full-page capture and prints blank, and the page height is wrong until
         each card is rendered once. This is a reading surface; a diagram that
         silently disappears when printed is not worth 1.3%. */
      .dsh-mermaid-canvas {
        display: block;
        /* NOT a scroll container: the diagram is always pinned to the column
           width and a tall one simply makes the card taller. A scrollable
           inner box would swallow wheel events over the diagram and stop the
           message list from scrolling while the pointer is on a chart. */
        padding: 6px 22px 20px;
      }
      .dsh-mermaid-canvas[hidden] { display: none !important; }
      /* Layout preference (header button, persisted): the default caps tall
         diagrams and lets them scroll inside the card; "grow" lets the card
         follow the diagram height instead (no nested scrollbar, the page
         scrolls over it). Toggle via the header's layout button. */
      html[data-dsh-mermaid-fit='scroll'] .dsh-mermaid-canvas {
        max-height: min(900px, 85vh);
        overflow: auto;
        overscroll-behavior: auto;
      }
      .dsh-mermaid-canvas svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
      /* fitReading pins the width whenever the diagram has to scale: wide ones
         shrink to the column, small-and-short ones grow a little. Tall
         diagrams keep natural size and grow the card instead. */
      .dsh-mermaid-canvas.dsh-mermaid-fit svg {
        width: var(--dsh-mermaid-fit-width);
        max-width: none !important;
        height: auto !important;
      }
      .dsh-mermaid-canvas.dsh-mermaid-zoomable { cursor: zoom-in; }
      @keyframes dsh-mermaid-ink { from { opacity: 0; } }
      .dsh-mermaid-canvas svg { animation: dsh-mermaid-ink 160ms var(--ds-ease-in-out, ease); }

      /* ---- failure note ----------------------------------------------- */
      /* A calm inline panel: human summary first, parser internals one click
         away. The fence below stays editable, so the note never needs to own
         the whole card. */
      .dsh-mermaid-error {
        margin: 0 22px 16px;
        padding: 10px 12px;
        border-radius: var(--dsw-radius-md, 12px);
        background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
        background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #f59e0b) 7%, transparent);
        color: var(--dsw-alias-label-secondary, #61666b);
      }
      .dsh-mermaid-error[hidden] { display: none !important; }
      .dsh-mermaid-error.is-error {
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ec1313) 7%, transparent);
      }
      .dsh-mermaid-error-main { display: flex; align-items: flex-start; gap: 8px; }
      .dsh-mermaid-error-icon {
        display: flex;
        flex: none;
        margin-top: 1px;
        color: var(--dsw-alias-state-warn-primary, #f59e0b);
      }
      .dsh-mermaid-error.is-error .dsh-mermaid-error-icon { color: var(--dsw-alias-state-error-primary, #ec1313); }
      .dsh-mermaid-error-icon svg { display: block; width: 16px; height: 16px; }
      .dsh-mermaid-error-body { min-width: 0; }
      .dsh-mermaid-error-title {
        margin: 0;
        color: var(--dsw-alias-label-primary, #0f1115);
        font-size: 13px;
        font-weight: 500;
        line-height: 20px;
      }
      .dsh-mermaid-error-note {
        margin: 1px 0 0;
        color: var(--dsw-alias-label-tertiary, #81868c);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-mermaid-error-details { margin-top: 4px; }
      .dsh-mermaid-error-details summary {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--dsw-alias-label-secondary, #61666b);
        font-size: 12px;
        line-height: 18px;
        list-style: none;
        cursor: pointer;
      }
      .dsh-mermaid-error-details summary::-webkit-details-marker { display: none; }
      .dsh-mermaid-error-details summary::after {
        width: 5px;
        height: 5px;
        border-right: 1.5px solid currentColor;
        border-bottom: 1.5px solid currentColor;
        content: '';
        transform: rotate(45deg) translateY(-1px);
        transition: transform 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-error-details[open] summary::after { transform: rotate(-135deg) translateY(-1px); }
      .dsh-mermaid-error-details summary:hover { color: var(--dsw-alias-label-primary, #0f1115); }
      .dsh-mermaid-error-details summary:focus-visible {
        border-radius: var(--dsw-radius-xs, 4px);
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: 2px;
      }
      .dsh-mermaid-error-pre {
        margin: 6px 0 0;
        padding: 8px 10px;
        max-height: 160px;
        overflow: auto;
        border: 0.5px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.04));
        border-radius: var(--dsw-radius-sm, 8px);
        background: var(--dsw-alias-bg-base, #fff);
        color: var(--dsw-alias-label-secondary, #61666b);
        font: 11px/18px var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .dsh-mermaid [hidden] { display: none !important; }

      /* ---- full-window viewer ----------------------------------------- */
      .dsh-mermaid-zoom {
        position: fixed;
        inset: 0;
        z-index: ${ZOOM_Z_INDEX};
        background: var(--dsw-alias-bg-mask-3, rgba(0, 0, 0, 0.48));
        -webkit-backdrop-filter: blur(12px) saturate(140%);
        backdrop-filter: blur(12px) saturate(140%);
        overscroll-behavior: contain;
        animation: dsh-mermaid-zoom-in 160ms var(--ds-ease-in-out, ease);
      }
      @keyframes dsh-mermaid-zoom-in { from { opacity: 0; } }
      .dsh-mermaid-zoom[hidden] { display: none !important; }
      .dsh-mermaid-zoom-stage {
        position: absolute;
        inset: 0;
        overflow: hidden;
        touch-action: none;
        cursor: grab;
      }
      .dsh-mermaid-zoom-stage:active { cursor: grabbing; }
      .dsh-mermaid-zoom-pan {
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: 0 0;
        will-change: transform;
      }
      /* The paper under the diagram. It uses the same surface the diagram was
         themed for, so its edge-label backgrounds keep matching off the card,
         and it is a framed print rather than a tight crop. */
      .dsh-mermaid-zoom-paper {
        box-sizing: content-box;
        background: var(--dsw-alias-markdown-code-block, #f9fafb);
        border-radius: var(--dsw-radius-lg, 16px);
        box-shadow:
          var(--dsw-elevation-prominent, 0 0 1px 0 rgba(0, 0, 0, 0.2), 0 12px 32px 0 rgba(0, 0, 0, 0.08)),
          0 24px 80px rgba(0, 0, 0, 0.24);
        padding: ${ZOOM_PAPER_PAD}px;
      }
      .dsh-mermaid-zoom-paper > svg { display: block; }
      /* The controls float in a pill instead of stretching a bar across the
         window: the diagram keeps the whole stage, the chrome stays light. */
      .dsh-mermaid-zoom-bar {
        position: absolute;
        top: 16px;
        left: 50%;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 2px;
        max-width: calc(100% - 32px);
        padding: 4px;
        border: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
        border-radius: var(--dsw-radius-md, 12px);
        background: var(--dsw-alias-bg-layer-1, #fff);
        box-shadow: var(--dsw-elevation-prominent, 0 12px 32px rgba(0, 0, 0, 0.12));
        color: var(--dsw-alias-label-secondary, #61666b);
        transform: translateX(-50%);
        animation: dsh-mermaid-bar-in 180ms var(--ds-ease-in-out, ease);
      }
      @keyframes dsh-mermaid-bar-in { from { opacity: 0; transform: translate(-50%, -4px); } }
      .dsh-mermaid-zoom-kind {
        max-width: 160px;
        margin-right: 4px;
      }
      .dsh-mermaid-zoom-level {
        min-width: 48px;
        padding: 0 2px;
        color: var(--dsw-alias-label-secondary, #61666b);
        font: 12px/20px var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
        font-variant-numeric: tabular-nums;
        text-align: center;
      }
      .dsh-mermaid-zoom-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: var(--dsw-radius-sm, 8px);
        background: transparent;
        color: var(--dsw-alias-label-secondary, #61666b);
        cursor: pointer;
        transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
      }
      .dsh-mermaid-zoom-button svg { display: block; width: 16px; height: 16px; }
      .dsh-mermaid-zoom-button:hover {
        color: var(--dsw-alias-label-primary, #0f1115);
        background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
      }
      .dsh-mermaid-zoom-button:focus-visible {
        outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, #4176e6));
        outline-offset: 2px;
      }
      .dsh-mermaid-zoom-button[data-dsh-mermaid-zoom-action='close'] { margin-left: 2px; }
      .dsh-mermaid-zoom-hint {
        position: absolute;
        left: 50%;
        bottom: 20px;
        z-index: 1;
        padding: 4px 10px;
        border: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-1, #fff);
        box-shadow: var(--dsw-elevation-soft, 0 4px 12px rgba(0, 0, 0, 0.06));
        color: var(--dsw-alias-label-tertiary, #81868c);
        font-size: 12px;
        line-height: 18px;
        white-space: nowrap;
        pointer-events: none;
        transform: translateX(-50%);
      }
      @media (max-width: 640px) {
        .dsh-mermaid-zoom-hint { display: none; }
        .dsh-mermaid-zoom-kind { display: none; }
        .dsh-mermaid-zoom-bar { top: 12px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dsh-mermaid-canvas svg,
        .dsh-mermaid-zoom,
        .dsh-mermaid-zoom-bar,
        .dsh-mermaid-theme-menu { animation: none; }
        .dsh-mermaid-tool::after,
        .dsh-mermaid-zoom-button::after { transition: none; }
      }
      `
      ;(document.head ?? document.documentElement).append(style)
      return () => style.remove()
    }, `${PLUGIN_ID}: styles`)

    // ---- Mermaid --------------------------------------------------------
    /** A load failure, tagged so the note can use the load-failed copy. */
    const loadFailure = (message) => Object.assign(new Error(message), { dshMermaidLoad: true })

    const loadMermaid = () => {
      if (window.mermaid !== undefined) return Promise.resolve(window.mermaid)
      if (state.mermaid !== null) return state.mermaid
      state.mermaid = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = MERMAID_CDN
        script.async = true
        script.onload = () => {
          state.scripts.delete(script)
          if (window.mermaid !== undefined) resolve(window.mermaid)
          else reject(loadFailure(`window.mermaid is missing after loading ${MERMAID_CDN}`))
        }
        script.onerror = () => {
          state.scripts.delete(script)
          script.remove()
          // Let a later fence retry instead of pinning the page to one failed
          // request.
          state.mermaid = null
          reject(loadFailure(MERMAID_CDN))
        }
        state.scripts.add(script)
        ;(document.head ?? document.documentElement).append(script)
      })
      return state.mermaid
    }

    /**
     * Start the engine download as soon as a fence looks like a diagram.
     *
     * The settle window and the CDN fetch used to run one after the other, so
     * the first diagram in a conversation paid both: 250ms of quiet plus a ~1MB
     * script plus DNS and TLS. Firing the fetch when the fence is *detected*
     * overlaps them and takes the settle window off the critical path. The weak
     * set bounds it to one attempt per block, so a streaming fence cannot queue
     * a request per token, and the whole function is a no-op once the engine is
     * on its way.
     */
    const prefetched = new WeakSet()
    const prefetchEngine = (block) => {
      if (window.mermaid !== undefined || state.mermaid !== null) return
      if (prefetched.has(block)) return
      prefetched.add(block)
      const code = sourceOf(block)
      if (code === null || !isMermaidFence(block, code)) return
      // A failed prefetch stays invisible: the render that follows owns the
      // error note and retries the load itself.
      loadMermaid().catch(() => {})
    }

    /** The active color scheme, from the shell's theme service or the system. */
    const themeScheme = () => {
      const theme = ctx.get('theme')
      const scheme = theme?.getTheme?.()?.active?.colorScheme
      if (scheme === 'dark') return 'dark'
      if (scheme === 'light') return 'light'
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } catch {
        return 'light'
      }
    }

    // Keep a parse failure out of the page: this plugin renders its own note.
    // The three flags after the variant are the plugin's own contract, not theme
    // data: a variant must never be able to drop them. Without
    // suppressErrorRendering, any parse failure (including a half-written fence
    // during streaming) makes mermaid draw its own "Syntax error in text"
    // diagram into <body>, where it survives every later successful re-render.
    //
    // `initialize` is a process-global configuration call and it is *not* free:
    // it deep-copies the whole config several times and rebuilds the base theme
    // (a `new Theme()` plus ~95 colour operations, run twice) on every call.
    // Measured at 2-3ms here, and the plugin used to pay it once per diagram per
    // paint — 3.2% of a nine-diagram pass, and up to 15% of a message made of
    // small diagrams. Nothing needs that: `mermaid.render` begins with its own
    // internal `reset()`, which re-derives the per-render config from the site
    // config, so the site config only has to be right, not freshly written. One
    // call per (scheme, variant) is therefore enough, and the pair is exactly
    // what the key holds.
    let configuredKey = null
    let configuredOn = null
    /** @param scheme - the active colour scheme, read once by the caller. */
    const configure = (mermaid, scheme) => {
      const key = `${scheme}|${state.variant}`
      // The instance check covers a shell that swaps `window.mermaid` for a
      // fresh one, which would leave our key pointing at a config nobody applied.
      if (configuredKey === key && configuredOn === mermaid) return
      mermaid.initialize({
        ...configForVariant(scheme, state.variant),
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
      })
      configuredKey = key
      configuredOn = mermaid
    }

    // ---- DOM ------------------------------------------------------------
    /** The block's `[data-code-block-content]` body, when the layout has one. */
    const contentOf = (block) => block.querySelector('[data-code-block-content]')

    /**
     * The wrapper around the block's `[data-code-block-banner]`, which is the
     * element the shell's banner occupies. Hiding that wrapper hides the whole
     * row; hiding the banner alone would leave its border and padding behind.
     */
    const bannerWrapOf = (block) => block.querySelector('[data-code-block-banner]')?.parentElement ?? null

    /** The fence language the surface prints, when it prints one at all. */
    const bannerLabel = (block) => {
      const banner = block.querySelector('[data-code-block-banner]')
      if (banner === null) return null
      const head = banner.firstElementChild ?? banner
      const text = (head.textContent ?? '').trim().toLowerCase()
      return text === '' ? null : text.split(/\s+/)[0]
    }

    /**
     * The fence source, or null when this block is not an unhighlighted fence.
     * A highlighted fence wraps its shiki output in a `<div>`, so its body's
     * first element is never the `<pre>` we look for.
     */
    const sourceOf = (block) => {
      const content = contentOf(block)
      if (content !== null) {
        const first = content.firstElementChild
        if (first === null || first.tagName !== 'PRE') return null
      }
      const pre = (content ?? block).querySelector('pre')
      if (pre === null) return null
      const code = (pre.textContent ?? '').replace(/\s+$/, '')
      return code === '' ? null : code
    }

    const isMermaidFence = (block, code) => (
      bannerLabel(block) === LANGUAGE || opensDiagram(code)
    )

    /**
     * Hand the main thread back to the browser for one turn.
     *
     * This is the difference between a serialized queue that *looks* polite and
     * one that actually yields. Mermaid 11 replaces fastdom's
     * `requestAnimationFrame` with `queueMicrotask` — its source says so:
     * "requestAnimationFrame is too slow compared to queueMicrotask" — so every
     * `await` inside `mermaid.render` resumes inside the same task. Nine
     * cards repainting through a promise chain therefore ran as a small number
     * of very long tasks (measured: 561ms of work, four long tasks, the longest
     * 157ms) during which the browser could not paint, scroll or take input.
     * One macrotask between jobs leaves the total work and the strict
     * serialization untouched — two renders never overlap — and caps the
     * longest block at one diagram. On this machine's full-corpus run Mermaid
     * already returned to the event loop between renders, so the change shows no
     * wall-clock difference there; it is insurance against the case the audit
     * did measure (five renders in one uninterrupted 226ms task), and it is what
     * makes the "off screen now, render later" hand-off observable.
     *
     * `MessageChannel` rather than `setTimeout(0)`: nested timers are clamped to
     * 4ms after five levels, and a queue that yields on every job nests deeply.
     * `scheduler.yield()` is preferred where the browser has it, because it
     * marks the yield as such instead of looking like newly arrived work.
     */
    const yieldToMain = () => {
      const scheduler = typeof window === 'undefined' ? undefined : window.scheduler
      if (scheduler !== undefined && typeof scheduler.yield === 'function') {
        return Promise.resolve(scheduler.yield()).then(() => undefined, () => undefined)
      }
      if (typeof MessageChannel !== 'function') {
        return new Promise((resolve) => window.setTimeout(resolve, 0))
      }
      return new Promise((resolve) => {
        // A fresh channel per yield costs one microtask and bundles no state
        // between two jobs, which is worth more than the reusable-channel
        // bookkeeping it saves.
        const channel = new MessageChannel()
        channel.port1.onmessage = () => {
          channel.port1.close()
          resolve()
        }
        channel.port2.postMessage(0)
      })
    }

    /**
     * Queue one render job. Jobs stay strictly serialized — mermaid keeps its
     * configuration and its temporary SVG host in module scope, so two renders
     * must never be in flight together — but each one now starts after a real
     * yield instead of on the microtask right after its predecessor.
     */
    const enqueue = (task) => {
      const run = state.queue.then(yieldToMain).then(task)
      state.queue = run.then(() => undefined, () => undefined)
      return run
    }

    /** Copy plain text, preferring the async clipboard API. */
    const writeClipboard = async (text) => {
      try {
        if (navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text)
          return true
        }
      } catch {
        /* permission or browser policy: fall through to the legacy path */
      }
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0'
        ;(document.body ?? document.documentElement).append(area)
        area.select()
        const copied = typeof document.execCommand === 'function' && document.execCommand('copy')
        area.remove()
        return copied === true
      } catch {
        return false
      }
    }

    /**
     * Fit a diagram to the card: a wide one is scaled down to the canvas width
     * (the stylesheet's `max-width:100%` does the shrinking), a small one is
     * magnified up to MAX_READING_SCALE inside the canvas' height budget. The
     * whole diagram is always visible; detail comes from the viewer. Called
     * after every render, after the source view returns, and whenever the
     * card's width changes.
     */
    const fitReading = (record) => {
      const svg = record.canvas.querySelector('svg')
      if (svg === null || record.canvas.hidden) return
      // Off screen, a measurement costs a synchronous layout for a card nobody
      // is looking at. Drop the memo and let the visibility observer take the
      // measurement when the card comes back into range — the SVG keeps its
      // natural size and the stylesheet's `max-width` in the meantime.
      if (record.visible === false) {
        record.fitKey = undefined
        return
      }
      const size = naturalSize(svg)
      if (!(size.width > 0) || !(size.height > 0)) return
      const style = getComputedStyle(record.canvas)
      const padX = (Number.parseFloat(style.paddingLeft) || 0)
        + (Number.parseFloat(style.paddingRight) || 0)
      const available = record.canvas.clientWidth - padX
      if (!(available > 0)) {
        // Hidden ancestor (collapsed surface/tab): do not persist a stale size.
        record.fitKey = undefined
        return
      }
      // Width is the only axis the card ever fits to: a wide diagram shrinks
      // to the column, and a tall one just makes the card taller (no inner
      // scroll container, so wheel events always reach the message list).
      const fit = available / size.width
      // Only small-and-short diagrams grow; a long sequence/C4 diagram keeps
      // 1:1 instead of becoming a poster.
      const maxScale = size.height > TALL_DIAGRAM_HEIGHT ? 1 : MAX_READING_SCALE
      const scale = Math.min(fit, maxScale)

      // Setting the svg width changes the canvas height, which wakes the
      // ResizeObserver; this key makes the second pass a no-op instead of a
      // write/measure loop.
      const key = `${Math.round(available)}|${Math.round(size.width)}|${Math.round(size.height)}`
      if (record.fitKey === key) return
      record.fitKey = key

      const sized = Math.abs(scale - 1) > 0.001
      record.canvas.classList.toggle('dsh-mermaid-fit', sized)
      if (sized) {
        record.canvas.style.setProperty('--dsh-mermaid-fit-width', `${Math.max(1, Math.round(size.width * scale))}px`)
      } else {
        // Natural size already matches the column: let mermaid's own
        // `max-width` cap size it, which keeps resizes clean.
        record.canvas.style.removeProperty('--dsh-mermaid-fit-width')
      }
    }

    /** Flip the global layout preference and refresh every card's chrome. */
    const toggleFitMode = () => {
      state.fitMode = state.fitMode === 'scroll' ? 'grow' : 'scroll'
      storeFitMode(state.fitMode)
      document.documentElement.dataset.dshMermaidFit = state.fitMode
      for (const record of state.records.values()) {
        // A new layout starts at the top of the diagram either way.
        record.canvas.scrollTop = 0
        applyView(record)
      }
    }

    /** Swap the copy control to its confirmation state for a moment. */
    const flashCopied = (record) => {
      record.copy.innerHTML = ICONS.check
      record.copy.classList.add('is-copied')
      record.copy.dataset.tip = t('copied')
      record.copy.setAttribute('aria-label', t('copied'))
      if (record.copyTimer !== undefined) window.clearTimeout(record.copyTimer)
      record.copyTimer = window.setTimeout(() => {
        record.copyTimer = undefined
        record.copy.innerHTML = ICONS.copy
        record.copy.classList.remove('is-copied')
        record.copy.dataset.tip = t('copySource')
        record.copy.setAttribute('aria-label', t('copySource'))
      }, 1000)
    }

    const copySource = (record) => {
      void writeClipboard(record.code ?? '').then((ok) => {
        if (ok && !state.disposed) flashCopied(record)
      })
    }

    /**
     * Show the diagram, the untouched original fence, or the failure note.
     * A failed block keeps its fence visible and drops the view controls:
     * there is no diagram to switch to or to enlarge.
     */
    const applyView = (record) => {
      // Re-resolve the body: React may have swapped the element out since the
      // record was created.
      const content = contentOf(record.block)
      record.content = content
      const failed = record.failed === true
      const readable = record.done === true && !failed && !record.showSource
      record.kind.textContent = record.kindName ?? LANGUAGE
      record.head.dataset.dshMermaidKind = record.kindName ?? LANGUAGE
      record.canvas.hidden = !readable
      record.canvas.classList.toggle('dsh-mermaid-zoomable', readable)
      record.canvas.title = readable ? t('zoom') : ''
      record.zoom.hidden = !readable
      record.source.hidden = failed
      record.source.setAttribute('aria-pressed', String(record.showSource))
      const sourceLabel = record.showSource ? t('showDiagram') : t('showSource')
      record.source.dataset.tip = sourceLabel
      record.source.setAttribute('aria-label', sourceLabel)
      const copyLabel = t('copySource')
      if (record.copyTimer === undefined) {
        record.copy.dataset.tip = copyLabel
        record.copy.setAttribute('aria-label', copyLabel)
      }
      record.copy.hidden = false
      const layoutTip = state.fitMode === 'scroll' ? t('layoutGrowAction') : t('layoutScrollAction')
      record.layout.dataset.tip = layoutTip
      record.layout.setAttribute('aria-label', layoutTip)
      record.layout.setAttribute('aria-pressed', String(state.fitMode === 'scroll'))
      record.zoom.dataset.tip = t('zoom')
      record.zoom.setAttribute('aria-label', t('zoom'))
      const themeTip = `${t('theme')} · ${themeLabel(state.variant)}`
      record.theme.dataset.tip = themeTip
      record.theme.setAttribute('aria-label', themeTip)
      record.error.hidden = !failed
      if (failed) {
        record.error.classList.toggle('is-error', record.errorKind === 'load')
        record.errorTitle.textContent = t(record.errorKind === 'load' ? 'loadFailed' : 'renderFailed')
        record.errorNote.textContent = t(record.errorKind === 'load' ? 'loadFailedNote' : 'renderFailedNote')
        record.errorSummary.textContent = t('details')
      }
      if (content !== null) content.toggleAttribute(HIDDEN, !record.showSource && !failed)
      // The shell's own code banner would be a second, redundant header: the
      // plugin-owned header stays in both views. The wrapper node itself
      // remains React's; only our attribute is toggled.
      const banner = bannerWrapOf(record.block)
      if (banner !== null) banner.toggleAttribute(BANNER_HIDDEN, true)
    }

    /** A plugin-owned icon button with a data-tip tooltip. */
    const toolButton = (action, artwork) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'dsh-mermaid-tool'
      button.dataset.dshMermaidTool = action
      button.innerHTML = artwork
      return button
    }

    /**
     * Create the holder for a block — or recreate it when React replaced the
     * block's children and dropped it. The holder is appended last so React's
     * own `bannerWrap` + `content` children keep their positions; the card is
     * laid out as a column in CSS so the holder reads *above* the source.
     */
    const ensureRecord = (block) => {
      const known = state.records.get(block)
      if (known !== undefined && known.holder.isConnected) return known
      if (known !== undefined) {
        if (state.menu !== null && state.menu.opener === known.theme) state.menu.close()
        if (known.canvasObserver !== undefined) known.canvasObserver.disconnect()
        if (known.copyTimer !== undefined) window.clearTimeout(known.copyTimer)
        unwatchVisibility(known)
        known.holder.remove()
        state.records.delete(block)
      }
      const content = contentOf(block)

      const holder = document.createElement('div')
      holder.className = 'dsh-mermaid'
      holder.dataset.dshMermaidHolder = '1'

      const head = document.createElement('div')
      head.className = 'dsh-mermaid-head'
      const kind = document.createElement('span')
      kind.className = 'dsh-mermaid-kind'
      kind.textContent = LANGUAGE
      const tools = document.createElement('div')
      tools.className = 'dsh-mermaid-tools'
      const layout = toolButton('layout', ICONS.layout)
      const theme = toolButton('theme', ICONS.palette)
      theme.setAttribute('aria-haspopup', 'menu')
      theme.setAttribute('aria-expanded', 'false')
      const copy = toolButton('copy', ICONS.copy)
      const source = toolButton('source', ICONS.source)
      const zoom = toolButton('zoom', ICONS.expand)
      zoom.hidden = true
      tools.append(layout, theme, copy, source, zoom)
      head.append(kind, tools)

      const canvas = document.createElement('div')
      canvas.className = 'dsh-mermaid-canvas'
      canvas.hidden = true

      // The failure note lives inside the holder, so writing it never looks
      // like a change to the fence itself — the observer ignores holder
      // subtrees.
      const error = document.createElement('div')
      error.className = 'dsh-mermaid-error'
      error.hidden = true
      const errorMain = document.createElement('div')
      errorMain.className = 'dsh-mermaid-error-main'
      const errorIcon = document.createElement('span')
      errorIcon.className = 'dsh-mermaid-error-icon'
      errorIcon.innerHTML = ICONS.warning
      const errorBody = document.createElement('div')
      errorBody.className = 'dsh-mermaid-error-body'
      const errorTitle = document.createElement('p')
      errorTitle.className = 'dsh-mermaid-error-title'
      const errorNote = document.createElement('p')
      errorNote.className = 'dsh-mermaid-error-note'
      const errorDetails = document.createElement('details')
      errorDetails.className = 'dsh-mermaid-error-details'
      const errorSummary = document.createElement('summary')
      const errorPre = document.createElement('pre')
      errorPre.className = 'dsh-mermaid-error-pre'
      errorDetails.append(errorSummary, errorPre)
      errorBody.append(errorTitle, errorNote, errorDetails)
      errorMain.append(errorIcon, errorBody)
      error.append(errorMain)

      const record = {
        block,
        content,
        holder,
        head,
        kind,
        tools,
        layout,
        theme,
        copy,
        source,
        zoom,
        canvas,
        error,
        errorTitle,
        errorNote,
        errorSummary,
        errorPre,
        /** the header keyword for the current text */
        kindName: LANGUAGE,
        code: null,
        showSource: false,
        /** the current text rendered successfully */
        done: false,
        /** `${scheme}|${variant}` the canvas was last painted with */
        paintedKey: null,
        /** the text changed while the card was off screen */
        wantsPaint: false,
        /** on screen (true), off screen (false), or not yet observed (undefined) */
        visible: undefined,
        /** the current text exhausted its retries and shows the note */
        failed: false,
        /** "load" or "render", for the note's copy and accent */
        errorKind: 'render',
        /** consecutive failures for the current text */
        failures: 0,
        /** a render for the current text is in flight */
        pending: false,
        /** the copy-confirmation timer */
        copyTimer: undefined,
        /** per-record width observer, when the platform has one */
        canvasObserver: undefined,
      }
      copy.addEventListener('click', () => copySource(record))
      layout.addEventListener('click', () => toggleFitMode())
      theme.addEventListener('click', () => openThemeMenu(theme))
      source.addEventListener('click', () => {
        record.showSource = !record.showSource
        applyView(record)
        if (!record.showSource) fitReading(record)
      })
      zoom.addEventListener('click', () => openViewer(record))
      canvas.addEventListener('click', () => {
        if (record.done === true && !record.showSource) openViewer(record)
      })
      holder.append(head, canvas, error)
      block.append(holder)
      state.records.set(block, record)
      watchVisibility(record)
      if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(() => fitReading(record))
        observer.observe(canvas)
        record.canvasObserver = observer
      }
      return record
    }

    // ---- enlarged viewer ------------------------------------------------
    // Mermaid fits its SVG to the fence (`width="100%"` and a `max-width`),
    // which is exactly what turns a wide diagram into unreadable type. The
    // viewer draws a *clone* of that SVG at the size mermaid gave it and scales
    // the clone from there; the fence's own copy is never touched.

    /** The natural size of a rendered diagram, in mermaid's own pixels. */
    const naturalSize = (svg) => {
      const box = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
      if (box.length === 4 && box.every((n) => Number.isFinite(n)) && box[2] > 0 && box[3] > 0) {
        return { width: box[2], height: box[3] }
      }
      const pixels = (name) => {
        const value = svg.getAttribute(name) ?? ''
        if (value.includes('%')) return Number.NaN
        const size = Number.parseFloat(value)
        return Number.isFinite(size) && size > 0 ? size : Number.NaN
      }
      const width = pixels('width')
      const height = pixels('height')
      if (Number.isFinite(width) && Number.isFinite(height)) return { width, height }
      const rect = svg.getBoundingClientRect()
      return { width: rect.width || 800, height: rect.height || 600 }
    }

    /** The part of the stage the floating toolbar does not cover. */
    const viewportOf = (viewer) => {
      const rect = viewer.stage.getBoundingClientRect()
      const top = viewer.bar.offsetTop + viewer.bar.offsetHeight + 8
      return { width: Math.max(1, rect.width), height: Math.max(1, rect.height - top), top }
    }

    /**
     * The scale that shows the whole diagram. Small diagrams may be magnified
     * up to ZOOM_FIT_MAX so "fit window" actually uses the window; larger ones
     * are still shrunk to fit exactly as before.
     */
    const fitScaleOf = (viewer) => {
      const view = viewportOf(viewer)
      return Math.min(
        ZOOM_FIT_MAX,
        Math.max(1, view.width - 2 * ZOOM_PAD) / viewer.width,
        Math.max(1, view.height - 2 * ZOOM_PAD) / viewer.height,
      )
    }

    /** Below the fit scale would mean "smaller than the whole diagram". */
    const minScaleOf = (viewer) => Math.min(ZOOM_MIN, fitScaleOf(viewer))

    const clampScale = (viewer, scale) => Math.min(ZOOM_MAX, Math.max(minScaleOf(viewer), scale))

    /**
     * Where the diagram sits: a diagram bigger than the window stays reachable
     * by panning, a smaller one is kept centered — dragging it around would
     * only ever be a way to lose it.
     */
    const placeIn = (viewer, scale, x, y) => {
      const view = viewportOf(viewer)
      const width = viewer.width * scale
      const height = viewer.height * scale
      return {
        x: width <= view.width
          ? (view.width - width) / 2
          : Math.min(0, Math.max(view.width - width, x)),
        y: height <= view.height
          ? view.top + (view.height - height) / 2
          : Math.min(view.top, Math.max(view.top + view.height - height, y)),
      }
    }

    /** Apply a scale and a position, clamped, and report the scale taken. */
    const showViewer = (viewer, scale, x, y, atFit = false) => {
      const limited = clampScale(viewer, scale)
      const placed = placeIn(viewer, limited, x, y)
      viewer.scale = limited
      viewer.x = placed.x
      viewer.y = placed.y
      viewer.atFit = atFit
      viewer.pan.style.transform = `translate(${placed.x}px, ${placed.y}px) scale(${limited})`
      viewer.level.textContent = `${Math.round(limited * 100)}%`
    }

    /** Show the whole diagram, centered. */
    const fitViewer = (viewer) => {
      const view = viewportOf(viewer)
      const scale = fitScaleOf(viewer)
      showViewer(viewer, scale, (view.width - viewer.width * scale) / 2, view.top + (view.height - viewer.height * scale) / 2, true)
    }

    /** Scale about a stage point, so the pixel under it stays put. */
    const zoomViewerAt = (viewer, scale, pointX, pointY) => {
      const ratio = clampScale(viewer, scale) / viewer.scale
      showViewer(viewer, viewer.scale * ratio, pointX - (pointX - viewer.x) * ratio, pointY - (pointY - viewer.y) * ratio)
    }

    /** The middle of the visible area, for zooming without a pointer. */
    const stageCenter = (viewer) => {
      const view = viewportOf(viewer)
      return { x: view.width / 2, y: view.top + view.height / 2 }
    }

    /**
     * Build the viewer. One element serves every diagram and lives as long as
     * the fiber: listeners are attached here and guard on `viewer.record`, so
     * opening and closing costs no listener bookkeeping.
     */
    const buildViewer = () => {
      const el = document.createElement('div')
      el.className = 'dsh-mermaid-zoom'
      el.dataset.dshMermaidZoom = '1'
      el.hidden = true
      el.setAttribute('role', 'dialog')
      el.setAttribute('aria-modal', 'true')
      const stage = document.createElement('div')
      stage.className = 'dsh-mermaid-zoom-stage'
      const pan = document.createElement('div')
      pan.className = 'dsh-mermaid-zoom-pan'
      stage.append(pan)
      const bar = document.createElement('div')
      bar.className = 'dsh-mermaid-zoom-bar'
      const kind = document.createElement('span')
      kind.className = 'dsh-mermaid-zoom-kind'
      const level = document.createElement('span')
      level.className = 'dsh-mermaid-zoom-level'
      level.setAttribute('aria-live', 'polite')
      const button = (action, artwork) => {
        const node = document.createElement('button')
        node.type = 'button'
        node.className = 'dsh-mermaid-zoom-button'
        node.dataset.dshMermaidZoomAction = action
        node.innerHTML = artwork
        return node
      }
      const zoomOut = button('out', ICONS.minus)
      const zoomIn = button('in', ICONS.plus)
      const fit = button('fit', ICONS.expand)
      const closeButton = button('close', ICONS.close)
      bar.append(kind, zoomOut, level, zoomIn, fit, closeButton)
      const hint = document.createElement('span')
      hint.className = 'dsh-mermaid-zoom-hint'
      el.append(stage, bar, hint)
      const viewer = {
        el,
        stage,
        pan,
        bar,
        kind,
        level,
        zoomOut,
        zoomIn,
        fit,
        hint,
        closeButton,
        /** the diagram on screen, or null while closed */
        record: null,
        /** the element to hand focus back to on close */
        focus: null,
        /** the pointer gesture in flight */
        drag: null,
        width: 0,
        height: 0,
        scale: 1,
        x: 0,
        y: 0,
        atFit: true,
      }
      viewer.refreshLabels = () => {
        el.setAttribute('aria-label', t('zoomViewer'))
        for (const [node, label] of [
          [zoomOut, t('zoomOut')],
          [zoomIn, t('zoomIn')],
          [fit, t('zoomFit')],
          [closeButton, t('zoomClose')],
        ]) {
          node.dataset.tip = label
          node.setAttribute('aria-label', label)
        }
        hint.textContent = t('zoomHint')
      }
      viewer.refreshLabels()

      const offs = []
      const on = (node, type, handler, options) => {
        node.addEventListener(type, handler, options)
        offs.push(() => node.removeEventListener(type, handler, options))
      }
      const active = () => viewer.record !== null

      on(zoomOut, 'click', () => {
        if (!active()) return
        const point = stageCenter(viewer)
        zoomViewerAt(viewer, viewer.scale / ZOOM_STEP, point.x, point.y)
      })
      on(zoomIn, 'click', () => {
        if (!active()) return
        const point = stageCenter(viewer)
        zoomViewerAt(viewer, viewer.scale * ZOOM_STEP, point.x, point.y)
      })
      on(fit, 'click', () => { if (active()) fitViewer(viewer) })
      on(closeButton, 'click', () => closeViewer())
      // Bound to the overlay rather than the stage: a wheel anywhere over the
      // modal must not scroll the conversation behind it, including over the
      // toolbar, where there is nothing to zoom.
      on(el, 'wheel', (event) => {
        if (!active()) return
        event.preventDefault()
        if (bar.contains(event.target)) return
        const rect = stage.getBoundingClientRect()
        // A wheel notch is ~100px; one line of text scroll is ~3px.
        const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.002))
        zoomViewerAt(viewer, viewer.scale * factor, event.clientX - rect.left, event.clientY - rect.top)
      }, { passive: false })
      on(stage, 'pointerdown', (event) => {
        if (!active() || event.button !== 0) return
        viewer.drag = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          originX: viewer.x,
          originY: viewer.y,
          target: event.target,
          moved: false,
        }
        // Capture is a convenience (dragging past the edge keeps working); a
        // pointer the browser no longer tracks must not break the gesture.
        try {
          viewer.stage.setPointerCapture(event.pointerId)
        } catch {
          /* not capturable */
        }
      })
      on(stage, 'pointermove', (event) => {
        const drag = viewer.drag
        if (drag === null || drag.id !== event.pointerId) return
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        if (!drag.moved && Math.hypot(dx, dy) < ZOOM_DRAG_MIN) return
        drag.moved = true
        showViewer(viewer, viewer.scale, drag.originX + dx, drag.originY + dy, viewer.atFit)
      })
      on(stage, 'pointerup', (event) => {
        const drag = viewer.drag
        if (drag === null || drag.id !== event.pointerId) return
        viewer.drag = null
        try {
          viewer.stage.releasePointerCapture(event.pointerId)
        } catch {
          /* was not captured */
        }
        // A press on the empty backdrop closes the viewer. A drag never does,
        // and neither does a press on the diagram itself — that one is far too
        // easy to hit by accident while panning.
        const onDiagram = drag.target !== null
          && typeof drag.target.closest === 'function'
          && drag.target.closest('.dsh-mermaid-zoom-pan') !== null
        if (!drag.moved && !onDiagram) closeViewer()
      })
      on(stage, 'pointercancel', () => { viewer.drag = null })
      on(stage, 'dblclick', (event) => {
        if (!active()) return
        if (!viewer.atFit) {
          fitViewer(viewer)
          return
        }
        const rect = stage.getBoundingClientRect()
        zoomViewerAt(viewer, 1, event.clientX - rect.left, event.clientY - rect.top)
      })
      on(window, 'resize', () => {
        if (!active()) return
        if (viewer.atFit) fitViewer(viewer)
        else showViewer(viewer, viewer.scale, viewer.x, viewer.y)
      })
      // Captured, so Esc and the arrows belong to the viewer while it is open
      // instead of reaching the conversation behind it.
      on(window, 'keydown', (event) => {
        if (!active() || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
        const point = stageCenter(viewer)
        const key = event.key
        if (key === 'Escape') closeViewer()
        else if (key === '+' || key === '=') zoomViewerAt(viewer, viewer.scale * ZOOM_STEP, point.x, point.y)
        else if (key === '-' || key === '_') zoomViewerAt(viewer, viewer.scale / ZOOM_STEP, point.x, point.y)
        else if (key === '0') fitViewer(viewer)
        else if (key === 'ArrowLeft') showViewer(viewer, viewer.scale, viewer.x + ZOOM_ARROW_PX, viewer.y, viewer.atFit)
        else if (key === 'ArrowRight') showViewer(viewer, viewer.scale, viewer.x - ZOOM_ARROW_PX, viewer.y, viewer.atFit)
        else if (key === 'ArrowUp') showViewer(viewer, viewer.scale, viewer.x, viewer.y + ZOOM_ARROW_PX, viewer.atFit)
        else if (key === 'ArrowDown') showViewer(viewer, viewer.scale, viewer.x, viewer.y - ZOOM_ARROW_PX, viewer.atFit)
        else return
        event.preventDefault()
        event.stopPropagation()
      }, true)
      ;(document.body ?? document.documentElement).append(el)
      viewer.dispose = () => {
        viewer.record = null
        for (const off of offs) off()
        el.remove()
      }
      return viewer
    }

    /** Show one diagram enlarged, replacing whatever the viewer showed before. */
    const openViewer = (record) => {
      if (state.disposed) return
      const svg = record.canvas.querySelector('svg')
      if (svg === null) return
      const viewer = state.viewer ?? (state.viewer = buildViewer())
      closeViewer()
      const size = naturalSize(svg)
      // A clone, not the node: the fence keeps its own picture, and the copy
      // needs no `max-width` cap to be readable. Its paper (background, radius,
      // shadow) comes from the stylesheet, which knows the theme tokens.
      const clone = svg.cloneNode(true)
      clone.setAttribute('width', String(Math.round(size.width)))
      clone.setAttribute('height', String(Math.round(size.height)))
      clone.style.cssText = `width:${size.width}px;height:${size.height}px;max-width:none;display:block`
      const paper = document.createElement('div')
      paper.className = 'dsh-mermaid-zoom-paper'
      paper.append(clone)
      const width = size.width + 2 * ZOOM_PAPER_PAD
      const height = size.height + 2 * ZOOM_PAPER_PAD
      viewer.pan.style.width = `${width}px`
      viewer.pan.style.height = `${height}px`
      viewer.pan.replaceChildren(paper)
      viewer.kind.textContent = record.kindName ?? LANGUAGE
      viewer.bar.dataset.dshMermaidKind = record.kindName ?? LANGUAGE
      viewer.width = width
      viewer.height = height
      viewer.record = record
      viewer.focus = document.activeElement
      viewer.el.hidden = false
      fitViewer(viewer)
      viewer.closeButton.focus({ preventScroll: true })
    }

    /** Hide the viewer and hand focus back to whatever opened it. */
    const closeViewer = () => {
      const viewer = state.viewer
      if (viewer === null || viewer.record === null) return
      viewer.record = null
      viewer.drag = null
      viewer.el.hidden = true
      viewer.pan.replaceChildren()
      viewer.pan.style.width = ''
      viewer.pan.style.height = ''
      const focus = viewer.focus
      viewer.focus = null
      if (focus !== null && focus !== document.body && typeof focus.focus === 'function' && focus.isConnected) {
        focus.focus({ preventScroll: true })
      } else if (viewer.el.contains(document.activeElement)) {
        // Nothing owns the focus (the diagram itself is not focusable, the
        // opener may be gone): park it on the page instead of on a button
        // inside a hidden dialog.
        document.activeElement.blur()
      }
    }

    // ---- theme menu ------------------------------------------------------
    // One shared popover serves every card. A theme is a reader preference, not
    // a property of a single diagram, so choosing a variant repaints every
    // diagram on the page instead of only the one whose header opened the menu.

    /**
     * Build the popover. Each item carries a three-dot swatch derived from the
     * same palette the diagrams use, and the checked item is the live variant.
     */
    const buildThemeMenu = () => {
      const el = document.createElement('div')
      el.className = 'dsh-mermaid-theme-menu'
      el.dataset.dshMermaidThemeMenu = '1'
      el.hidden = true
      el.setAttribute('role', 'menu')
      const entries = new Map()
      const labels = new Map()
      const items = []
      for (const choice of THEME_CHOICES) {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'dsh-mermaid-theme-item'
        item.dataset.dshMermaidTheme = choice.id
        item.setAttribute('role', 'menuitemradio')
        item.setAttribute('aria-checked', 'false')
        const swatch = document.createElement('span')
        swatch.className = 'dsh-mermaid-theme-swatch'
        swatch.setAttribute('aria-hidden', 'true')
        for (const color of THEME_SWATCHES[choice.id] ?? []) {
          const dot = document.createElement('span')
          dot.className = 'dsh-mermaid-theme-dot'
          dot.style.background = color
          swatch.append(dot)
        }
        const label = document.createElement('span')
        label.className = 'dsh-mermaid-theme-label'
        const check = document.createElement('span')
        check.className = 'dsh-mermaid-theme-check'
        check.innerHTML = ICONS.check
        item.append(swatch, label, check)
        item.addEventListener('click', () => chooseTheme(choice.id))
        el.append(item)
        entries.set(choice.id, item)
        labels.set(choice.id, label)
        items.push(item)
      }

      const menu = {
        el,
        items,
        entries,
        /** the header button the menu currently hangs from, or null */
        opener: null,
        dispose,
      }

      /** Mark exactly one item as the selected variant. */
      const sync = () => {
        for (const [id, item] of entries) {
          const checked = id === state.variant
          item.setAttribute('aria-checked', String(checked))
          item.tabIndex = checked ? 0 : -1
        }
      }

      /** Place the fixed popover under its trigger, clamped to the viewport. */
      const position = () => {
        const opener = menu.opener
        if (opener === null || !opener.isConnected) {
          close()
          return
        }
        const anchor = opener.getBoundingClientRect()
        const box = el.getBoundingClientRect()
        let left = anchor.right - box.width
        let top = anchor.bottom + 6
        if (top + box.height > window.innerHeight - 8 && anchor.top - box.height - 6 >= 8) {
          top = anchor.top - box.height - 6
        }
        left = Math.max(8, Math.min(left, window.innerWidth - box.width - 8))
        top = Math.max(8, Math.min(top, window.innerHeight - box.height - 8))
        el.style.left = `${Math.round(left)}px`
        el.style.top = `${Math.round(top)}px`
      }

      const onPointerDown = (event) => {
        const target = event.target
        if (target instanceof Node && (el.contains(target) || target === menu.opener)) return
        close()
      }

      const onDocumentKeyDown = (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return
        event.preventDefault()
        event.stopPropagation()
        close(true)
      }

      const onMenuKeyDown = (event) => {
        const index = items.indexOf(document.activeElement)
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          const step = event.key === 'ArrowDown' ? 1 : -1
          items[(index + step + items.length) % items.length].focus({ preventScroll: true })
        } else if (event.key === 'Home') {
          event.preventDefault()
          items[0].focus({ preventScroll: true })
        } else if (event.key === 'End') {
          event.preventDefault()
          items[items.length - 1].focus({ preventScroll: true })
        } else if (event.key === 'Tab') {
          close()
        }
      }
      el.addEventListener('keydown', onMenuKeyDown)

      /**
       * Open the menu under `opener`, focusing the live variant. Calling it
       * again with the same opener closes the menu, so the trigger toggles.
       */
      function open (opener) {
        if (state.disposed) return
        if (menu.opener === opener && !el.hidden) {
          close()
          return
        }
        close()
        menu.opener = opener
        el.hidden = false
        sync()
        position()
        const current = entries.get(state.variant) ?? items[0]
        current?.focus({ preventScroll: true })
        opener.setAttribute('aria-expanded', 'true')
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onDocumentKeyDown, true)
        window.addEventListener('resize', position)
        window.addEventListener('scroll', position, true)
      }

      /** Hide the menu; `returnFocus` hands focus back to the trigger. */
      function close (returnFocus = false) {
        if (el.hidden) return
        el.hidden = true
        const opener = menu.opener
        menu.opener = null
        opener?.setAttribute('aria-expanded', 'false')
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('keydown', onDocumentKeyDown, true)
        window.removeEventListener('resize', position)
        window.removeEventListener('scroll', position, true)
        if (returnFocus && opener !== null && opener.isConnected) opener.focus({ preventScroll: true })
      }

      /** Refresh the localized copy (the locale service can bind after mount). */
      const refreshLabels = () => {
        el.setAttribute('aria-label', t('theme'))
        for (const choice of THEME_CHOICES) {
          const node = labels.get(choice.id)
          if (node === undefined) continue
          node.textContent = choice.key === undefined ? choice.label : t(choice.key)
        }
      }

      function dispose () {
        close()
        el.remove()
      }

      menu.open = open
      menu.close = close
      menu.sync = sync
      menu.refreshLabels = refreshLabels

      refreshLabels()
      sync()
      ;(document.body ?? document.documentElement).append(el)
      return menu
    }

    /** The shared menu, built the first time a header control asks for it. */
    const themeMenu = () => {
      if (state.disposed) return null
      if (state.menu === null) state.menu = buildThemeMenu()
      return state.menu
    }

    /** Toggle the menu under one card's theme button. */
    const openThemeMenu = (opener) => {
      const menu = themeMenu()
      if (menu !== null) menu.open(opener)
    }

    /**
     * Adopt a theme: remember it, refresh the header tooltips, and repaint every
     * diagram. `applyView` is deliberate before the repaint — the tooltip and
     * aria label must name the new variant even while the new SVGs are drawn.
     */
    const chooseTheme = (variant) => {
      if (state.disposed) return
      if (variant === state.variant) {
        if (state.menu !== null) state.menu.close(true)
        return
      }
      if (THEME_SWATCHES[variant] === undefined) return
      state.variant = variant
      storeTheme(variant)
      if (state.menu !== null) state.menu.close(true)
      for (const record of state.records.values()) applyView(record)
      repaint()
    }

    /**
     * The rendered-diagram cache.
     *
     * A Mermaid render is 95% of this plugin's cost and is a pure function of
     * the fence text plus the palette it is drawn in, yet three ordinary
     * situations repeat it for an identical answer: a reader toggling the theme
     * back to one they already used, React replacing a message's DOM (which
     * drops the holder and makes the block look new), and the same diagram
     * appearing twice in one message. Caching the finished SVG string turns each
     * of those from a 20-190ms render into a string insert.
     *
     * Insertion order is recency order: a hit is re-inserted, an overflow
     * evicts from the front, and the map is bounded by both entry count and
     * total bytes so one huge chart cannot pin hundreds of megabytes.
     */
    const cacheKeyOf = (palette, code) => `${palette}\n${code}`

    /** Read one entry, refreshing its recency. */
    const cacheGet = (key) => {
      const entry = state.cache.get(key)
      if (entry === undefined) return undefined
      state.cache.delete(key)
      state.cache.set(key, entry)
      return entry
    }

    /** Store one entry, evicting least-recently-used first past either bound. */
    const cacheSet = (key, entry) => {
      if (entry.bytes > CACHE_BYTES) return
      const previous = state.cache.get(key)
      if (previous !== undefined) {
        state.cache.delete(key)
        state.cacheBytes -= previous.bytes
      }
      state.cache.set(key, entry)
      state.cacheBytes += entry.bytes
      while (state.cache.size > CACHE_ENTRIES || state.cacheBytes > CACHE_BYTES) {
        const oldest = state.cache.keys().next()
        if (oldest.done === true) break
        const dropped = state.cache.get(oldest.value)
        state.cache.delete(oldest.value)
        state.cacheBytes -= dropped === undefined ? 0 : dropped.bytes
      }
    }

    /** Drop everything; called from the fiber teardown. */
    const cacheClear = () => {
      state.cache.clear()
      state.cacheBytes = 0
    }

    /**
     * Re-home one cached SVG on the id of the insertion that is about to use it.
     *
     * Mermaid namespaces everything it emits with the id it was handed — the
     * `<svg id>` itself, every `url(#…)` marker and arrowhead reference, and the
     * `<style>` selectors it compiles under `#<id>`. Two cards replaying the
     * same cached string would therefore carry duplicate ids, and `url(#…)`
     * resolves to whichever node the document finds first, so removing that card
     * would silently break the other one's arrowheads. Rewriting every
     * occurrence of the old id makes each insertion self-contained. The id is
     * this plugin's own and unique per render, so a literal replacement cannot
     * collide with anything belonging to the diagram.
     */
    const reidentify = (svg, from, to) => (from === to ? svg : svg.split(from).join(to))

    /**
     * Put a finished SVG on the card and settle the record. Shared by the fresh
     * and the cached path, so that a cache hit is indistinguishable to the rest
     * of the plugin.
     */
    const commit = (record, svg, palette) => {
      record.canvas.innerHTML = svg
      record.done = true
      record.failed = false
      record.failures = 0
      record.paintedKey = palette
      applyView(record)
      fitReading(record)
      record.block.dataset.dshMermaid = 'done'
    }

    // ---- visibility -----------------------------------------------------
    // A Mermaid render is 95% of this plugin's cost (measured: 698ms of a 738ms
    // nine-diagram pass) and it is per-diagram, so the cheapest render is the
    // one nobody asked to see. A conversation keeps its whole history in the
    // DOM, and its history holds diagrams the reader scrolled past long ago;
    // mounting such a conversation used to render every one of them. Parking a
    // job until the card is within VISIBLE_MARGIN of the viewport is the single
    // largest saving available, and it costs a reader nothing: the work starts
    // before the card arrives, and a fast scroll shows the plain fence for one
    // settle window instead of showing a frozen tab.

    /**
     * Is this block near the viewport *right now*?
     *
     * The observer is the right trigger for a parked render, but it cannot
     * answer the question that decides whether to start one: its first callback
     * arrives a frame after `observe()`, and the decision is taken in the same
     * task the record is created in. So the first sighting asks the layout
     * directly — one `getBoundingClientRect()` against a render that costs two
     * to three orders of magnitude more. The block is measured rather than the
     * canvas because the canvas is still `hidden` at this point and would report
     * a zero rect.
     */
    const onScreen = (block) => {
      const rect = block.getBoundingClientRect()
      // A block with no box at all is not laid out — a collapsed surface or a
      // background tab. Do not turn that into "off screen": the observer will
      // report the truth as soon as it has one, and a collapsed panel would
      // otherwise never render.
      if (rect.width === 0 && rect.height === 0) return true
      const height = window.innerHeight || 0
      return rect.bottom >= -VISIBLE_MARGIN_PX && rect.top <= height + VISIBLE_MARGIN_PX
    }

    /**
     * Record one block for the visibility observer, or drop it.
     *
     * The observed node is the holder, not the canvas: the canvas stays `hidden`
     * until it has a diagram in it, and an observer on a `display:none` box can
     * only ever report "not visible" — a parked card would never come back. The
     * holder is visible from the moment the card exists, so its intersection is
     * an honest answer to "would the reader see this".
     *
     * `record.visible` starts unknown, which the guard treats as visible: a
     * platform without the observer, and the first frame of a fresh card, both
     * behave exactly as the plugin did before — a render attempt worth paying
     * for.
     */
    const watchVisibility = (record) => {
      const observerFor = () => {
        if (state.visible !== null) return state.visible
        if (typeof IntersectionObserver !== 'function') return null
        state.visible = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const target = state.byHolder.get(entry.target)
            if (target === undefined) continue
            target.visible = entry.isIntersecting
            if (!entry.isIntersecting) continue
            // Came into range: take the fit measurement that was skipped while
            // the card was off screen, and pay for the render that was parked
            // because nobody was looking.
            fitReading(target)
            if (target.wantsPaint) {
              target.wantsPaint = false
              if (target.block.isConnected) renderBlock(target.block, true)
            }
          }
        }, { rootMargin: VISIBLE_MARGIN })
        return state.visible
      }
      const observer = observerFor()
      if (observer === null) return
      state.byHolder.set(record.holder, record)
      observer.observe(record.holder)
    }

    /** Stop watching a holder whose record was replaced or disposed. */
    const unwatchVisibility = (record) => {
      if (state.visible === null) return
      state.byHolder.delete(record.holder)
      state.visible.unobserve(record.holder)
    }

    /** One diagram, rendered with the current theme. */
    const paint = async (record) => {
      // A repaint or a re-render replaces the SVG; a viewer showing the old one
      // would be showing a picture that no longer exists.
      if (state.viewer !== null && state.viewer.record === record) closeViewer()
      const mermaid = await loadMermaid()
      if (state.disposed || !record.block.isConnected) return
      // One read of the scheme, used for the configuration, the palette and the
      // cache key: two reads could straddle a theme switch and describe a
      // configuration that was never applied.
      const scheme = themeScheme()
      const palette = `${scheme}|${state.variant}`
      const code = record.code
      configure(mermaid, scheme)
      // The card is already showing this diagram in this palette. Only a
      // redundant theme event or a repaint racing a paint reaches here, and a
      // Mermaid render is three orders of magnitude more expensive than this
      // comparison, so the guard pays for itself the first time it fires.
      if (record.done === true && record.paintedKey === palette) return

      const id = `${PLUGIN_ID}-${(state.uid += 1)}`
      const key = cacheKeyOf(palette, code)
      const cached = cacheGet(key)
      if (cached !== undefined) {
        commit(record, reidentify(cached.svg, cached.id, id), palette)
        return
      }

      let result
      try {
        result = await mermaid.render(id, code)
      } catch (error) {
        // mermaid's temp nodes are `d<id>` (SVG host) and `i<id>` (sandbox
        // iframe). A failed render is allowed to leave them behind, which is
        // how a half-streamed fence used to deposit an error diagram at the end
        // of the conversation; remove them before surfacing our own note.
        for (const temp of [`d${id}`, `i${id}`]) document.getElementById(temp)?.remove()
        throw error
      }
      if (state.disposed || !record.block.isConnected) return
      // A newer snapshot of the fence, or another paint, got here while this
      // render was running. Committing would put the *old* picture on the card
      // and stamp it as current — and because `renderBlock` treats "record done
      // and same text" as nothing to do, a card could then keep showing a
      // diagram its text no longer matches, for good. Whatever superseded this
      // render owns the card now; drop the result. (The cache write below is
      // still correct: its key carries the text this render was made from.)
      if (record.code !== code) return
      // A `click` statement is bound as a closure over the diagram mermaid just
      // parsed, so a replayed string would come back inert. Those diagrams are
      // simply not cached; everything else is.
      if (!INTERACTIVE.test(code)) {
        cacheSet(key, { svg: result.svg, id, bytes: result.svg.length })
      }
      commit(record, result.svg, palette)
      if (typeof result.bindFunctions === 'function') {
        try {
          result.bindFunctions(record.canvas)
        } catch {
          /* interaction binding is best effort */
        }
      }
    }

    /**
     * A failed render. The first failures are almost always a fence that is
     * still being streamed, so they retry with backoff instead of surfacing;
     * only once the retries run out does the note appear.
     */
    const onFailure = (block, record, error) => {
      if (state.disposed || !record.block.isConnected) return
      record.failures += 1
      const delay = RETRY_MS[record.failures - 1]
      if (delay !== undefined) {
        schedule(block, delay, true)
        return
      }
      const key = error?.dshMermaidLoad === true ? 'loadFailed' : 'renderFailed'
      fail(block, record, error, key)
    }

    /**
     * Surface a settled failure without destroying the fence it came from. The
     * record stays alive and the note stays inside the holder: the next change
     * of this fence's text clears it and renders again.
     */
    const fail = (block, record, error, key) => {
      if (state.disposed || !block.isConnected) return
      record.failed = true
      record.errorKind = key === 'loadFailed' ? 'load' : 'render'
      record.errorPre.textContent = messageOf(error)
      block.dataset.dshMermaid = 'failed'
      applyView(record)
    }

    /**
     * Render one block. `force` skips the "nothing changed" guard; the retry
     * timer uses it to re-attempt the very same text.
     */
    const renderBlock = (block, force = false) => {
      if (state.disposed || !block.isConnected) return
      const code = sourceOf(block)
      if (code === null || !isMermaidFence(block, code)) return
      const record = ensureRecord(block)
      if (!force && record.code === code && (record.done || record.failed || record.pending)) return
      if (record.code !== code) {
        // The fence text moved on — a note left by an earlier snapshot of this
        // same block is stale, and the retry budget starts over. This is what
        // makes a mid-stream parse error, or a regenerated message that reuses
        // the same DOM node, recover instead of sticking forever.
        record.done = false
        record.failures = 0
        record.failed = false
      }
      record.code = code
      record.kindName = diagramKind(code)
      record.pending = true
      block.dataset.dshMermaid = 'pending'
      // Claim the card chrome immediately: the shell's generic code banner is
      // replaced by this card's own header while the first SVG is still being
      // fetched, so the block never flashes "代码块" and then changes shape.
      applyView(record)
      // Off screen: note what is owed and let the visibility observer collect
      // it. `pending` goes back to false so a later settle is not blocked by a
      // job that is not actually running.
      if (record.visible === false || (record.visible === undefined && !onScreen(block))) {
        record.visible = false
        record.wantsPaint = true
        record.pending = false
        return undefined
      }
      return enqueue(() => paint(record).then(
        () => { record.pending = false },
        (error) => { record.pending = false; onFailure(block, record, error) },
      ))
    }

    /** Wait for a fence to stop changing before rendering it (streaming). */
    const schedule = (block, delay = SETTLE_MS, force = false) => {
      if (state.disposed || !block.isConnected) return
      prefetchEngine(block)
      const pending = state.timers.get(block)
      if (pending !== undefined) window.clearTimeout(pending)
      state.timers.set(block, window.setTimeout(() => {
        state.timers.delete(block)
        // A throw escaping here used to leave the fence as plain source with no
        // holder, no buttons and no explanation — the whole block silently
        // dead. Whatever breaks, it becomes a note instead.
        try {
          renderBlock(block, force)
        } catch (error) {
          const record = state.records.get(block)
          if (record !== undefined) fail(block, record, error, 'renderFailed')
        }
      }, delay))
    }

    const scan = (root) => {
      if (root === null || typeof root.querySelectorAll !== 'function') return
      for (const block of root.querySelectorAll('.md-code-block')) schedule(block)
    }

    /**
     * Redraw every diagram for the current palette.
     *
     * Two filters keep this from being the most expensive thing the plugin can
     * do. A card already painted in this palette is skipped outright — that is
     * what makes the second of two identical `theme/change` events free. And an
     * off-screen card is only *marked*: its render is owed, and the visibility
     * observer pays for it if the reader ever scrolls back to it. Repainting a
     * conversation's whole history for a theme switch used to be visible as a
     * freeze; now only what is on screen is redrawn.
     */
    const repaint = () => {
      const palette = `${themeScheme()}|${state.variant}`
      for (const record of state.records.values()) {
        if (!record.block.isConnected || record.code === null || record.failed) continue
        if (record.done === true && record.paintedKey === palette) continue
        if (record.visible === false) {
          record.wantsPaint = true
          continue
        }
        enqueue(() => paint(record).then(
          () => {},
          (error) => onFailure(record.block, record, error),
        ))
      }
    }

    // ---- theme ---------------------------------------------------------
    // One preconnect, not a preload: it downloads nothing, and it takes the DNS
    // lookup and TLS handshake off the critical path of the first diagram
    // instead of leaving them to run after the settle window.
    ctx.effect(() => {
      let origin
      try {
        origin = new URL(MERMAID_CDN).origin
      } catch {
        return () => {}
      }
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = origin
      link.crossOrigin = ''
      link.dataset.dshMermaidPreconnect = '1'
      ;(document.head ?? document.documentElement).append(link)
      return () => link.remove()
    }, `${PLUGIN_ID}: preconnect`)

    // ---- lifecycle ------------------------------------------------------
    const observer = new MutationObserver((mutations) => {
      // Streaming replaces message DOM wholesale; a viewer left showing a
      // diagram whose fence is gone has nothing to close it.
      const shown = state.viewer === null ? null : state.viewer.record
      if (shown !== null && !shown.block.isConnected) closeViewer()
      for (const mutation of mutations) {
        const target = mutation.target
        // Streaming edits land as characterData on the fence's text node, and as
        // a replaced text node (a childList mutation whose added node is not an
        // element). Both mean "the fence changed", so both have to be traced
        // back to the owning block — and a characterData target *is* the text
        // node, not an element, which is why the element is resolved first and
        // every check then runs against it.
        const element = target.nodeType === 1 ? target : target.parentElement
        // Our own DOM must never look like "the fence changed": the note and
        // the buttons live inside the holder, the viewer and the theme menu are
        // siblings of the whole conversation, and the attributes we toggle are
        // ours alone. This test has to come before the block lookup, or a write
        // inside the holder would schedule a render of the fence it belongs to.
        if (element !== null && typeof element.closest === 'function'
          && element.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom], [data-dsh-mermaid-theme-menu]') !== null) continue
        if (mutation.type === 'attributes') {
          const name = mutation.attributeName
          if (name === HIDDEN || (typeof name === 'string' && name.startsWith('data-dsh-mermaid'))) continue
        }
        if (element !== null && typeof element.closest === 'function') {
          const owner = element.closest('.md-code-block')
          if (owner !== null) schedule(owner)
        }
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (typeof node.closest === 'function' && node.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom], [data-dsh-mermaid-theme-menu]') !== null) continue
          if (typeof node.matches === 'function' && node.matches('.md-code-block')) schedule(node)
          else scan(node)
        }
      }
    })

    ctx.effect(() => {
      const target = document.body ?? document.documentElement
      // A failed render from a previous page state (or a pre-fix hot reload)
      // can leave mermaid's temporary SVG/iframe hosts behind. They are ours to
      // remove: the ids are `d<renderId>` / `i<renderId>`.
      for (const stale of document.querySelectorAll(
        '[id^="ddsh-mermaid-preview-"], [id^="idsh-mermaid-preview-"]',
      )) stale.remove()
      observer.observe(target, { childList: true, subtree: true, characterData: true })
      scan(target)
      return () => {
        state.disposed = true
        observer.disconnect()
        for (const timer of state.timers.values()) window.clearTimeout(timer)
        state.timers.clear()
        for (const script of state.scripts) script.remove()
        state.scripts.clear()
        if (state.viewer !== null) {
          state.viewer.dispose()
          state.viewer = null
        }
        if (state.menu !== null) {
          state.menu.dispose()
          state.menu = null
        }
        if (state.visible !== null) {
          state.visible.disconnect()
          state.visible = null
        }
        state.byHolder = new WeakMap()
        cacheClear()
        for (const record of state.records.values()) {
          record.canvasObserver?.disconnect()
          if (record.copyTimer !== undefined) window.clearTimeout(record.copyTimer)
          record.holder.remove()
          record.content?.removeAttribute(HIDDEN)
        }
        state.records.clear()
        for (const block of document.querySelectorAll('.md-code-block[data-dsh-mermaid]')) {
          delete block.dataset.dshMermaid
        }
        for (const el of document.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN)
        for (const el of document.querySelectorAll(`[${BANNER_HIDDEN}]`)) el.removeAttribute(BANNER_HIDDEN)
        delete document.documentElement.dataset.dshMermaidFit
      }
    }, `${PLUGIN_ID}: observer`)

    /**
     * Repaint after a theme signal.
     *
     * Deferred by one macrotask, because the signal can arrive before the colour
     * scheme has been committed: `themeScheme()` would then read the old scheme,
     * the palette guard would correctly conclude there is nothing to repaint, and
     * the old palette would stay on screen until the next switch — the exact
     * "I changed it and nothing happened" failure. Deferring lets the commit
     * land first.
     *
     * Two signals, one idempotent handler. `theme/change` is the intended one;
     * the `data-ds-dark-theme` attribute on `<body>` — which this plugin's own
     * stylesheet already keys off — is the one that is written *by* the commit,
     * so watching it makes the ordering irrelevant rather than merely unlikely.
     * The palette guard makes the duplicate repaint free.
     */
    const onThemeSignal = () => {
      // The palette is part of the key, so a real switch makes the guard miss on
      // its own; forgetting it here just means another consumer of the global
      // mermaid instance cannot leave this plugin drawing with a stale config.
      configuredKey = null
      void yieldToMain().then(() => {
        if (!state.disposed) repaint()
      })
    }
    ctx.on('theme/change', onThemeSignal)
    ctx.effect(() => {
      const target = document.body
      if (target === null || typeof MutationObserver !== 'function') return () => {}
      const watch = new MutationObserver(onThemeSignal)
      watch.observe(target, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
      return () => watch.disconnect()
    }, `${PLUGIN_ID}: theme attribute`)
    ctx.on('locale/change', () => {
      for (const record of state.records.values()) applyView(record)
      state.viewer?.refreshLabels()
      state.menu?.refreshLabels()
    })
  },
}


		exports.name = __plugin.name;
		exports.apply = __plugin.apply;
		return module.exports;
	}
});
