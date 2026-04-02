import PixelGrid from './slides/PixelGrid';
import ColorPalette from './slides/ColorPalette';
import NarrativeSlide from './slides/NarrativeSlide';

// PresentationColorPicker will be added in a follow-up step
// For now, interactive slides show a placeholder

function InteractivePlaceholder({ visiblePanels }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg text-muted-foreground">Interactive panel</p>
      <p className="text-sm text-muted-foreground/60">
        Panels: {visiblePanels?.join(', ') || 'all'}
      </p>
    </div>
  );
}

export const slideComponents = {
  PixelGrid,
  ColorPalette,
  NarrativeSlide,
  PresentationColorPicker: InteractivePlaceholder,
};
