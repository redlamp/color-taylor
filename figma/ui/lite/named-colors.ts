/**
 * The 5 KB CSS color-name table, empty for the plugin.
 *
 * ColorHexagon imports it statically for the hover-to-name readout, which is
 * driven by `showHtmlOnHex` - a prop the plugin never passes. Dead weight.
 */
export default [] as { hex: string; name: string }[];
