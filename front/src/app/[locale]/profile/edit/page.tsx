import { redirect } from 'next/navigation';
import { localizePath } from '@/i18n/path';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales';

/** The edit screen merged into /profile (inline editing) — keep old links working. */
export default async function EditProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(localizePath('/profile?edit=1', isLocale(locale) ? locale : DEFAULT_LOCALE));
}
