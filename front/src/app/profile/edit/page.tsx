import { redirect } from 'next/navigation';

/** The edit screen merged into /profile (inline editing) — keep old links working. */
export default function EditProfilePage() {
  redirect('/profile?edit=1');
}
