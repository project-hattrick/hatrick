'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SquadCarousel } from './widgets/squad-carousel';
import { squad, squadTabs } from '@/config/squad.config';

/** "Your squad" — roster of the user's team as cards, filtered by position tabs. */
export function SquadSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Your squad</h2>
        <p className="text-sm text-muted-foreground">The players powering your fantasy team this season.</p>
      </div>

      <Tabs defaultValue="all" className="gap-5">
        <TabsList variant="line" className="h-auto flex-wrap justify-start gap-1">
          {squadTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-3 py-1.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {squadTabs.map((tab) => {
          const players = tab.value === 'all' ? squad : squad.filter((player) => player.group === tab.value);
          return (
            <TabsContent key={tab.value} value={tab.value}>
              <SquadCarousel players={players} />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
