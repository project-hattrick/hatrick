'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsTab } from '@/enums/settings-tab.enum';
import type { AuthUser } from '@/services/auth.service';
import { ResponsibleGamingPanel } from './responsible-gaming-panel';
import { SettingsAccountTab } from './settings-account-tab';
import { SettingsPreferencesTab } from './settings-preferences-tab';
import { StakeLimitsPanel } from './stake-limits-panel';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser;
  onSignOut: () => void;
}

/**
 * Account settings modal, opened from the navbar account menu. Tabbed: Account (identity,
 * session, sign out), Preferences (language, notifications, cookie notice) and Safer play —
 * the sensitive personal controls that don't belong on the public-facing profile page.
 */
export function SettingsDialog({ open, onOpenChange, user, onSignOut }: SettingsDialogProps) {
  const signOutAndClose = () => {
    onOpenChange(false);
    onSignOut();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Your account, preferences and safer-play controls.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={SettingsTab.Account}>
          <TabsList className="w-full">
            <TabsTrigger value={SettingsTab.Account}>Account</TabsTrigger>
            <TabsTrigger value={SettingsTab.Preferences}>Preferences</TabsTrigger>
            <TabsTrigger value={SettingsTab.SaferPlay}>Safer play</TabsTrigger>
          </TabsList>

          <TabsContent value={SettingsTab.Account} className="pt-2">
            <SettingsAccountTab user={user} onSignOut={signOutAndClose} />
          </TabsContent>
          <TabsContent value={SettingsTab.Preferences} className="pt-2">
            <SettingsPreferencesTab />
          </TabsContent>
          <TabsContent value={SettingsTab.SaferPlay} className="flex flex-col gap-4 pt-2">
            <ResponsibleGamingPanel />
            <StakeLimitsPanel />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
