/**
 * The plugin announcement, as a news item at the foot of the settings sheet.
 *
 * The narrow-viewport half of a split: PluginBanner takes the top of the page
 * from `sm` up, and below that it does not render at all - a phone's first
 * screen is the picker, and an announcement strip was spending a scarce row on
 * something nobody opened the app to read. Tucked in here it is still one tap
 * away and costs the picker nothing.
 *
 * Not dismissible, deliberately. Dismissal exists on the banner because a promo
 * that interrupts you has to be refusable; this one is behind a panel the user
 * chose to open, which makes it reference material rather than an interruption.
 * It follows that it also ignores the banner's stored dismissal - the two are
 * different surfaces with different bargains, not one surface in two places.
 */
import { ArrowUpRight } from 'lucide-react';
import { primaryIntegration } from '@/data/integrations';
import { GLYPHS } from '@/components/IntegrationGlyph';

export function IntegrationNews() {
  const item = primaryIntegration();
  if (!item) return null;

  const Glyph = GLYPHS[item.icon];
  const live = item.status === 'live';

  return (
    <section
      aria-label="Color Taylor plugin"
      className="mt-3 rounded-lg border border-border bg-card/60 p-3 sm:hidden"
    >
      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        News
      </p>
      <div className="flex items-start gap-2.5">
        {Glyph && <Glyph className="mt-0.5 size-5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            {live
              ? `Try Color Taylor in ${item.platform}`
              : `Color Taylor is coming to ${item.platform}`}
          </p>
          {/* No anchor at all while the listing is private - a greyed-out link
              still invites the click that lands on a 404. Same rule the banner
              and decision-integrations-footer follow. */}
          {live && (
            <a
              className="ctl-quiet mt-2 h-7 rounded-full px-3 text-xs whitespace-nowrap no-underline"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the plugin
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only">
                on the {item.platform} Community (opens in a new tab)
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
