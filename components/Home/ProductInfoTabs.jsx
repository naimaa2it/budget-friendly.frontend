"use client";
import { useState } from "react";
import { useUser } from "@/components/context/UserContext";
import toast from "react-hot-toast";
import AuthModal from "@/components/authentication/AuthModal";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <svg
            className={`w-7 h-7 transition-colors ${
              star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.455a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.455a1 1 0 00-1.175 0l-3.37 2.455c-.783.57-1.838-.197-1.538-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.013 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductInfoTabs({ product }) {
  const [activeTab, setActiveTab] = useState("description");
  const { user } = useUser();
  // default display name from logged-in user
  const defaultName = user ? (user.name || user.email?.split('@')[0] || '') : '';

  // Reviews state
  const [reviews, setReviews] = useState(product?.reviews || []);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 0, body: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

  // Questions / Q&A state
  const [faqs, setFaqs] = useState(product?.faqs || []);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ name: '', question: '' });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [editingQIndex, setEditingQIndex] = useState(null);
  // per-question inline answer forms: { [qIdx]: { show, name, body, submitting, error, editingAIdx } }
  const [answerForms, setAnswerForms] = useState({});
  const [answerHelpfulLoading, setAnswerHelpfulLoading] = useState(null); // `${qIdx}-${aIdx}`

  const setAnswerForm = (qIdx, patch) =>
    setAnswerForms(prev => ({ ...prev, [qIdx]: { ...prev[qIdx], ...patch } }));

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewForm.rating) return setReviewError('Please select a star rating.');
    if (!reviewForm.body.trim()) return setReviewError('Please write a comment.');
    setReviewSubmitting(true);
    try {
      const isEdit = editingIndex !== null;
      const url = isEdit
        ? `${API}/api/products/${product._id}/reviews/${editingIndex}`
        : `${API}/api/products/${product._id}/reviews`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ authorName: reviewForm.name || defaultName, rating: reviewForm.rating, body: reviewForm.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setReviews(data.reviews || []);
      setReviewForm({ name: '', rating: 0, body: '' });
      setEditingIndex(null);
      setShowReviewForm(false);
      setReviewDone(true);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewEdit = (idx) => {
    const r = reviews[idx];
    setReviewForm({ name: r.authorName || defaultName, rating: r.rating || 0, body: r.body || '' });
    setEditingIndex(idx);
    setReviewDone(false);
    setReviewError('');
    setShowReviewForm(true);
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setQuestionError('');
    if (!questionForm.question.trim()) return setQuestionError('Please enter your question.');
    setQuestionSubmitting(true);
    try {
      const isEdit = editingQIndex !== null;
      const url = isEdit
        ? `${API}/api/products/${product._id}/questions/${editingQIndex}`
        : `${API}/api/products/${product._id}/questions`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: questionForm.question, askerName: questionForm.name || defaultName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setFaqs(data.faqs || []);
      setQuestionForm({ name: '', question: '' });
      setEditingQIndex(null);
      setShowQuestionForm(false);
      toast.success(isEdit ? 'Question updated!' : 'Your question has been submitted!');
    } catch (err) {
      setQuestionError(err.message);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleQuestionEdit = (idx) => {
    const f = faqs[idx];
    setQuestionForm({ name: f.askerName || defaultName, question: f.question });
    setEditingQIndex(idx);
    setQuestionError('');
    setShowQuestionForm(true);
    setActiveTab('questions');
  };

  const handleAnswerSubmit = async (e, qIdx) => {
    e.preventDefault();
    const form = answerForms[qIdx] || {};
    if (!form.body?.trim()) { setAnswerForm(qIdx, { error: 'Please write an answer.' }); return; }
    setAnswerForm(qIdx, { submitting: true, error: '' });
    try {
      const isEdit = form.editingAIdx !== undefined && form.editingAIdx !== null;
      const url = isEdit
        ? `${API}/api/products/${product._id}/questions/${qIdx}/answers/${form.editingAIdx}`
        : `${API}/api/products/${product._id}/questions/${qIdx}/answers`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: form.body, authorName: form.name || defaultName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setFaqs(data.faqs || []);
      setAnswerForm(qIdx, { show: false, body: '', name: '', submitting: false, editingAIdx: null });
      toast.success(isEdit ? 'Answer updated!' : 'Answer submitted!');
    } catch (err) {
      setAnswerForm(qIdx, { submitting: false, error: err.message });
    }
  };

  const handleAnswerEditStart = (qIdx, aIdx) => {
    const ans = faqs[qIdx]?.answers?.[aIdx];
    setAnswerForm(qIdx, { show: true, body: ans?.body || '', name: ans?.authorName || defaultName, editingAIdx: aIdx, error: '' });
  };

  const handleAnswerHelpful = async (qIdx, aIdx) => {
    if (!user) {
      toast(
        (t) => (
          <span className="flex items-center gap-2">
            Please login to vote.
            <button onClick={() => { toast.dismiss(t.id); setShowAuthModal(true); }} className="font-semibold text-pink-600 underline hover:text-pink-800">Login</button>
          </span>
        ),
        { icon: '🔒' }
      );
      return;
    }
    setAnswerHelpfulLoading(`${qIdx}-${aIdx}`);
    try {
      const res = await fetch(`${API}/api/products/${product._id}/questions/${qIdx}/answers/${aIdx}/helpful`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setFaqs(data.faqs || []);
    } catch (err) {
      toast.error(err.message || 'Failed to vote');
    } finally {
      setAnswerHelpfulLoading(null);
    }
  };

  return (
    <section className="w-full bg-white mt-10 mb-6 rounded-2xl">
      <div className="max-w-7xl mx-auto px-2 lg:px-8 ">
        {/* Header */}
        <div className="flex gap-4 overflow-x-auto whitespace-nowrap border-b border-gray-200 mb-3 md:grid md:grid-cols-5 md:gap-x-4 md:overflow-visible">
          <button
            onClick={() => setActiveTab("description")}
            className={`px-1 md:px-6 py-3 text-sm md:text-lg font-semibold transition-all duration-200 ${
              activeTab === "description"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Description
          </button>

          <button
            onClick={() => setActiveTab("specification")}
            className={`px-1 md:px-6 py-3 text-sm md:text-lg font-semibold transition-all duration-200 ${
              activeTab === "specification"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Specification
          </button>

          <button
            onClick={() => setActiveTab("guides")}
            className={`px-1 md:px-6 py-3 text-sm md:text-lg font-semibold transition-all duration-200 ${
              activeTab === "guides"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Guides
          </button>


          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-1 md:px-6 py-3 text-sm md:text-lg font-semibold transition-all duration-200 ${
              activeTab === "reviews"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Reviews
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`px-1 md:px-6 py-3 text-sm md:text-lg font-semibold transition-all duration-200 ${
              activeTab === "questions"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Questions
          </button>
        </div>

        {/* Content */}
        <div className="bg-white p-2 mb-4">
          {activeTab === "description" && (
            <div className="animate-fadeIn">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product?.description ||
                  "No description available for this product."}
              </p>
              {product?.detailedDescription ? (
                <div
                  className="mt-4 prose prose-sm max-w-none text-gray-700
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2
                    [&_strong]:font-semibold [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: product.detailedDescription }}
                />
              ) : null}
            </div>
          )}

          {activeTab === "specification" && (
            <div className="animate-fadeIn space-y-6">

              {/* Rich-text specifications (admin free-form) */}
              {product?.specifications && (
                <div
                  className="prose prose-sm max-w-none text-gray-700
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2
                    [&_strong]:font-semibold [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: product.specifications }}
                />
              )}

              {/* Key Attributes – grouped by level */}
              {product?.keyAttributes?.length > 0 && (
                <div className="space-y-4">
                  {product.keyAttributes.map((group, gi) => (
                    <div key={gi}>
                      {group.level && (
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {group.level}
                        </h3>
                      )}
                      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <tbody>
                          {(group.attributes || []).map((attr, ai) => (
                            <tr key={ai} className={`border-b border-gray-100 ${ai % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                              <td className="px-4 py-2 font-medium text-gray-700 w-2/5">{attr.key}</td>
                              <td className="px-4 py-2 text-gray-600">{attr.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Specs object (category-specific flat key-values) */}
              {product?.specs && Object.keys(product.specs).filter(k => k !== 'sizes').length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">General Specs</h3>
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <tbody>
                      {Object.entries(product.specs)
                        .filter(([k]) => k !== 'sizes')
                        .map(([key, val], i) => (
                          <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                            <td className="px-4 py-2 font-medium text-gray-700 w-2/5 capitalize">{key.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2 text-gray-600">{Array.isArray(val) ? val.join(', ') : String(val)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Variants */}
              {product?.variants?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Variants</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Variant</th>
                          {product.variants.some(v => v.sku) && <th className="px-4 py-2 text-left font-medium">SKU</th>}
                          <th className="px-4 py-2 text-left font-medium">Price</th>
                          <th className="px-4 py-2 text-left font-medium">Stock</th>
                          {product.variants.some(v => v.attributes && Object.keys(v.attributes).length > 0) && (
                            <th className="px-4 py-2 text-left font-medium">Attributes</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((v, i) => (
                          <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                            <td className="px-4 py-2 text-gray-800">{v.title || `Variant ${i + 1}`}</td>
                            {product.variants.some(x => x.sku) && <td className="px-4 py-2 text-gray-500">{v.sku || '—'}</td>}
                            <td className="px-4 py-2 text-gray-800">
                              {v.compareAtPrice && v.compareAtPrice > v.price ? (
                                <span>
                                  <span className="line-through text-gray-400 mr-1">${v.compareAtPrice}</span>
                                  <span className="text-green-600 font-medium">${v.price}</span>
                                </span>
                              ) : (
                                <span>${v.price}</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.inventory > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {v.inventory > 0 ? `${v.inventory} in stock` : 'Out of stock'}
                              </span>
                            </td>
                            {product.variants.some(x => x.attributes && Object.keys(x.attributes).length > 0) && (
                              <td className="px-4 py-2 text-gray-600">
                                {v.attributes && Object.entries(v.attributes).map(([k, val]) => (
                                  <span key={k} className="mr-2 capitalize"><span className="font-medium">{k}:</span> {val}</span>
                                ))}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Fallback */}
              {!product?.specifications && !product?.keyAttributes?.length && !product?.variants?.length &&
                !(product?.specs && Object.keys(product.specs).filter(k => k !== 'sizes').length > 0) && (
                <p className="text-gray-500">No specifications found.</p>
              )}
            </div>
          )}

          {activeTab === "guides" && (
            <div className="animate-fadeIn">
              {product?.guidelines ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2
                    [&_strong]:font-semibold [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: product.guidelines }}
                />
              ) : (
                <p className="text-gray-700">No guides available.</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="animate-fadeIn">

              {/* Top bar: count + Add button (always visible) */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => {
                    if (!user) {
                      toast(
                        (t) => (
                          <span className="flex items-center gap-2">
                            Please login first to give a review.{' '}
                            <button
                              onClick={() => { toast.dismiss(t.id); setShowAuthModal(true); }}
                              className="font-semibold text-pink-600 underline hover:text-pink-800"
                            >
                              Login
                            </button>
                          </span>
                        ),
                        { icon: '🔒' }
                      );
                      return;
                    }
                    setEditingIndex(null);
                    setReviewForm({ name: defaultName, rating: 0, body: '' });
                    setReviewError('');
                    setReviewDone(false);
                    setShowReviewForm(v => !v);
                  }}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  {showReviewForm ? 'Cancel' : 'Add Your Precious Review'}
                </button>
              </div>

              {/* Collapsible form at top */}
              {showReviewForm && (
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">
                    {editingIndex !== null ? '✏️ Edit Your Review' : '⭐ Write a Review'}
                  </h3>
                  {reviewDone ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3">
                      ✓ {editingIndex !== null ? 'Review updated!' : 'Thank you! Your review has been submitted.'}
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-2xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                          <input
                            type="text"
                            value={reviewForm.name}
                            onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                            className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder={defaultName || 'Your Name'}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating <span className="text-red-500">*</span></label>
                        <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comment <span className="text-red-500">*</span></label>
                        <textarea
                          value={reviewForm.body}
                          onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          rows={4}
                          placeholder="Share details of your experience with this product"
                        />
                      </div>
                      {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="bg-pink-600 text-white py-2 px-6 rounded-md hover:bg-pink-700 transition disabled:opacity-60"
                        >
                          {reviewSubmitting ? 'Saving…' : editingIndex !== null ? 'Update Review' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowReviewForm(false); setEditingIndex(null); }}
                          className="py-2 px-4 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Existing reviews */}
              {reviews.length > 0 ? (
                <ul className="space-y-4">
                  {reviews.map((r, i) => (
                    <li key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.455a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.455a1 1 0 00-1.175 0l-3.37 2.455c-.783.57-1.838-.197-1.538-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.013 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                            </svg>
                          ))}
                          <span className="font-semibold text-gray-800">{r.authorName || r.user || 'Anonymous'}</span>
                          {r.createdAt && <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>}
                        </div>
                        {/* Edit only for own review — no Delete (admin-only) */}
                        <div className="flex gap-2 flex-shrink-0">
                          {user && r.user?.toString() === user._id?.toString() && (
                            <button
                              onClick={() => handleReviewEdit(i)}
                              className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-2 py-0.5 transition"
                            >Edit</button>
                          )}
                        </div>
                      </div>
                      {r.title && <p className="font-medium text-gray-700 mb-0.5">{r.title}</p>}
                      <p className="text-gray-600">{r.body || r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div className="animate-fadeIn">

              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  {faqs.length} question{faqs.length !== 1 ? 's' : ''}
                  {faqs.filter(f => (f.answers?.length || 0) > 0).length > 0 &&
                    <span className="ml-1 text-green-600">· {faqs.filter(f => (f.answers?.length || 0) > 0).length} answered</span>}
                </p>
                <button
                  onClick={() => {
                    if (!user) {
                      toast(
                        (t) => (
                          <span className="flex items-center gap-2">
                            Please login first to ask a question.{' '}
                            <button onClick={() => { toast.dismiss(t.id); setShowAuthModal(true); }} className="font-semibold text-pink-600 underline hover:text-pink-800">Login</button>
                          </span>
                        ),
                        { icon: '🔒' }
                      );
                      return;
                    }
                    setEditingQIndex(null);
                    setQuestionForm({ name: defaultName, question: '' });
                    setQuestionError('');
                    setShowQuestionForm(v => !v);
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  {showQuestionForm && editingQIndex === null ? 'Cancel' : 'Ask a Question'}
                </button>
              </div>

              {/* Ask / edit question form */}
              {showQuestionForm && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">
                    {editingQIndex !== null ? '✏️ Edit Your Question' : '❓ Ask a Question'}
                  </h3>
                  <form onSubmit={handleQuestionSubmit} className="space-y-4 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                      <input type="text" value={questionForm.name} onChange={e => setQuestionForm(f => ({ ...f, name: e.target.value }))} className="block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder={defaultName || 'Your Name'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Question <span className="text-red-500">*</span></label>
                      <textarea value={questionForm.question} onChange={e => setQuestionForm(f => ({ ...f, question: e.target.value }))} className="block w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500" rows={4} placeholder="What would you like to know about this product?" />
                    </div>
                    {questionError && <p className="text-red-500 text-sm">{questionError}</p>}
                    <div className="flex gap-3">
                      <button type="submit" disabled={questionSubmitting} className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition disabled:opacity-60">
                        {questionSubmitting ? 'Saving…' : editingQIndex !== null ? 'Update Question' : 'Submit Question'}
                      </button>
                      <button type="button" onClick={() => { setShowQuestionForm(false); setEditingQIndex(null); }} className="py-2 px-4 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Questions list */}
              {faqs.length === 0 ? (
                <p className="text-gray-500 py-6 text-center">No questions yet. Be the first to ask!</p>
              ) : (
                <ul className="space-y-5">
                  {[...faqs]
                    .map((f, i) => ({ ...f, _origIndex: i }))
                    .sort((a, b) => {
                      const aHas = (a.answers?.length || 0) > 0;
                      const bHas = (b.answers?.length || 0) > 0;
                      if (aHas !== bHas) return aHas ? -1 : 1;
                      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    })
                    .map((faq) => {
                      const idx = faq._origIndex;
                      const isOwnQuestion = user && faq.user?.toString() === user._id?.toString();
                      const answers = faq.answers || [];
                      const officialAnswer = answers.find(a => a.isOfficial);
                      const communityAnswers = answers.filter(a => !a.isOfficial).sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
                      const aForm = answerForms[idx] || {};

                      return (
                        <li key={idx} className="border border-gray-200 rounded-xl overflow-hidden">

                          {/* Question row */}
                          <div className="flex items-start gap-3 p-4 bg-gray-50">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs mt-0.5">Q</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 font-medium leading-snug">{faq.question}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
                                <span>{faq.askerName || 'Anonymous'}</span>
                                {faq.createdAt && <span>· {new Date(faq.createdAt).toLocaleDateString()}</span>}
                                {answers.length === 0 && <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 font-medium">Awaiting answer</span>}
                                {answers.length > 0 && <span className="text-green-600 font-medium">{answers.length} answer{answers.length !== 1 ? 's' : ''}</span>}
                              </div>
                            </div>
                            {isOwnQuestion && (
                              <button onClick={() => handleQuestionEdit(idx)} className="flex-shrink-0 text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-2 py-0.5 transition">Edit</button>
                            )}
                          </div>

                          {/* Official seller answer */}
                          {officialAnswer && (() => {
                            const oIdx = answers.indexOf(officialAnswer);
                            const hasVotedO = user && (officialAnswer.helpfulBy || []).map(String).includes(user._id?.toString());
                            return (
                              <div className="flex items-start gap-3 p-4 border-t border-green-100 bg-green-50/40">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs mt-0.5">A</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded">Seller Answer</span>
                                    <span className="text-xs text-gray-500">{officialAnswer.authorName || 'Seller'}</span>
                                    {officialAnswer.createdAt && <span className="text-xs text-gray-400">· {new Date(officialAnswer.createdAt).toLocaleDateString()}</span>}
                                  </div>
                                  <p className="text-gray-800 leading-snug text-sm">{officialAnswer.body}</p>
                                  <button
                                    onClick={() => handleAnswerHelpful(idx, oIdx)}
                                    disabled={answerHelpfulLoading === `${idx}-${oIdx}`}
                                    className={`mt-2 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition ${hasVotedO ? 'bg-green-50 border-green-300 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700'}`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill={hasVotedO ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.924L14 3v7z" /></svg>
                                    Helpful{officialAnswer.helpful > 0 && <span className="font-semibold ml-0.5">({officialAnswer.helpful})</span>}
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Community answers */}
                          {communityAnswers.length > 0 && (
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                              {communityAnswers.map((ans) => {
                                const aIdx = answers.indexOf(ans);
                                const isOwnAns = user && ans.user?.toString() === user._id?.toString();
                                const hasVotedA = user && (ans.helpfulBy || []).map(String).includes(user._id?.toString());
                                return (
                                  <div key={aIdx} className="flex items-start gap-3 p-4 bg-white">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mt-0.5">A</div>
                                    <div className="flex-1 min-w-0">
                                      {aForm.show && aForm.editingAIdx === aIdx ? (
                                        <form onSubmit={e => handleAnswerSubmit(e, idx)} className="space-y-2">
                                          <textarea value={aForm.body || ''} onChange={e => setAnswerForm(idx, { body: e.target.value })} rows={3} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                          {aForm.error && <p className="text-red-500 text-xs">{aForm.error}</p>}
                                          <div className="flex gap-2">
                                            <button type="submit" disabled={aForm.submitting} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-medium">{aForm.submitting ? 'Saving…' : 'Update'}</button>
                                            <button type="button" onClick={() => setAnswerForm(idx, { show: false, editingAIdx: null })} className="text-xs px-3 py-1.5 rounded border text-gray-600">Cancel</button>
                                          </div>
                                        </form>
                                      ) : (
                                        <>
                                          <p className="text-gray-700 text-sm leading-snug">{ans.body}</p>
                                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className="text-xs text-gray-400">{ans.authorName || 'Anonymous'}{ans.createdAt && <> · {new Date(ans.createdAt).toLocaleDateString()}</>}</span>
                                            <button
                                              onClick={() => handleAnswerHelpful(idx, aIdx)}
                                              disabled={answerHelpfulLoading === `${idx}-${aIdx}`}
                                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition ${hasVotedA ? 'bg-green-50 border-green-300 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700'}`}
                                            >
                                              <svg className="w-3.5 h-3.5" fill={hasVotedA ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.924L14 3v7z" /></svg>
                                              Helpful{ans.helpful > 0 && <span className="font-semibold ml-0.5">({ans.helpful})</span>}
                                            </button>
                                            {isOwnAns && (
                                              <button onClick={() => handleAnswerEditStart(idx, aIdx)} className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-2 py-0.5 transition">Edit</button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Write an answer */}
                          <div className="border-t border-gray-100 bg-gray-50/60">
                            {!aForm.show || (aForm.editingAIdx !== null && aForm.editingAIdx !== undefined) ? (
                              <button
                                onClick={() => {
                                  if (!user) {
                                    toast(
                                      (t) => (
                                        <span className="flex items-center gap-2">
                                          Please login to answer.
                                          <button onClick={() => { toast.dismiss(t.id); setShowAuthModal(true); }} className="font-semibold text-pink-600 underline hover:text-pink-800">Login</button>
                                        </span>
                                      ),
                                      { icon: '🔒' }
                                    );
                                    return;
                                  }
                                  setAnswerForm(idx, { show: true, body: '', name: defaultName, editingAIdx: null, error: '' });
                                }}
                                className="w-full text-center text-xs text-green-700 font-semibold py-2.5 hover:bg-green-50 transition"
                              >
                                + Write an Answer
                              </button>
                            ) : aForm.editingAIdx === null ? (
                              <div className="p-4">
                                <p className="text-xs font-medium text-gray-600 mb-2">Your Answer</p>
                                <form onSubmit={e => handleAnswerSubmit(e, idx)} className="space-y-2">
                                  <textarea value={aForm.body || ''} onChange={e => setAnswerForm(idx, { body: e.target.value })} rows={3} placeholder="Share your experience or knowledge…" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                                  {aForm.error && <p className="text-red-500 text-xs">{aForm.error}</p>}
                                  <div className="flex gap-2">
                                    <button type="submit" disabled={aForm.submitting} className="text-xs px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 font-medium transition">{aForm.submitting ? 'Submitting…' : 'Submit Answer'}</button>
                                    <button type="button" onClick={() => setAnswerForm(idx, { show: false })} className="text-xs px-3 py-1.5 rounded border text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                                  </div>
                                </form>
                              </div>
                            ) : null}
                          </div>

                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
}
