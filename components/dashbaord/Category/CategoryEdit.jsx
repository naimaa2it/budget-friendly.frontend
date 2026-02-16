"use client";

import React from 'react';
import CategoryCreate from './CategoryCreate';

export default function CategoryEdit({ categoryId }) {
  // delegate to CategoryCreate implementation (handles edit when categoryId !== 'new')
  return <CategoryCreate categoryId={categoryId} />;
}
