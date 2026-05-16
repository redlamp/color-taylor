import { useMemo } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import CollapsibleSection from './CollapsibleSection';
import { complementary, lighter, darker, hsbToRgb, rgbToHex } from '../utils/colorConversions';

const OPS = [
  { id: 'inverse',  label: 'Inverse/Complimentary',  tooltip: 'Rotate hue 180°' },
  { id: 'lighten',  label: 'Lighten',  tooltip: 'Brightness +15%' },
  { id: 'darken',   label: 'Darken',   tooltip: 'Brightness -15%' },
];

function computeResult(opId, hsb) {
  switch (opId) {
    case 'inverse': return complementary(hsb.h, hsb.s, hsb.b);
    case 'lighten': return lighter(hsb.h, hsb.s, hsb.b);
    case 'darken':  return darker(hsb.h, hsb.s, hsb.b);
    default: return null;
  }
}

export default function ColorOperations({ hsb, onAnimateToHsb }) {
  const results = useMemo(() => {
    return OPS.map(op => {
      const resultHsb = computeResult(op.id, hsb);
      const resultRgb = hsbToRgb(resultHsb.h, resultHsb.s, resultHsb.b);
      return { ...op, hsb: resultHsb, hex: rgbToHex(resultRgb.r, resultRgb.g, resultRgb.b) };
    });
  }, [hsb]);

  return (
    <div className="w-full mt-2">
      <CollapsibleSection id="conversions" title="Conversions" level="h3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {results.map(op => (
            <Tooltip key={op.id}>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none transition-colors"
                  onClick={() => onAnimateToHsb(op.hsb)}
                >
                  <span
                    className="inline-block w-4 h-4 rounded-sm shrink-0"
                    style={{
                      backgroundColor: op.hex,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                    }}
                  />
                  {op.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="text-xs">
                {op.tooltip} → {op.hex.toUpperCase()}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
