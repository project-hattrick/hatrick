'use client';

import { use } from 'react';

import { RoomView } from '@/components/room/room-view';

/**
 * Invite-only room page — full-bleed watch experience + invite/bet/chat rail.
 * Metadata (noindex) lives in the sibling layout.tsx.
 */
export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RoomView roomId={id} />;
}
