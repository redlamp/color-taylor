interface SlideProps {
  mode?: string;
  /** Fade a continuous gradient over the discrete cells, so the steps vanish. */
  smoothOverlay?: boolean;
  visiblePanels?: string[];
  lockedChannels?: ('r' | 'g' | 'b')[];
  initialHsb?: { h: number; s: number; b: number };
  showRgbAnimate?: boolean;
  showHexInPreview?: boolean;
  showHsbInPreview?: boolean;
  showSteppers?: boolean;
  hsbCircleShape?: 'circle' | 'hexagon';
  showSineWave?: boolean;
  heading?: string;
  subheading?: string;
  body?: string;
  introText?: string[];
  palette?: 'cga16' | 'websafe256';
  bitDepth?: number;
}

export interface Slide {
  id: string;
  title?: string;
  type?: string;
  component?: string;
  props?: SlideProps;
  subtitle?: string;
  caption?: string;
  titleMeta?: { bits: number; colorCount: number; year: number; os: string };
}

export const slides: Slide[] = [
  {
    id: '00-intro',
    title: 'Hi, I\u2019m Taylor',
    type: 'static',
    component: 'MonitorPanel',
    props: { mode: 'intro' },
    subtitle: 'UX Design Lead at Launchpad',
    caption: 'I wanted to share a little about RGB colors and how they map to HSB.',
  },
  {
    id: '00b-acronyms',
    title: '',
    type: 'static',
    component: 'MonitorPanel',
    props: { mode: 'acronyms' },
    caption: 'RGB stands for Red, Green, and Blue. HSB stands for Hue, Saturation, and Brightness.\nThese are two different ways to describe colors on computer screens.',
  },
  {
    id: '01-1bit',
    title: 'Black & White',
    titleMeta: { bits: 1, colorCount: 2, year: 1984, os: 'System 1.0' },
    type: 'static',
    component: 'MonitorPanel',
    props: { mode: 'bw' },
    caption: 'But first, a little history. My first computer was a Macintosh Plus,\nwhich had exactly two colors, Black and White.',
  },
  {
    id: '02-sixteen',
    title: '16 Colors',
    titleMeta: { bits: 4, colorCount: 16, year: 1987, os: 'System 5' },
    type: 'static',
    component: 'MonitorPanel',
    props: { mode: 'c16' },
    caption: 'Then came sixteen colors. Still a pretty small world...\nbut suddenly things felt a little more alive.',
  },
  {
    id: '03-256',
    title: '256 Colors',
    titleMeta: { bits: 8, colorCount: 256, year: 1987, os: 'System 5' },
    type: 'static',
    component: 'MonitorPanel',
    props: { mode: 'c256' },
    caption: '256 colors. Each one had a number, a fixed spot in a lookup table.\nYou didn\'t describe the color, you referenced it.',
  },
  {
    id: '04-channels',
    title: 'Thousands, then Millions',
    titleMeta: { bits: 24, colorCount: 16777216, year: 1991, os: 'System 7' },
    type: 'static',
    component: 'MonitorPanel',
    // Was two slides, 04-thousands and 05-millions. They rendered the identical
    // cell grid from the same generator; the only difference was this overlay,
    // and AnimatedGrid's own fast path detected that nothing moved between them
    // and skipped the transition - two slides for a caption swap and a counter.
    // Merged, the overlay becomes the beat: the ramps arrive in visible steps
    // and then the steps dissolve, which is the whole content of "more bits".
    props: { mode: 'thousands', smoothOverlay: true },
    caption: 'Then thousands, and then millions - but notice what stops changing. Three channels, Red, Green and Blue, each a ramp from black to full intensity.\nMore bits only made the steps finer, until they were too small to see. _That\'s where RGB came in, and it has not changed since._',
  },
  {
    id: '06-spectrum',
    title: 'The Full Spectrum',
    type: 'static',
    component: 'MonitorPanel',
    props: { mode: 'hsl-gradient' },
    caption: 'In reality, those millions of colors fill a continuous spectrum.\nHue across, lightness top to bottom. Every color the screen can show.',
  },
  {
    id: '07-red',
    title: 'The Red Channel',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'large-preview'],
      lockedChannels: ['g', 'b'],
      initialHsb: { h: 0, s: 100, b: 100 },
      showRgbAnimate: true,
    },
    caption: 'Red is just a channel. Zero is black. 255 is full red. On its own, it\'s just a range.',
  },
  {
    id: '08-mixing',
    title: 'Mixing in Green and Blue',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'large-preview'],
      initialHsb: { h: 200, s: 80, b: 90 },
      showRgbAnimate: true,
    },
    caption: 'Same idea for green and blue. Three separate channels. Each one from black to its full value.\nPut them together and you get a color. It works. But it\'s not always obvious where you\'ll land.',
  },
  {
    id: '09-hex',
    title: 'Describing Colors with Numbers',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'large-preview'],
      showHexInPreview: true,
      initialHsb: { h: 200, s: 80, b: 90 },
      showRgbAnimate: true,
    },
    caption: 'Hexadecimal values are used to describe colors as 6 character values. Each color channel has a value between 0-255,\nwhich can also be described as a float from 0 to 1.',
  },
  {
    id: '09-hsb',
    title: 'Finding HSB',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'hsb-sliders', 'large-preview'],
      showHexInPreview: true,
      showHsbInPreview: true,
      initialHsb: { h: 200, s: 80, b: 90 },
      showRgbAnimate: true,
    },
    caption: 'Then I found HSB. Hue, Saturation, Brightness.\nSuddenly I could think in terms of: what color is it? How rich is it? How bright is it?',
  },
  {
    id: '10-hsb-circle',
    title: 'The Color Wheel',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'hsb-sliders', 'hsb-circle'],
      showSteppers: true,
      initialHsb: { h: 200, s: 80, b: 90 },
      showRgbAnimate: true,
    },
    caption: 'The HSB color wheel felt more natural to me,\nand matched lessons from color theory.',
  },
  {
    id: '12-hexagon',
    title: 'The Color Hexagon',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'hsb-sliders', 'hsb-circle'],
      showSteppers: true,
      hsbCircleShape: 'hexagon',
      initialHsb: { h: 200, s: 80, b: 90 },
      showRgbAnimate: true,
    },
    caption: 'This is where it all clicks. The hexagon shows you how colors come together.\nThe line segments show how each RGB color channel contributes.',
  },
  {
    id: '13-equations',
    title: 'The Equations',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['rgb-sliders', 'hsb-sliders', 'hsb-circle', 'equations'],
      showSteppers: true,
      hsbCircleShape: 'hexagon',
      initialHsb: { h: 200, s: 80, b: 90 },
      showRgbAnimate: true,
    },
    caption: 'Each color tells you something about how it\'s constructed.\nThese equations show the math to go from RGB to HSB.',
  },
  {
    id: '15-app',
    title: 'Introducing Color Taylor \uD83E\uDDF5',
    subtitle: 'A tool to explore how RGB and HSB work together',
    type: 'interactive',
    component: 'PresentationColorPicker',
    props: {
      visiblePanels: ['color-taylor-app'],
    },
    caption: 'Now give the app a try yourself.',
  },
];
