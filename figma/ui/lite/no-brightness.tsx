/**
 * Stands in for all three hex/Brightness* components.
 *
 * The plugin passes blBar={false}, so none of them ever render - but the prop
 * is a runtime value, so the bundler has to keep them. The vertical
 * brightness bar, its handle and its tick labels are the app's layout; the
 * plugin puts brightness on a horizontal slider instead.
 */
export default function NoBrightness() {
  return null;
}
