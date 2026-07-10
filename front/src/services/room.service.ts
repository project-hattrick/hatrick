import { RoomMemberRole, RoomStatus } from '@/enums/room-event.enum';
import { endpoints } from './endpoints';
import { api } from './http';

/** A room member row (mirror of the api RoomMemberDto). */
export interface RoomMemberDto {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: RoomMemberRole;
  joinedAt: string;
}

/** A room chat message (mirror of the api RoomMessageDto). */
export interface RoomMessageDto {
  id: string;
  userId: string;
  author: string;
  body: string;
  createdAt: string;
}

/** A room with its members (mirror of the api RoomDto). */
export interface RoomDto {
  id: string;
  name: string;
  status: RoomStatus;
  inviteToken: string;
  hostId: string;
  fixtureId: number | null;
  createdAt: string;
  members: RoomMemberDto[];
}

export interface CreateRoomPayload {
  name?: string;
  fixtureId?: number;
}

/**
 * Invite-only room persistence seam (guarded, self-scoped via the session cookie).
 * Membership + chat are server authority; the socket only relays live echoes.
 */
export const roomService = {
  create: (payload: CreateRoomPayload = {}): Promise<{ room: RoomDto }> =>
    api.post<{ room: RoomDto }>(endpoints.rooms.base, payload),

  getById: (id: string, signal?: AbortSignal): Promise<RoomDto> =>
    api.get<RoomDto>(endpoints.rooms.byId(id), signal),

  join: (inviteToken: string): Promise<RoomDto> =>
    api.post<RoomDto>(endpoints.rooms.join, { inviteToken }),

  listMembers: (id: string, signal?: AbortSignal): Promise<RoomMemberDto[]> =>
    api.get<RoomMemberDto[]>(endpoints.rooms.members(id), signal),

  listMessages: (id: string, signal?: AbortSignal): Promise<RoomMessageDto[]> =>
    api.get<RoomMessageDto[]>(endpoints.rooms.messages(id), signal),

  postMessage: (id: string, body: string): Promise<RoomMessageDto> =>
    api.post<RoomMessageDto>(endpoints.rooms.messages(id), { body }),
};
