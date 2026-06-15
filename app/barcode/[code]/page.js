import BarcodeLookupClient from './_client';

export function generateStaticParams() { return []; }

export default function Page(props) {
  return <BarcodeLookupClient {...props} />;
}
