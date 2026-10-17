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

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif"

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
  marker path { fill: rgba(0,0,0,0.22); }
  .mouth { stroke: rgba(0,0,0,0.35); }

  /* git graph: 8px branch rails are too loud for a chat card */
  .arrow { stroke-width: 3px; }
  .commit-merge { fill: #FFFFFF; stroke: rgba(0,0,0,0.16); }

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
  .titleText { font-size: 15px; }
  .sectionTitle { font-size: 12px; }
  .grid .tick text { font-size: 11px; }

  text[font-size="4ex"] { font-size: 16px; }

  line[stroke="black"] { stroke: rgba(255,255,255,0.14); stroke-width: 1.5px; }
  line.task-line { stroke: rgba(255,255,255,0.14); }
  marker path { fill: rgba(255,255,255,0.22); }
  .mouth { stroke: rgba(255,255,255,0.35); }

  .arrow { stroke-width: 3px; }
  .commit-merge { fill: #232324; stroke: rgba(255,255,255,0.16); }

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

/**
 * Diagram-type config that themeVariables cannot express: the font bridge,
 * density, and the per-diagram sizing knobs. Spread this into the same
 * `initialize()` call as the chosen theme.
 */
export const CONFIG = {
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
    taskFontSize: '13px',
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
  },
  dark: {
    journey: {
      sectionFills: ['#262A31', '#23272E', '#2A2E36', '#252932', '#282C33', '#242830', '#292D34'],
      sectionColours: ['#EBEEF2'],
      actorColours: ['#35383D', '#303338', '#3A3D42', '#33363B', '#373A3F', '#2E3136'],
    },
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
const makeThemeVariables = (p) => {
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
    noteBkgColor: p.tint.yellow,
    noteTextColor: text,
    noteBorderColor: p.sys.yellow,
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
    sectionBkgColor: p.sys.blue,
    altSectionBkgColor: p.sys.orange,
    sectionBkgColor2: p.sys.green,
    excludeBkgColor: p.fill,
    taskBkgColor: p.taskBkg ?? (isDark ? '#1F3A5E' : '#CFE5FF'),
    taskBorderColor: p.sys.blue,
    taskTextColor: text,
    taskTextOutsideColor: p.textOutside ?? (isDark ? secondary : '#636366'),
    taskTextDarkColor: text,
    taskTextLightColor: white,
    taskTextClickableColor: p.sys.blue,
    activeTaskBkgColor: p.darkTint ? p.sys.blue : p.deepBlue,
    activeTaskBorderColor: p.deepBlue,
    doneTaskBkgColor: p.tint.green,
    doneTaskBorderColor: p.sys.green,
    critBkgColor: p.tint.red,
    critBorderColor: p.sys.red,
    todayLineColor: p.sys.red,
    vertLineColor: p.separator,
    gridColor: p.separator,

    /* --- journey -------------------------------------------------------- */
    faceColor: p.fill,
    actor0: p.tint.blue,
    actor1: p.tint.green,
    actor2: p.tint.orange,
    actor3: p.tint.pink,
    actor4: p.tint.purple,
    actor5: p.tint.teal,

    /* --- pie (vivid Apple ramp; white % labels carry a themeCSS halo) --- */
    pie1: p.sys.blue,
    pie2: p.sys.green,
    pie3: p.sys.orange,
    pie4: p.sys.pink,
    pie5: p.sys.purple,
    pie6: p.sys.teal,
    pie7: p.sys.indigo,
    pie8: p.sys.yellow,
    pie9: p.sys.red,
    pie10: p.sys.mint,
    pie11: p.sys.brown,
    pie12: p.sys.gray,
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
    tagLabelBackground: p.tint.yellow,
    tagLabelBorder: p.sys.yellow,
    tagLabelFontSize: '11px',

    /* --- timeline / mindmap --------------------------------------------- */
    cScale0: p.tint.blue,
    cScale1: p.tint.green,
    cScale2: p.tint.orange,
    cScale3: p.tint.pink,
    cScale4: p.tint.purple,
    cScale5: p.tint.teal,
    cScale6: p.tint.indigo,
    cScale7: p.tint.yellow,
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
    cScaleInv0: p.separator,
    cScaleInv1: p.separator,
    cScaleInv2: p.separator,
    cScaleInv3: p.separator,
    cScaleInv4: p.separator,
    cScaleInv5: p.separator,
    cScaleInv6: p.separator,
    cScaleInv7: p.separator,
    cScaleInv8: p.separator,
    cScaleInv9: p.separator,
    cScaleInv10: p.separator,
    cScaleInv11: p.separator,
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
    return `
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) .outer-path path,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) g.basic.label-container path,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) rect.basic,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) polygon.label-container,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) circle.basic,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) path.outer-path,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) path.basic,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) path.label-container,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) ellipse.basic,
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) ellipse.label-container { fill: ${fill}; stroke: ${stroke}; }
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) .row-rect-odd path { fill: ${fill}; }
  .nodes g.node:nth-of-type(6n+${n}):not(.mindmap-node) .row-rect-even path { fill: ${fillAlt}; }`
  }).join('\n')

/**
 * Rules shared by both schemes (geometry, text metrics, structure) with the
 * scheme colours injected.
 * @param {typeof APPLE_LIGHT} p
 */
const sharedCSS = (p) => {
  const text = p.label.primary
  const secondary = p.label.secondary
  /* Design-system shape language: corner radius, with a slightly tighter
     inner radius for nested labels. */
  const corner = p.radius ?? 8
  const cornerSmall = Math.max(2, corner - 2)
  /* Strong same-hue label colours for the pastel kanban columns: design-system
     variants provide these from their own system colours. */
  const headingShades = p.headingShades
    ?? (p.darkTint
      ? ['#6EB6FF', '#5CDE7E', '#FFB84D', '#FF6E8E']
      : ['#0057B8', '#1B6E33', '#A34D00', '#A81238'])
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

  /* journey: task/section titles are stamped with a config fill + font */
  .label text { fill: ${text}; }
  text.task, text.journey-section { fill: ${text}; }
  .face { stroke: ${p.hairline}; }
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
  .doneCritText0, .doneCritText1, .doneCritText2, .doneCritText3 { fill: #FFFFFF !important; }
  .activeCritText0, .activeCritText1, .activeCritText2, .activeCritText3 { fill: ${p.activeText} !important; }

  /* pie: vivid slices, white percentage labels with a legibility halo */
  .pieTitleText { font-weight: 600; }
  .slice {
    fill: #FFFFFF;
    paint-order: stroke;
    stroke: ${p.darkTint ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.46)'};
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  /* sequence numbers: indigo chips with on-accent digits */
  [id$="-sequencenumber"] { fill: ${p.sys.indigo}; }
  .sequenceNumber { fill: ${p.onAccentText ?? '#FFFFFF'}; }
  .messageLine0, .messageLine1 { stroke-width: 1.25px; }
  .actor-line { stroke-dasharray: 3 3; }

  /* heavy stock connectors (journey/timeline rails) become hairlines */
  text[font-size="4ex"] { font-size: 16px; }
  line[stroke="black"] { stroke: ${p.darkTint ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'}; stroke-width: 1.5px; }
  line.task-line { stroke: ${p.darkTint ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'}; }
  marker path { fill: ${p.darkTint ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)'}; }
  .mouth { stroke: ${p.darkTint ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}; }

  /* radii follow the design system's shape language */
  .node rect { rx: ${corner}px; ry: ${corner}px; }
  g.classGroup rect { rx: ${cornerSmall}px; ry: ${cornerSmall}px; }
  rect.actor { rx: ${corner}px; ry: ${corner}px; }
  .labelBox { rx: ${cornerSmall}px; ry: ${cornerSmall}px; }
  .mindmap-node rect { rx: ${corner}px; ry: ${corner}px; }

  /* kanban columns */
${kanbanRules}

  /* quadrant points: cycle the data points through the system palette */
  .data-point circle { stroke: ${p.nodeFill ?? '#FFFFFF'}; stroke-width: 1.5px; }
  .data-point:nth-of-type(5n+1) circle { fill: ${p.sys.blue}; }
  .data-point:nth-of-type(5n+2) circle { fill: ${p.sys.green}; }
  .data-point:nth-of-type(5n+3) circle { fill: ${p.sys.orange}; }
  .data-point:nth-of-type(5n+4) circle { fill: ${p.sys.pink}; }
  .data-point:nth-of-type(5n+5) circle { fill: ${p.sys.purple}; }
  `
}

/* ------------------------------------------------------------------------- *
 * Assembled themes
 * ------------------------------------------------------------------------- */

const lightVariables = makeThemeVariables(APPLE_LIGHT)
const darkVariables = makeThemeVariables(APPLE_DARK)

/** `theme:'base'` + Apple HIG variables, per scheme. */
export const APPLE_THEMES = {
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

export const APPLE_SCHEME_CONFIG = {
  light: {
    journey: {
      sectionFills: ['#D6EAFF', '#D2F5DE', '#FFE8CC', '#FFD9E2', '#EBD8FA', '#D0F0F5', '#FFF2BF'],
      sectionColours: ['#1D1D1F'],
      actorColours: ['#B7DAFF', '#B3ECCB', '#FFD9A8', '#FFC2D0', '#E4C6F7', '#B7E7EF'],
    },
  },
  dark: {
    journey: {
      sectionFills: ['#14325B', '#123B26', '#4A3115', '#4A1F2E', '#3A2255', '#143C44', '#4A3F12'],
      sectionColours: ['#F5F5F7'],
      actorColours: ['#2A4E7A', '#1F5C3B', '#6B4A22', '#6B3145', '#553572', '#215C66'],
    },
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

/** Turn a design system's solid palette into the factory's full palette. */
const buildPalette = ({ mode, surface, separator, label, edge, hues, radius = 8 }) => {
  const card = mode === 'dark' ? '#1B1B1C' : '#F9FAFB'
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
  const deepBlue = mix(hues.blue, '#000000', mode === 'dark' ? 0.35 : 0.22)
  const onDeep = contrast(deepBlue, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#111111'
  const activeBase = mode === 'dark' ? hues.blue : deepBlue
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
    nodeFill: mode === 'dark' ? mix(card, '#FFFFFF', 0.06) : '#FFFFFF',
    rowAlt: mode === 'dark' ? mix(card, '#FFFFFF', 0.05) : mix(card, '#000000', 0.02),
    labelText: strongOnTint(hues.purple, mode),
    taskBkg: mix(hues.blue, card, mode === 'dark' ? 0.42 : 0.24),
    textOutside: label.secondary,
    headingShades: [hues.blue, hues.green, hues.orange, hues.pink].map((c) => strongOnTint(c, mode)),
    doneText: strongOnTint(hues.green, mode),
    onDeep,
    onAccentText: bestText(hues.indigo),
    deepBlue,
    activeText: bestText(activeBase),
    softBg: surface,
    radius,
    darkTint: mode === 'dark',
  }
}

/** Journey paints its bands from config arrays, not theme variables. */
const journeyConfigFor = (p) => ({
  sectionFills: [p.tint.blue, p.tint.green, p.tint.orange, p.tint.pink, p.tint.purple, p.tint.teal, p.tint.yellow],
  sectionColours: [p.label.primary],
  actorColours: ['blue', 'green', 'orange', 'pink', 'purple', 'teal'].map((name) =>
    mix(p.sys[name], p.card, p.mode === 'dark' ? 0.45 : 0.3)),
})

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
    light: { journey: journeyConfigFor(light) },
    dark: { journey: journeyConfigFor(dark) },
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
export const THEME_VARIANT = 'radix'

/** Theme data per variant; `CONFIG` and `FONT_STACK` are shared. */
export const THEME_VARIANTS = {
  quiet: { themes: QUIET_THEMES, schemeConfig: QUIET_SCHEME_CONFIG },
  apple: { themes: APPLE_THEMES, schemeConfig: APPLE_SCHEME_CONFIG },
  ...DESIGN_VARIANTS,
}

/**
 * Three representative solid hues per variant, for the in-card theme menu.
 * Derived from the same palette the diagrams are drawn with, so a swatch can
 * never drift from the variant it names.
 */
export const THEME_SWATCHES = {
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
export const configForVariant = (scheme, variantName) => {
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
  }
}

/** The active variant's config for one scheme. */
export const configFor = (scheme) => configForVariant(scheme, THEME_VARIANT)

export default { FONT_STACK, THEME_VARIANT, THEME_VARIANTS, CONFIG, configFor, configForVariant }
