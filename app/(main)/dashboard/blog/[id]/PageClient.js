"use client";

// `/dashboard/blog/new` is served by a dedicated static page (app/.../blog/new/page.js)
// so this dynamic renderer only ever sees real post IDs.
import React, { useEffect, useState } from 'react';
import BlogCreate from '@/components/dashboard/Blog/BlogCreate';
import BlogEdit from '@/components/dashboard/Blog/BlogEdit';
import { useUrlParam } from '@/hooks/useUrlParam';

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const id = useUrlParam();
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    if (!id || id === 'new') return;
    const fetchPost = async () => {
      try {
        const resp = await fetch(`${API}/api/admin/blog/${id}`, { credentials: 'include' });
        const body = await resp.json();
        if (resp.ok && body.post) {
          setPostData(body.post);
        }
      } catch (e) {
        console.error('Failed to load post', e);
      }
    };
    fetchPost();
  }, [id]);

  if (!id) {
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
