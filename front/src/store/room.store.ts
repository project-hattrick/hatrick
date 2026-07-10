import { create } from 'zustand';

import type { RoomMemberDto, RoomMessageDto } from '@/services/room.service';

interface RoomStore {
  roomId: string | null;
  members: RoomMemberDto[];
  messages: RoomMessageDto[];
  /** Live sockets currently watching the room (from the presence event). */
  presenceCount: number;
  setRoom: (roomId: string, members: RoomMemberDto[]) => void;
  addMember: (member: RoomMemberDto) => void;
  seedMessages: (messages: RoomMessageDto[]) => void;
  addMessage: (message: RoomMessageDto) => void;
  setPresence: (count: number) => void;
  reset: () => void;
}

/**
 * Ephemeral room state (not persisted, like the duel/crowd stores). Hydrated from
 * the room queries and kept live by the socket feed (use-room-feed).
 */
export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  members: [],
  messages: [],
  presenceCount: 0,
  setRoom: (roomId, members) => set({ roomId, members }),
  addMember: (member) =>
    set((state) =>
      state.members.some((m) => m.userId === member.userId)
        ? state
        : { members: [...state.members, member] },
    ),
  seedMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) =>
      state.messages.some((m) => m.id === message.id)
        ? state
        : { messages: [...state.messages, message].slice(-100) },
    ),
  setPresence: (presenceCount) => set({ presenceCount }),
  reset: () => set({ roomId: null, members: [], messages: [], presenceCount: 0 }),
}));

export const useRoomMembers = () => useRoomStore((state) => state.members);
export const useRoomMessages = () => useRoomStore((state) => state.messages);
export const useRoomPresence = () => useRoomStore((state) => state.presenceCount);
