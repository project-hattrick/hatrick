import { buildLegalMetadata, LegalPage } from '../legal-page';

export const generateMetadata = (props: { params: Promise<{ locale: string }> }) =>
  buildLegalMetadata(props, 'responsibleGaming', '/legal/responsible-gaming');

export default function ResponsibleGamingPage(props: { params: Promise<{ locale: string }> }) {
  return LegalPage({ ...props, docKey: 'responsibleGaming' });
}
