import type { AuthUser } from './auth.service';
import { endpoints } from './endpoints';
import { api } from './http';

/** The user-editable identity fields (mirror of the api UpdateProfileDto). */
export interface ProfilePatch {
  displayName?: string;
  username?: string;
  country?: string;
  bio?: string;
  portraitSrc?: string;
}

/**
 * Profile persistence seam. PATCH /users/:id is guarded + self-only on the api,
 * so the session cookie (sent by the http client) both authenticates and scopes
 * the write to the signed-in user.
 */
export const profileService = {
  update: (userId: string, patch: ProfilePatch): Promise<AuthUser> =>
    api.patch<AuthUser>(endpoints.users.byId(userId), patch),
};
