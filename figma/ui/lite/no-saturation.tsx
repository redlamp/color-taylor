/**
 * Stands in for all three hex/Saturation* components.
 *
 * The plugin passes satBar={false}, so none of them ever render - but the prop
 * is a runtime value, so the bundler has to keep them. The bar under the
 * hexagon is the app's layout; the panel puts saturation on an ordinary
 * horizontal slider in its editor, where the other channels already are.
 */
export default function NoSaturation() {
  return null;
}
