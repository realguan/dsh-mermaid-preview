/**
 * dsh-mermaid-preview — Host half.
 *
 * The rendering lives entirely in the browser; this half exists so the bundle
 * has a mountable Loader row (`dsh.bundle.patch`) and so `dsh-client-modules`
 * can discover the package's `dsh.client` declaration. It registers nothing.
 *
 * @see ./cordis.patch.yml — the row that mounts this module.
 * @see ./src/client.js — the browser half.
 */
export function apply() {}
