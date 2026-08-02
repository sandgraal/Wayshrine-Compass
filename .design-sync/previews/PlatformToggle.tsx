import * as React from "react";
import { PlatformToggle } from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

export const Default = () => (
  <Surface>
    <PlatformToggle />
  </Surface>
);

export const InHeader = () => (
  <Surface>
    <div className="rounded-lg border border-border">
      <div className="flex h-14 items-center gap-4 px-4">
        <span className="flex items-center gap-2 font-semibold text-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m16.2 7.8-2.9 6.6-6.6 2.9 2.9-6.6 6.6-2.9z" />
          </svg>
          Wayshrine Compass
        </span>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="rounded-md px-2.5 py-1.5">Builds</span>
          <span className="rounded-md px-2.5 py-1.5">Sets</span>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
            U50
          </span>
          <PlatformToggle />
        </div>
      </div>
    </div>
  </Surface>
);
