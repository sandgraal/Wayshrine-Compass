import * as React from "react";
import { PlatformProvider, PlatformToggle, BuildGuidance } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

const BLOCKS = [
  {
    platform: "all" as const,
    title: "How this build plays",
    body:
      "Keep your back-bar damage-over-time effects rolling, then spend globals on the front-bar spammable.",
  },
  {
    platform: "pc" as const,
    title: "Measuring your damage",
    body: "Install Combat Metrics (Minion) and parse on the 21M trial dummy.",
    consoleAlternative:
      "Console has no parse addons. Time your kill on the 6M skeleton instead: under 90 seconds is roughly a 60k parse.",
  },
];

/**
 * PlatformProvider renders no markup of its own — it supplies the platform
 * context that PlatformToggle writes and BuildGuidance reads. These cells show
 * what it enables: the toggle reflects context, and guidance is filtered by it.
 */
export const ProvidesPlatformContext = () => (
  <Surface>
    <PlatformProvider>
      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">Platform mode</span>
          <PlatformToggle />
        </div>
        <div className="flex flex-col gap-2">
          <BuildGuidance blocks={BLOCKS} />
        </div>
      </div>
    </PlatformProvider>
  </Surface>
);

export const WrapsTheApp = () => (
  <Surface>
    <PlatformProvider>
      <div className="max-w-xl rounded-lg border border-border">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="font-semibold text-primary">Wayshrine Compass</span>
          <span className="ml-auto">
            <PlatformToggle />
          </span>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Everything below the provider can read and set the platform mode, so console
          players never see addon-dependent guidance.
        </div>
      </div>
    </PlatformProvider>
  </Surface>
);
