'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

import { SiteNavbar } from '@/components/common/site-navbar';
import { ParallaxStage } from '@/components/home/parallax-stage';
import { Scoreboard } from '@/components/live/scoreboard';
import { MatchTimeline } from '@/components/live/match-timeline';
import { RoomDock } from './room-dock';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { useAutoReplay } from '@/hooks/use-auto-replay';
import { useJoinRoom, useRoom, useRoomMembersQuery, useRoomMessagesQuery } from '@/services/queries';
import { useRoomFeed } from '@/services/realtime/use-room-feed';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useAuthStore } from '@/store/auth.store';
import { useRoomStore } from '@/store/room.store';

/**
 * Private-room watch experience: the live pitch fills the screen (engine backdrop
 * behind the normal navbar), with the room controls collapsed into one floating
 * dock (Chat · Bet · Invite). Game-focused — no home-only widgets.
 */
export function RoomView({ roomId }: { roomId: string }) {
  const localizedPath = useLocalizedPath();
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const authed = useAuthStore((s) => s.status === 'authed');

  // Drive the engine (same feed the home hero uses); room data over its own hooks.
  useLiveFeed();
  useAutoReplay();
  const roomQuery = useRoom(roomId);
  const membersQuery = useRoomMembersQuery(roomId);
  useRoomMessagesQuery(roomId); // seeds chat history into the store
  useRoomFeed(roomId); // live chat + member + presence

  const setRoom = useRoomStore((s) => s.setRoom);
  const reset = useRoomStore((s) => s.reset);
  const joinRoom = useJoinRoom();

  const room = roomQuery.data;
  const members = membersQuery.data;

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
      joinRoom.mutate(token);
    }
  }, [token, authed, joinRoom]);

  const inviteToken = room?.inviteToken ?? token ?? null;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const inviteUrl = inviteToken
    ? `${origin}${localizedPath(`/room/${roomId}`)}?t=${inviteToken}`
    : `${origin}${localizedPath(`/room/${roomId}`)}`;

  return (
    <div className="relative w-full">
      <SiteNavbar />
      <section className="relative h-[100svh] w-full overflow-hidden">
        {/* Engine backdrop — the live pitch fills the screen (fixes the black bg). */}
        <ParallaxStage />

        {/* Trimmed, game-focused overlays over the pitch. */}
        <div className="relative z-10 h-full">
          {/* Scoreboard — top-centre, cleared below the navbar. */}
          <div className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 -translate-x-1/2 md:top-16">
            <Scoreboard />
          </div>

          {/* Playback transport + event timeline. */}
          <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 md:px-6 md:pb-4">
            <MatchTimeline />
          </div>
        </div>

        {/* The single floating room widget (invite · bet · chat). */}
        <RoomDock
          roomId={roomId}
          roomName={room?.name ?? 'Private room'}
          inviteToken={inviteToken}
          inviteUrl={inviteUrl}
        />
      </section>
    </div>
  );
}
