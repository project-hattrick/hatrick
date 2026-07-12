import { buildLegalMetadata, LegalPage } from '../legal-page';

export const generateMetadata = (props: { params: Promise<{ locale: string }> }) =>
  buildLegalMetadata(props, 'geoRestricted', '/legal/geo-restricted');

export default function GeoRestrictedPage(props: { params: Promise<{ locale: string }> }) {
  return LegalPage({ ...props, docKey: 'geoRestricted' });
}
