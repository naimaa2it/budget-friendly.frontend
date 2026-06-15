"use client";

// `/dashboard/blog/new` is served by a dedicated static page (app/.../blog/new/page.js)
// so this dynamic renderer only ever sees real post IDs.
import React, { useEffect, useState } from 'react';
import BlogCreate from '@/components/dashboard/Blog/BlogCreate';
import BlogEdit from '@/components/dashboard/Blog/BlogEdit';

export function generateStaticParams() { return []; }

export default function Page({ params }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [id, setId] = useState(null);
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = params instanceof Promise ? await params : params;
      const postId = resolved?.id || 'new';
      setId(postId);
      if (postId && postId !== 'new') {
        // fetch existing post data
        try {
          const resp = await fetch(`${API}/api/admin/blog/${postId}`, { credentials: 'include' });
          const body = await resp.json();
          if (resp.ok && body.post) {
            setPostData(body.post);
          }
        } catch (e) {
          console.error('Failed to load post', e);
        }
      }
    };
    resolveParams();
  }, [params]);

  if (id === null) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      {id === 'new' ? (
        <BlogCreate />
      ) : (
        <BlogEdit postId={id} />
      )}
    </div>
  );
}
