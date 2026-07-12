import { buildLegalMetadata, LegalPage } from '../legal-page';

export const generateMetadata = (props: { params: Promise<{ locale: string }> }) =>
  buildLegalMetadata(props, 'cookies', '/legal/cookies');

export default function CookiesPage(props: { params: Promise<{ locale: string }> }) {
  return LegalPage({ ...props, docKey: 'cookies' });
}
