import * as React from "react";
import { Badge } from "wayshrine-compass";

/**
 * Wayshrine Compass is dark-first: the palette lives on `:root` and the app
 * paints it on `body`. Preview cards render on a white page, so every preview
 * repaints the DS surface itself. `-m-6` cancels the card's 24px padding so the
 * surface goes full-bleed.
 */
const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

export const Variants = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Verified U50</Badge>
      <Badge variant="secondary">Trial</Badge>
      <Badge variant="destructive">Stale</Badge>
      <Badge variant="outline">Dungeon</Badge>
      <Badge variant="ghost">Overland</Badge>
      <Badge variant="link">Patch notes</Badge>
    </div>
  </Surface>
);

export const InContext = () => (
  <Surface>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Deadly Strike</span>
        <Badge variant="secondary">Trial</Badge>
        <Badge variant="outline">5-piece</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sergeant&rsquo;s Mail</span>
        <Badge variant="secondary">Overland</Badge>
        <Badge>Craftable</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Perfected Whorl of the Depths</span>
        <Badge variant="secondary">Trial</Badge>
        <Badge variant="destructive">Changed in U50</Badge>
      </div>
    </div>
  </Surface>
);

export const WithIcon = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <Badge>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Verified
      </Badge>
      <Badge variant="secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Pending review
      </Badge>
    </div>
  </Surface>
);
