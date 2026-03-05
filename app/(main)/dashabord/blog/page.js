import React from 'react';
import BlogList from '@/components/dashboard/Blog/BlogList';

export default function BlogAdminPage(){
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded shadow mb-6">
        <h1 className="text-xl font-semibold">Blog / Content</h1>
        <p className="text-sm text-gray-600 mt-2">Create and manage blog posts. The editor is WYSIWYG (MS Word-like toolbar) — content is saved as HTML.</p>
      </div>

      <BlogList />
    </div>
  );
}
