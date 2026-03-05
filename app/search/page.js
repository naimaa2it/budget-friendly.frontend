import { Suspense } from 'react';
import SearchResultsClient from '@/components/category/SearchResultsClient';

export const metadata = {
  title: 'Search Results',
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-32">
        <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    }>
      <SearchResultsClient />
    </Suspense>
  );
}
