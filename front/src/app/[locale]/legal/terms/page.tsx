import { buildLegalMetadata, LegalPage } from '../legal-page';

export const generateMetadata = (props: { params: Promise<{ locale: string }> }) =>
  buildLegalMetadata(props, 'terms', '/legal/terms');

export default function TermsPage(props: { params: Promise<{ locale: string }> }) {
  return LegalPage({ ...props, docKey: 'terms' });
}
