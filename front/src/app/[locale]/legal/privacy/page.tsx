import { buildLegalMetadata, LegalPage } from '../legal-page';

export const generateMetadata = (props: { params: Promise<{ locale: string }> }) =>
  buildLegalMetadata(props, 'privacy', '/legal/privacy');

export default function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
  return LegalPage({ ...props, docKey: 'privacy' });
}
