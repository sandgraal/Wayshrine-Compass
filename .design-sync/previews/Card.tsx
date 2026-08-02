import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

export const BuildCard = () => (
  <Surface>
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Sorcerer DPS</CardTitle>
        <CardDescription>Trials &middot; Damage &middot; Storm Calling / Daedric Summoning</CardDescription>
        <CardAction>
          <Badge>Verified U50</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          A pet-free lightning build that leans on back-bar damage-over-time uptime and a
          hard-hitting execute. Every set below is verified against the current patch.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Open build</Button>
        <Button size="sm" variant="outline">
          Fork in planner
        </Button>
      </CardFooter>
    </Card>
  </Surface>
);

export const WithFooterBorder = () => (
  <Surface>
    <Card className="max-w-md">
      <CardHeader className="border-b">
        <CardTitle>Update 50 changes</CardTitle>
        <CardDescription>3 entities in this build moved last patch</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <ul className="flex flex-col gap-1.5 text-muted-foreground">
          <li>Crystal Shard &mdash; cast time reduced</li>
          <li>Deadly Strike &mdash; 5-piece bonus rebalanced</li>
          <li>Deadly Aim &mdash; champion point cost changed</li>
        </ul>
      </CardContent>
      <CardFooter className="border-t">
        <Button size="sm" variant="ghost">
          Review changes
        </Button>
      </CardFooter>
    </Card>
  </Surface>
);

export const Grid = () => (
  <Surface>
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Arcanist Tank</CardTitle>
          <CardDescription>Veteran dungeons</CardDescription>
          <CardAction>
            <Badge variant="secondary">U49</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Block-heavy setup with strong group utility between taunts.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Templar Healer</CardTitle>
          <CardDescription>Trials</CardDescription>
          <CardAction>
            <Badge variant="destructive">Stale</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ritual-centric healing with heavy uptime on group buffs.
        </CardContent>
      </Card>
    </div>
  </Surface>
);
