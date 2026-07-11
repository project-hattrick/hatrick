'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { SiteNavbar } from '@/components/common/site-navbar';
import { GlassPanel } from '@/components/common/glass-panel';
import { CircleNotch, Lock, SignIn } from '@/components/common/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParallaxStage } from '@/components/home/parallax-stage';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { useAutoReplay } from '@/hooks/use-auto-replay';
import { useRoomFixture } from '@/hooks/use-room-fixture';
import { useRoomPicksDriver } from '@/hooks/use-room-picks-driver';
import { useJoinRoom, useRoom, useRoomMembersQuery, useRoomMessagesQuery } from '@/services/queries';
import { useRoomFeed } from '@/services/realtime/use-room-feed';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useAuthStore } from '@/store/auth.store';
import { useRoomStore } from '@/store/room.store';
import { useUiStore } from '@/store/ui.store';
import { RoomImmersiveLayout } from './room-immersive-layout';
import { RoomSplitLayout } from './room-split-layout';

/** Centered glass card over the ambient stage for the pre-room states (loading / gate / error). */
function RoomStateCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 grid h-full place-items-center px-4">
      <GlassPanel tone="dark" radius="xl" className="flex max-w-sm flex-col items-center gap-3 px-8 py-7 text-center">
        {children}
      </GlassPanel>
    </div>
  );
}

/**
 * Private-room watch experience: the live pitch fills the screen behind the
 * normal navbar, with room widgets pinned like the home hero. Honours the
 * Split/Immersive toggle (MatchTimeline) exactly like the home dashboard —
 * ParallaxStage stays OUTSIDE the toggled subtree so the ambient engine never
 * remounts; split covers it with its opaque framed layout.
 *
 * Session-start order: validate session (unknown → checking card) → sign-in gate
 * for guests → load the room (spinner / not-found) → point the stage at the
 * ROOM's fixture (auto-replay held off meanwhile) → render the widgets.
 */
export function RoomView({ roomId }: { roomId: string }) {
  const localizedPath = useLocalizedPath();
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const status = useAuthStore((s) => s.status);
  const authed = status === 'authed';
  const openLogin = useUiStore((s) => s.openLogin);
  const heroLayout = useUiStore((s) => s.heroLayout);

  // Drive the engine (same feed the home hero uses) + the room's social picks.
  useLiveFeed();
  useRoomPicksDriver();
  const roomQuery = useRoom(roomId);
  const membersQuery = useRoomMembersQuery(roomId);
  useRoomMessagesQuery(roomId); // seeds chat history into the store
  useRoomFeed(roomId); // live chat + member + presence

  const room = roomQuery.data;
  const members = membersQuery.data;

  // Everyone lands on the ROOM's match; the ambient auto-replay stays off until we know the room
  // has no fixture of its own (prevents a random replay flashing in first).
  const { pending: fixturePending } = useRoomFixture(room?.fixtureId);
  useAutoReplay(room !== undefined && room.fixtureId == null);

  const setRoom = useRoomStore((s) => s.setRoom);
  const reset = useRoomStore((s) => s.reset);
  const joinRoom = useJoinRoom();

  // Hydrate the store from the room + members queries.
  useEffect(() => {
    if (room) setRoom(room.id, members ?? room.members);
  }, [room, members, setRoom]);

  // Reset the ephemeral store when leaving the room.
  useEffect(() => () => reset(), [reset]);

  // Auto-join via the invite link's ?t= token (idempotent on the server).
  const joinedRef = useRef(false);
  useEffect(() => {
    if (token && authed && !joinedRef.current) {
      joinedRef.current = true;
      joinRoom.mutate(token, {
        onError: () => toast.error('This invite link is invalid or has expired.'),
      });
    }
  }, [token, authed, joinRoom]);

  const inviteToken = room?.inviteToken ?? token ?? null;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const inviteUrl = inviteToken
    ? `${origin}${localizedPath(`/room/${roomId}`)}?t=${inviteToken}`
    : `${origin}${localizedPath(`/room/${roomId}`)}`;

  const roomName = room?.name ?? 'Private room';
  const layoutProps = { roomId, inviteToken, inviteUrl };

  // Pre-room states, in session-start order. The ambient stage stays behind all of them.
  let gate: ReactNode = null;
  if (status === 'unknown') {
    gate = (
      <RoomStateCard>
        <CircleNotch className="size-6 animate-spin text-neon" />
        <span className="text-sm font-semibold">Checking your session…</span>
      </RoomStateCard>
    );
  } else if (!authed) {
    gate = (
      <RoomStateCard>
        <Lock className="size-6 text-neon" weight="duotone" />
        <span className="text-base font-bold">This is a private room</span>
        <span className="text-xs text-muted-foreground">
          Sign in to join your friends, chat and follow the match together.
        </span>
        <Button size="sm" className="mt-1" onClick={openLogin}>
          <SignIn className="size-4" /> Sign in to join
        </Button>
      </RoomStateCard>
    );
  } else if (roomQuery.isError) {
    gate = (
      <RoomStateCard>
        <Lock className="size-6 text-live" weight="duotone" />
        <span className="text-base font-bold">Room not found</span>
        <span className="text-xs text-muted-foreground">
          This room doesn&apos;t exist anymore, or you don&apos;t have access to it. Ask the host for a
          fresh invite link.
        </span>
        <Link href={localizedPath('/')} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-1')}>
          Back to the match
        </Link>
      </RoomStateCard>
    );
  } else if (!room || fixturePending) {
    // Hold until the ROOM's match is on the store — the widgets must never flash the fallback match.
    gate = (
      <RoomStateCard>
        <CircleNotch className="size-6 animate-spin text-neon" />
        <span className="text-sm font-semibold">{room ? 'Loading the match…' : 'Joining room…'}</span>
      </RoomStateCard>
    );
  }

  return (
    <div className="relative w-full">
      <SiteNavbar />
      <section className="relative h-[100svh] w-full overflow-hidden">
        {/* Ambient engine — never remounts on layout toggles (mirrors home). */}
        <ParallaxStage />

        {gate ?? (
          <>
            {/* Mobile is always immersive; desktop cross-fades between the two layouts. */}
            <div className="relative z-10 h-full md:hidden">
              <RoomImmersiveLayout {...layoutProps} />
            </div>
            <div key={heroLayout} className="hero-fade relative z-10 hidden h-full md:block">
              {heroLayout === HeroLayout.Immersive ? (
                <RoomImmersiveLayout {...layoutProps} />
              ) : (
                <RoomSplitLayout {...layoutProps} roomName={roomName} />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
