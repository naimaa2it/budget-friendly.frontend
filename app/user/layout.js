// All /user/* routes are private — block search engine indexing.
export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function UserLayout({ children }) {
  return <>{children}</>;
}
