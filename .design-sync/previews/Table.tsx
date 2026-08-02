import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "wayshrine-compass";

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="-m-6 bg-background p-6 text-foreground">{children}</div>
);

const GEAR = [
  { slot: "Head", set: "Perfected Whorl of the Depths", trait: "Divines", source: "Dreadsail Reef" },
  { slot: "Shoulders", set: "Deadly Strike", trait: "Divines", source: "Cyrodiil vendor" },
  { slot: "Chest", set: "Deadly Strike", trait: "Divines", source: "Cyrodiil vendor" },
  { slot: "Hands", set: "Deadly Strike", trait: "Divines", source: "Cyrodiil vendor" },
  { slot: "Waist", set: "Perfected Whorl of the Depths", trait: "Divines", source: "Dreadsail Reef" },
  { slot: "Front bar", set: "Deadly Strike", trait: "Precise", source: "Cyrodiil vendor" },
];

export const GearTable = () => (
  <Surface>
    <Table>
      <TableCaption>Gear layout verified for Update 50.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Slot</TableHead>
          <TableHead>Set</TableHead>
          <TableHead>Trait</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {GEAR.map((g) => (
          <TableRow key={g.slot}>
            <TableCell className="text-muted-foreground">{g.slot}</TableCell>
            <TableCell className="font-medium">{g.set}</TableCell>
            <TableCell>{g.trait}</TableCell>
            <TableCell className="text-muted-foreground">{g.source}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Surface>
);

export const WithFooter = () => (
  <Surface>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Champion star</TableHead>
          <TableHead>Tree</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Deadly Aim</TableCell>
          <TableCell className="text-muted-foreground">Blue &mdash; Warfare</TableCell>
          <TableCell className="text-right font-mono">50</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Master-at-Arms</TableCell>
          <TableCell className="text-muted-foreground">Blue &mdash; Fitness</TableCell>
          <TableCell className="text-right font-mono">50</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Wrathful Strikes</TableCell>
          <TableCell className="text-muted-foreground">Blue &mdash; Fitness</TableCell>
          <TableCell className="text-right font-mono">50</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Slotted total</TableCell>
          <TableCell className="text-right font-mono">150</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </Surface>
);
