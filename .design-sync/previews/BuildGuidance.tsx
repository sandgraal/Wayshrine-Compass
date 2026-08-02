import * as React from "react";
import { BuildGuidance } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

/**
 * BuildGuidance renders each block as a native <details>, which is collapsed on
 * first paint. A static screenshot would show only the summaries, so this opens
 * them after mount — the real rendered output, just not behind a click.
 */
const Expanded = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.querySelectorAll("details").forEach((d) => {
      d.open = true;
    });
  }, []);
  return <div ref={ref}>{children}</div>;
};

/** Shape mirrors the seed guidance in src/data/builds.ts. */
const BLOCKS = [
  {
    platform: "all" as const,
    title: "How this build plays",
    body:
      "Keep your damage-over-time effects from the back bar running, then spend globals on your front-bar spammable. Light attack between every cast. The Sorcerer kit rewards keeping every timer rolling before you drop into execute range.",
  },
  {
    platform: "pc" as const,
    title: "Measuring your damage",
    body:
      "Install Combat Metrics (Minion) and parse on the 21M trial dummy. Aim to keep your DoT uptimes above 90% before chasing gear upgrades.",
    consoleAlternative:
      "Console has no parse addons. Use the 6M target skeleton in a guildhall or your house and time your kill: under 90 seconds is roughly the same benchmark as a 60k parse on PC.",
  },
  {
    platform: "all" as const,
    title: "Bar swap discipline",
    body:
      "Swap only when a timer is actually due. A wasted swap costs you a global and drops your spammable pressure right when execute range opens up.",
  },
];

export const Collapsed = () => (
  <Surface>
    <div className="flex max-w-xl flex-col gap-2">
      <BuildGuidance blocks={BLOCKS} />
    </div>
  </Surface>
);

export const Opened = () => (
  <Surface>
    <Expanded>
      <div className="flex max-w-xl flex-col gap-2">
        <BuildGuidance blocks={BLOCKS} />
      </div>
    </Expanded>
  </Surface>
);
