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
 * 5. A wide diagram arrives at the fence's width and would shrink into
 *    unreadable type. The canvas fits it while it fits comfortably and, past
 *    MIN_FIT_SCALE, keeps the type legible and scrolls instead (with a fade at
 *    the edge that clears at the end). Click the diagram — or the zoom control
 *    in the header — to open a full-window viewer: a framed paper on a blurred
 *    mask, a floating toolbar, wheel zoom, drag-to-pan, fit-to-window,
 *    double-click 1:1, arrow keys and Esc.
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

/** Padding left around the diagram by the viewer's fit-to-window scale. */
const ZOOM_PAD = 40

/** Scale bounds of the viewer; `ZOOM_MAX` covers a diagram of a few nodes. */
const ZOOM_MIN = 0.1
const ZOOM_MAX = 8

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
 * The smallest scale a diagram may be shrunk to inside the chat card. Mermaid
 * draws at 16px by default and every diagram wider than the card would
 * otherwise shrink until its labels stop being readable. Past this floor the
 * diagram keeps its size and the canvas scrolls instead.
 */
const MIN_FIT_SCALE = 0.85

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
      /** the shared theme menu, built on first open */
      menu: null,
    }

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
      .dsh-mermaid-canvas {
        display: block;
        overflow: auto;
        max-height: min(900px, 85vh);
        padding: 6px 22px 20px;
        overscroll-behavior: contain;
      }
      .dsh-mermaid-canvas[hidden] { display: none !important; }
      .dsh-mermaid-canvas svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
      /* A diagram that would be shrunk below MIN_FIT_SCALE keeps its size and
         scrolls instead: unreadable miniatures are worse than a scrollbar.
         The width lives on the canvas so mermaid's own inline max-width cap is
         only overridden in this state. */
      .dsh-mermaid-canvas.dsh-mermaid-overflow svg {
        width: var(--dsh-mermaid-natural-width);
        max-width: none !important;
        height: auto !important;
      }
      .dsh-mermaid-canvas.dsh-mermaid-overflow:not(.dsh-mermaid-at-end) {
        -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent 100%);
        mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent 100%);
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
    // The three flags before the theme config are the plugin's own contract, not
    // theme data: a variant must never be able to drop them. Without
    // suppressErrorRendering, any parse failure (including a half-written fence
    // during streaming) makes mermaid draw its own "Syntax error in text"
    // diagram into <body>, where it survives every later successful re-render.
    const configure = (mermaid) => mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      ...configForVariant(themeScheme(), state.variant),
    })

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

    const enqueue = (task) => {
      const run = state.queue.then(task)
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
     * Keep a diagram at a readable size: fit it into the card while it still
     * fits comfortably, otherwise keep MIN_FIT_SCALE and let the viewport
     * scroll. Called after every render, after the source view returns, and
     * whenever the card's width changes.
     */
    const fitReading = (record) => {
      const svg = record.canvas.querySelector('svg')
      if (svg === null || record.canvas.hidden) return
      const size = naturalSize(svg)
      if (!(size.width > 0) || !(size.height > 0)) return
      const style = getComputedStyle(record.canvas)
      const available = record.canvas.clientWidth
        - (Number.parseFloat(style.paddingLeft) || 0)
        - (Number.parseFloat(style.paddingRight) || 0)
      if (!(available > 0)) return
      const overflow = available / size.width < MIN_FIT_SCALE
      record.canvas.classList.toggle('dsh-mermaid-overflow', overflow)
      if (overflow) {
        // The class carries the width; mermaid's own inline `max-width` cap is
        // only overridden for this state (see the stylesheet). Overflowing
        // diagrams keep their full size: a scrollbar costs less than shrinking
        // 14px labels below legibility.
        record.canvas.style.setProperty('--dsh-mermaid-natural-width', `${Math.round(size.width)}px`)
      } else {
        record.canvas.style.removeProperty('--dsh-mermaid-natural-width')
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
      const theme = toolButton('theme', ICONS.palette)
      theme.setAttribute('aria-haspopup', 'menu')
      theme.setAttribute('aria-expanded', 'false')
      const copy = toolButton('copy', ICONS.copy)
      const source = toolButton('source', ICONS.source)
      const zoom = toolButton('zoom', ICONS.expand)
      zoom.hidden = true
      tools.append(theme, copy, source, zoom)
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
      // The overflow fade clears at the end so the rightmost nodes stay clean.
      canvas.addEventListener('scroll', () => {
        const atEnd = canvas.scrollLeft + canvas.clientWidth >= canvas.scrollWidth - 2
        canvas.classList.toggle('dsh-mermaid-at-end', atEnd)
      }, { passive: true })
      holder.append(head, canvas, error)
      block.append(holder)
      state.records.set(block, record)
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

    /** The scale that shows the whole diagram, never magnifying a small one. */
    const fitScaleOf = (viewer) => {
      const view = viewportOf(viewer)
      return Math.min(
        1,
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

    /** One diagram, rendered with the current theme. */
    const paint = async (record) => {
      // A repaint or a re-render replaces the SVG; a viewer showing the old one
      // would be showing a picture that no longer exists.
      if (state.viewer !== null && state.viewer.record === record) closeViewer()
      const mermaid = await loadMermaid()
      if (state.disposed || !record.block.isConnected) return
      configure(mermaid)
      const id = `${PLUGIN_ID}-${(state.uid += 1)}`
      let result
      try {
        result = await mermaid.render(id, record.code)
      } catch (error) {
        // mermaid's temp nodes are `d<id>` (SVG host) and `i<id>` (sandbox
        // iframe). A failed render is allowed to leave them behind, which is
        // how a half-streamed fence used to deposit an error diagram at the end
        // of the conversation; remove them before surfacing our own note.
        for (const temp of [`d${id}`, `i${id}`]) document.getElementById(temp)?.remove()
        throw error
      }
      if (state.disposed || !record.block.isConnected) return
      record.canvas.innerHTML = result.svg
      if (typeof result.bindFunctions === 'function') {
        try {
          result.bindFunctions(record.canvas)
        } catch {
          /* interaction binding is best effort */
        }
      }
      record.done = true
      record.failed = false
      record.failures = 0
      applyView(record)
      fitReading(record)
      record.block.dataset.dshMermaid = 'done'
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
      return enqueue(() => paint(record).then(
        () => { record.pending = false },
        (error) => { record.pending = false; onFailure(block, record, error) },
      ))
    }

    /** Wait for a fence to stop changing before rendering it (streaming). */
    const schedule = (block, delay = SETTLE_MS, force = false) => {
      if (state.disposed || !block.isConnected) return
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

    const repaint = () => {
      for (const record of state.records.values()) {
        if (!record.block.isConnected || record.code === null || record.failed) continue
        enqueue(() => paint(record).then(
          () => {},
          (error) => onFailure(record.block, record, error),
        ))
      }
    }

    // ---- lifecycle ------------------------------------------------------
    const observer = new MutationObserver((mutations) => {
      // Streaming replaces message DOM wholesale; a viewer left showing a
      // diagram whose fence is gone has nothing to close it.
      const shown = state.viewer === null ? null : state.viewer.record
      if (shown !== null && !shown.block.isConnected) closeViewer()
      for (const mutation of mutations) {
        const target = mutation.target
        // Our own DOM must never look like "the fence changed": the note and
        // the buttons live inside the holder, the viewer and the theme menu are
        // siblings of the whole conversation, and the attributes we toggle are
        // ours alone.
        if (target.nodeType === 1 && target.closest('[data-dsh-mermaid-holder], [data-dsh-mermaid-zoom], [data-dsh-mermaid-theme-menu]') !== null) continue
        if (mutation.type === 'attributes') {
          const name = mutation.attributeName
          if (name === HIDDEN || (typeof name === 'string' && name.startsWith('data-dsh-mermaid'))) continue
        }
        // Streaming edits land as characterData on the fence's text node, and as
        // a replaced text node (a childList mutation whose added node is not an
        // element). Both mean "the fence changed" — find the owning block.
        if (target.nodeType === 1) {
          const owner = target.closest('.md-code-block')
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
      }
    }, `${PLUGIN_ID}: observer`)

    ctx.on('theme/change', repaint)
    ctx.on('locale/change', () => {
      for (const record of state.records.values()) applyView(record)
      state.viewer?.refreshLabels()
      state.menu?.refreshLabels()
    })
  },
}


