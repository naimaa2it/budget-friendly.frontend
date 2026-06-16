import BlogPageClient from './PageClient';

export const metadata = {
  title: 'Blog Article',
  description:
    'Read gadget guides, tech tips, and product reviews on the SmartBuy BD blog.',
};

export function generateStaticParams() {
  return [{ slug: '__placeholder__' }];
}

export default function Page() {
  return <BlogPageClient />;
}
