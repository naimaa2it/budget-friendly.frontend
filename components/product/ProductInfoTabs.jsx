"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/components/context/UserContext";
import toast from "react-hot-toast";
import AuthModal from "@/components/auth/AuthModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
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
              star <= (hovered || value) ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
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

  // listen for external open-review requests
  useEffect(() => {
    const handler = () => {
      setActiveTab("reviews");
      const el = document.getElementById("reviews-tab");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("openReviews", handler);
    return () => window.removeEventListener("openReviews", handler);
  }, []);

  // listen for external open-questions (Q&A) requests
  useEffect(() => {
    const handler = () => {
      setActiveTab("questions");
      const el = document.getElementById("reviews-tab");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("openQuestions", handler);
    return () => window.removeEventListener("openQuestions", handler);
  }, []);

  // default display name from logged-in user
  const defaultName = user ? user.name || user.email?.split("@")[0] || "" : "";

  // Reviews state
  const [reviews, setReviews] = useState(product?.reviews || []);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: 0,
    body: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  // Questions / Q&A state
  const [faqs, setFaqs] = useState(product?.faqs || []);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ name: "", question: "" });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [editingQIndex, setEditingQIndex] = useState(null);
  // per-question inline answer forms: { [qIdx]: { show, name, body, submitting, error, editingAIdx } }
  const [answerForms, setAnswerForms] = useState({});
  const [answerHelpfulLoading, setAnswerHelpfulLoading] = useState(null); // `${qIdx}-${aIdx}`

  const setAnswerForm = (qIdx, patch) =>
    setAnswerForms((prev) => ({
      ...prev,
      [qIdx]: { ...prev[qIdx], ...patch },
    }));

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (!reviewForm.rating)
      return setReviewError("Please select a star rating.");
    if (!reviewForm.body.trim())
      return setReviewError("Please write a comment.");
    setReviewSubmitting(true);
    try {
      const isEdit = editingIndex !== null;
      const url = isEdit
        ? `${API}/api/products/${product._id}/reviews/${editingIndex}`
        : `${API}/api/products/${product._id}/reviews`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          authorName: reviewForm.name || defaultName,
          rating: reviewForm.rating,
          body: reviewForm.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setReviews(data.reviews || []);
      setReviewForm({ name: "", rating: 0, body: "" });
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
    setReviewForm({
      name: r.authorName || defaultName,
      rating: r.rating || 0,
      body: r.body || "",
    });
    setEditingIndex(idx);
    setReviewDone(false);
    setReviewError("");
    setShowReviewForm(true);
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setQuestionError("");
    if (!questionForm.question.trim())
      return setQuestionError("Please enter your question.");
    setQuestionSubmitting(true);
    try {
      const isEdit = editingQIndex !== null;
      const url = isEdit
        ? `${API}/api/products/${product._id}/questions/${editingQIndex}`
        : `${API}/api/products/${product._id}/questions`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: questionForm.question,
          askerName: questionForm.name || defaultName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setFaqs(data.faqs || []);
      setQuestionForm({ name: "", question: "" });
      setEditingQIndex(null);
      setShowQuestionForm(false);
      toast.success(
        isEdit ? "Question updated!" : "Your question has been submitted!",
      );
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
    setQuestionError("");
    setShowQuestionForm(true);
    setActiveTab("questions");
  };

  const handleAnswerSubmit = async (e, qIdx) => {
    e.preventDefault();
    const form = answerForms[qIdx] || {};
    if (!form.body?.trim()) {
      setAnswerForm(qIdx, { error: "Please write an answer." });
      return;
    }
    setAnswerForm(qIdx, { submitting: true, error: "" });
    try {
      const isEdit =
        form.editingAIdx !== undefined && form.editingAIdx !== null;
      const url = isEdit
        ? `${API}/api/products/${product._id}/questions/${qIdx}/answers/${form.editingAIdx}`
        : `${API}/api/products/${product._id}/questions/${qIdx}/answers`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          body: form.body,
          authorName: form.name || defaultName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setFaqs(data.faqs || []);
      setAnswerForm(qIdx, {
        show: false,
        body: "",
        name: "",
        submitting: false,
        editingAIdx: null,
      });
      toast.success(isEdit ? "Answer updated!" : "Answer submitted!");
    } catch (err) {
      setAnswerForm(qIdx, { submitting: false, error: err.message });
    }
  };

  const handleAnswerEditStart = (qIdx, aIdx) => {
    const ans = faqs[qIdx]?.answers?.[aIdx];
    setAnswerForm(qIdx, {
      show: true,
      body: ans?.body || "",
      name: ans?.authorName || defaultName,
      editingAIdx: aIdx,
      error: "",
    });
  };

  const handleAnswerHelpful = async (qIdx, aIdx) => {
    if (!user) {
      toast(
        (t) => (
          <span className="flex items-center gap-2">
            Please login to vote.
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setShowAuthModal(true);
              }}
              className="font-semibold text-pink-600 underline hover:text-pink-800"
            >
              Login
            </button>
          </span>
        ),
        { icon: "🔒" },
      );
      return;
    }
    setAnswerHelpfulLoading(`${qIdx}-${aIdx}`);
    try {
      const res = await fetch(
        `${API}/api/products/${product._id}/questions/${qIdx}/answers/${aIdx}/helpful`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFaqs(data.faqs || []);
    } catch (err) {
      toast.error(err.message || "Failed to vote");
    } finally {
      setAnswerHelpfulLoading(null);
    }
  };

  return (
    <section className="w-full bg-white mt-10 mb-6">
      <div className="max-w-7xl mx-auto px-2 lg:px-8">
        {/* ── Tab bar ── */}
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap border-b border-gray-200 mb-6">
          {[
            { key: "description", label: "Description" },
            { key: "specification", label: "Specification" },
            { key: "reviews", label: "Reviews", count: reviews.length },
            { key: "questions", label: "Q&A", count: faqs.length },
            { key: "guides", label: "Care & Guides" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
                activeTab === t.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    activeTab === t.key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="pb-8">
          {activeTab === "description" && (
            <div className="animate-fadeIn">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {(() => {
                  const d = product?.description;
                  if (!d) return "No description available for this product.";
                  if (typeof d === 'string') return d;
                  if (Array.isArray(d))
                    return d.map(b => typeof b === 'string' ? b : (b?.content || b?.text || '').replace(/<[^>]+>/g, '')).filter(Boolean).join(' ') || "No description available for this product.";
                  return "No description available for this product.";
                })()}
              </p>
              {typeof product?.detailedDescription === 'string' && product.detailedDescription ? (
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
              {/* Specifications – flat key-value pairs with optional group headers */}
              {Array.isArray(product?.specifications) &&
                product.specifications.filter((s) => s.type === "header" ? s.label : (s.key || s.value)).length > 0 && (
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <tbody>
                      {(() => {
                        let rowIndex = 0;
                        return product.specifications
                          .filter((s) => s.type === "header" ? s.label : (s.key || s.value))
                          .map((spec, i) => {
                            if (spec.type === "header") {
                              return (
                                <tr key={i}>
                                  <td
                                    colSpan={2}
                                    className="px-4 py-3 font-bold text-indigo-700 bg-indigo-50 border-b border-indigo-100 text-sm tracking-wide"
                                  >
                                    {spec.label}
                                  </td>
                                </tr>
                              );
                            }
                            const stripe = rowIndex++ % 2 === 0;
                            return (
                              <tr
                                key={i}
                                className={`border-b border-gray-100 ${stripe ? "bg-white" : "bg-gray-50"}`}
                              >
                                <td className="px-4 py-2.5 font-medium text-gray-600 w-2/5">
                                  {typeof spec.key === "object" ? JSON.stringify(spec.key) : String(spec.key ?? "")}
                                </td>
                                <td className="px-4 py-2.5 text-gray-800">
                                  {typeof spec.value === "object" ? JSON.stringify(spec.value) : String(spec.value ?? "")}
                                </td>
                              </tr>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                )}

              {/* Variants */}
              {product?.variants?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Variants
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">
                            Variant
                          </th>
                          {product.variants.some((v) => v.sku) && (
                            <th className="px-4 py-2 text-left font-medium">
                              SKU
                            </th>
                          )}
                          <th className="px-4 py-2 text-left font-medium">
                            Price
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Stock
                          </th>
                          {product.variants.some(
                            (v) =>
                              v.attributes &&
                              Object.values(v.attributes).some(val => val !== null && val !== undefined && typeof val !== "object"),
                          ) && (
                            <th className="px-4 py-2 text-left font-medium">
                              Attributes
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((v, i) => (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                          >
                            <td className="px-4 py-2 text-gray-800">
                              {v.title || `Variant ${i + 1}`}
                            </td>
                            {product.variants.some((x) => x.sku) && (
                              <td className="px-4 py-2 text-gray-500">
                                {v.sku || "—"}
                              </td>
                            )}
                            <td className="px-4 py-2 text-gray-800">
                              {v.compareAtPrice &&
                              v.compareAtPrice > v.price ? (
                                <span>
                                  <span className="line-through text-gray-400 mr-1">
                                    ${v.compareAtPrice}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    ${v.price}
                                  </span>
                                </span>
                              ) : (
                                <span>${v.price}</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.inventory > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                              >
                                {v.inventory > 0
                                  ? `${v.inventory} in stock`
                                  : "Out of stock"}
                              </span>
                            </td>
                            {product.variants.some(
                              (x) =>
                                x.attributes &&
                                Object.values(x.attributes).some(val => val !== null && val !== undefined && typeof val !== "object"),
                            ) && (
                              <td className="px-4 py-2 text-gray-600">
                                {v.attributes &&
                                  Object.entries(v.attributes)
                                    .filter(([, val]) => val !== null && val !== undefined && typeof val !== "object")
                                    .map(([k, val]) => (
                                      <span key={k} className="mr-2 capitalize">
                                        <span className="font-medium">{k}:</span>{" "}
                                        {String(val)}
                                      </span>
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
              {!(
                Array.isArray(product?.specifications) &&
                product.specifications.filter((s) => s.type === "header" ? s.label : (s.key || s.value)).length > 0
              ) &&
                !product?.variants?.length && (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm font-medium text-gray-600">
                      No specifications found, you can see the description or
                      contact us for more details.
                    </p>
                  </div>
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
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-2xl mb-2">🫶</p>
                  <p className="text-sm font-medium text-gray-600">
                    No care instructions or guides are available for this
                    product.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="animate-fadeIn">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Customer Reviews
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      toast(
                        (t) => (
                          <span className="flex items-center gap-2">
                            Please login first to give a review.{" "}
                            <button
                              onClick={() => {
                                toast.dismiss(t.id);
                                setShowAuthModal(true);
                              }}
                              className="font-semibold text-pink-600 underline hover:text-pink-800"
                            >
                              Login
                            </button>
                          </span>
                        ),
                        { icon: "🔒" },
                      );
                      return;
                    }
                    setEditingIndex(null);
                    setReviewForm({ name: defaultName, rating: 0, body: "" });
                    setReviewError("");
                    setReviewDone(false);
                    setShowReviewForm((v) => !v);
                  }}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {showReviewForm ? "Cancel" : "Write a Review"}
                </button>
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">
                    {editingIndex !== null
                      ? "✏️ Edit Your Review"
                      : "⭐ Write a Review"}
                  </h3>
                  {reviewDone ? (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {editingIndex !== null
                        ? "Review updated!"
                        : "Thank you! Your review has been submitted."}
                    </div>
                  ) : (
                    <form
                      onSubmit={handleReviewSubmit}
                      className="space-y-4 max-w-2xl"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={reviewForm.name}
                          onChange={(e) =>
                            setReviewForm((f) => ({
                              ...f,
                              name: e.target.value,
                            }))
                          }
                          className="block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                          placeholder={defaultName || "Your Name"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                          Rating <span className="text-red-400">*</span>
                        </label>
                        <StarRating
                          value={reviewForm.rating}
                          onChange={(r) =>
                            setReviewForm((f) => ({ ...f, rating: r }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                          Comment <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={reviewForm.body}
                          onChange={(e) =>
                            setReviewForm((f) => ({
                              ...f,
                              body: e.target.value,
                            }))
                          }
                          className="block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                          rows={4}
                          placeholder="Share your experience with this product…"
                        />
                      </div>
                      {reviewError && (
                        <p className="text-red-500 text-xs">{reviewError}</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="bg-gray-900 text-white text-sm py-2 px-6 rounded-lg hover:bg-gray-700 transition disabled:opacity-60"
                        >
                          {reviewSubmitting
                            ? "Saving…"
                            : editingIndex !== null
                              ? "Update Review"
                              : "Submit Review"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReviewForm(false);
                            setEditingIndex(null);
                          }}
                          className="text-sm py-2 px-4 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Review list */}
              {reviews.length > 0 ? (
                <ul className="space-y-3">
                  {reviews.map((r, i) => {
                    const initials = (r.authorName || r.user || "A")
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <li
                        key={i}
                        className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900">
                                {r.authorName || r.user || "Anonymous"}
                              </span>
                              {r.createdAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(r.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                              )}
                            </div>
                            {user &&
                              r.user?.toString() === user._id?.toString() && (
                                <button
                                  onClick={() => handleReviewEdit(i)}
                                  className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md px-2.5 py-0.5 transition flex-shrink-0"
                                >
                                  Edit
                                </button>
                              )}
                          </div>
                          {/* Stars */}
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-400" : "text-gray-200"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.455a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.455a1 1 0 00-1.175 0l-3.37 2.455c-.783.57-1.838-.197-1.538-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.013 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                              </svg>
                            ))}
                          </div>
                          {r.title && (
                            <p className="font-semibold text-sm text-gray-800 mb-0.5">
                              {r.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {r.body || r.comment}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-2xl mb-2">✍️</p>
                  <p className="text-sm font-medium text-gray-600">
                    No reviews yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Be the first to share your experience!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div className="animate-fadeIn">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Questions &amp; Answers
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {faqs.length} question{faqs.length !== 1 ? "s" : ""}
                    {faqs.filter((f) => (f.answers?.length || 0) > 0).length >
                      0 && (
                      <span className="ml-1 text-green-600">
                        ·{" "}
                        {
                          faqs.filter((f) => (f.answers?.length || 0) > 0)
                            .length
                        }{" "}
                        answered
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      toast(
                        (t) => (
                          <span className="flex items-center gap-2">
                            Please login first to ask a question.{" "}
                            <button
                              onClick={() => {
                                toast.dismiss(t.id);
                                setShowAuthModal(true);
                              }}
                              className="font-semibold text-pink-600 underline hover:text-pink-800"
                            >
                              Login
                            </button>
                          </span>
                        ),
                        { icon: "🔒" },
                      );
                      return;
                    }
                    setEditingQIndex(null);
                    setQuestionForm({ name: defaultName, question: "" });
                    setQuestionError("");
                    setShowQuestionForm((v) => !v);
                  }}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {showQuestionForm && editingQIndex === null
                    ? "Cancel"
                    : "Ask a Question"}
                </button>
              </div>

              {/* Ask / edit question form */}
              {showQuestionForm && (
                <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">
                    {editingQIndex !== null
                      ? "✏️ Edit Your Question"
                      : "❓ Ask a Question"}
                  </h3>
                  <form
                    onSubmit={handleQuestionSubmit}
                    className="space-y-4 max-w-2xl"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={questionForm.name}
                        onChange={(e) =>
                          setQuestionForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                        className="block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                        placeholder={defaultName || "Your Name"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Your Question <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm((f) => ({
                            ...f,
                            question: e.target.value,
                          }))
                        }
                        className="block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                        rows={4}
                        placeholder="What would you like to know about this product?"
                      />
                    </div>
                    {questionError && (
                      <p className="text-red-500 text-xs">{questionError}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={questionSubmitting}
                        className="bg-gray-900 text-white text-sm py-2 px-6 rounded-lg hover:bg-gray-700 transition disabled:opacity-60"
                      >
                        {questionSubmitting
                          ? "Saving…"
                          : editingQIndex !== null
                            ? "Update Question"
                            : "Submit Question"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuestionForm(false);
                          setEditingQIndex(null);
                        }}
                        className="text-sm py-2 px-4 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Questions list */}
              {faqs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-2xl mb-2">💬</p>
                  <p className="text-sm font-medium text-gray-600">
                    No questions yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Be the first to ask a question!
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {[...faqs]
                    .map((f, i) => ({ ...f, _origIndex: i }))
                    .sort((a, b) => {
                      const aHas = (a.answers?.length || 0) > 0;
                      const bHas = (b.answers?.length || 0) > 0;
                      if (aHas !== bHas) return aHas ? -1 : 1;
                      return (
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                      );
                    })
                    .map((faq) => {
                      const idx = faq._origIndex;
                      const isOwnQuestion =
                        user && faq.user?.toString() === user._id?.toString();
                      const answers = faq.answers || [];
                      const officialAnswer = answers.find((a) => a.isOfficial);
                      const communityAnswers = answers
                        .filter((a) => !a.isOfficial)
                        .sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
                      const aForm = answerForms[idx] || {};

                      return (
                        <li
                          key={idx}
                          className="border border-gray-100 rounded-xl overflow-hidden"
                        >
                          {/* Question */}
                          <div className="flex items-start gap-3 p-4 border-l-4 border-gray-900 bg-white">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xs mt-0.5">
                              Q
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-semibold text-sm leading-snug">
                                {faq.question}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400">
                                <span className="font-medium text-gray-500">
                                  {faq.askerName || "Anonymous"}
                                </span>
                                {faq.createdAt && (
                                  <span>
                                    ·{" "}
                                    {new Date(faq.createdAt).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      },
                                    )}
                                  </span>
                                )}
                                {answers.length === 0 && (
                                  <span className="bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-medium text-[10px]">
                                    Awaiting answer
                                  </span>
                                )}
                                {answers.length > 0 && (
                                  <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium text-[10px]">
                                    {answers.length} answer
                                    {answers.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isOwnQuestion && (
                              <button
                                onClick={() => handleQuestionEdit(idx)}
                                className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md px-2.5 py-0.5 transition"
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {/* Official seller answer */}
                          {officialAnswer &&
                            (() => {
                              const oIdx = answers.indexOf(officialAnswer);
                              const hasVotedO =
                                user &&
                                (officialAnswer.helpfulBy || [])
                                  .map(String)
                                  .includes(user._id?.toString());
                              return (
                                <div className="flex items-start gap-3 p-4 border-l-4 border-green-500 bg-green-50/50">
                                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs mt-0.5">
                                    S
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Seller
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {officialAnswer.authorName || "Seller"}
                                      </span>
                                      {officialAnswer.createdAt && (
                                        <span className="text-xs text-gray-400">
                                          ·{" "}
                                          {new Date(
                                            officialAnswer.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-800 text-sm leading-relaxed">
                                      {officialAnswer.body}
                                    </p>
                                    <button
                                      onClick={() =>
                                        handleAnswerHelpful(idx, oIdx)
                                      }
                                      disabled={
                                        answerHelpfulLoading ===
                                        `${idx}-${oIdx}`
                                      }
                                      className={`mt-2 flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition ${
                                        hasVotedO
                                          ? "bg-green-100 border-green-300 text-green-700 font-semibold"
                                          : "border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700"
                                      }`}
                                    >
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill={
                                          hasVotedO ? "currentColor" : "none"
                                        }
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.924L14 3v7z"
                                        />
                                      </svg>
                                      Helpful
                                      {officialAnswer.helpful > 0 && (
                                        <span className="font-semibold">
                                          ({officialAnswer.helpful})
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                          {/* Community answers */}
                          {communityAnswers.length > 0 && (
                            <div className="divide-y divide-gray-100">
                              {communityAnswers.map((ans) => {
                                const aIdx = answers.indexOf(ans);
                                const isOwnAns =
                                  user &&
                                  ans.user?.toString() === user._id?.toString();
                                const hasVotedA =
                                  user &&
                                  (ans.helpfulBy || [])
                                    .map(String)
                                    .includes(user._id?.toString());
                                const initials = (ans.authorName || "A")
                                  .charAt(0)
                                  .toUpperCase();
                                return (
                                  <div
                                    key={aIdx}
                                    className="flex items-start gap-3 p-4 border-l-4 border-blue-300 bg-blue-50/30"
                                  >
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mt-0.5">
                                      {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {aForm.show &&
                                      aForm.editingAIdx === aIdx ? (
                                        <form
                                          onSubmit={(e) =>
                                            handleAnswerSubmit(e, idx)
                                          }
                                          className="space-y-2"
                                        >
                                          <textarea
                                            value={aForm.body || ""}
                                            onChange={(e) =>
                                              setAnswerForm(idx, {
                                                body: e.target.value,
                                              })
                                            }
                                            rows={3}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                          />
                                          {aForm.error && (
                                            <p className="text-red-500 text-xs">
                                              {aForm.error}
                                            </p>
                                          )}
                                          <div className="flex gap-2">
                                            <button
                                              type="submit"
                                              disabled={aForm.submitting}
                                              className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60 font-medium"
                                            >
                                              {aForm.submitting
                                                ? "Saving…"
                                                : "Update"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setAnswerForm(idx, {
                                                  show: false,
                                                  editingAIdx: null,
                                                })
                                              }
                                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </form>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-600">
                                              {ans.authorName || "Anonymous"}
                                              {ans.createdAt && (
                                                <span className="font-normal text-gray-400">
                                                  {" "}
                                                  ·{" "}
                                                  {new Date(
                                                    ans.createdAt,
                                                  ).toLocaleDateString()}
                                                </span>
                                              )}
                                            </span>
                                            {isOwnAns && (
                                              <button
                                                onClick={() =>
                                                  handleAnswerEditStart(
                                                    idx,
                                                    aIdx,
                                                  )
                                                }
                                                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md px-2.5 py-0.5 transition"
                                              >
                                                Edit
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-gray-700 text-sm leading-relaxed">
                                            {ans.body}
                                          </p>
                                          <button
                                            onClick={() =>
                                              handleAnswerHelpful(idx, aIdx)
                                            }
                                            disabled={
                                              answerHelpfulLoading ===
                                              `${idx}-${aIdx}`
                                            }
                                            className={`mt-1.5 flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition ${
                                              hasVotedA
                                                ? "bg-green-100 border-green-300 text-green-700 font-semibold"
                                                : "border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700"
                                            }`}
                                          >
                                            <svg
                                              className="w-3.5 h-3.5"
                                              fill={
                                                hasVotedA
                                                  ? "currentColor"
                                                  : "none"
                                              }
                                              stroke="currentColor"
                                              strokeWidth={2}
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.924L14 3v7z"
                                              />
                                            </svg>
                                            Helpful
                                            {ans.helpful > 0 && (
                                              <span className="font-semibold">
                                                ({ans.helpful})
                                              </span>
                                            )}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Write an answer */}
                          <div className="bg-gray-50 border-t border-gray-100">
                            {!aForm.show ||
                            (aForm.editingAIdx !== null &&
                              aForm.editingAIdx !== undefined) ? (
                              <button
                                onClick={() => {
                                  if (!user) {
                                    toast(
                                      (t) => (
                                        <span className="flex items-center gap-2">
                                          Please login to answer.
                                          <button
                                            onClick={() => {
                                              toast.dismiss(t.id);
                                              setShowAuthModal(true);
                                            }}
                                            className="font-semibold text-pink-600 underline hover:text-pink-800"
                                          >
                                            Login
                                          </button>
                                        </span>
                                      ),
                                      { icon: "🔒" },
                                    );
                                    return;
                                  }
                                  setAnswerForm(idx, {
                                    show: true,
                                    body: "",
                                    name: defaultName,
                                    editingAIdx: null,
                                    error: "",
                                  });
                                }}
                                className="w-full text-center text-xs text-gray-500 font-semibold py-2.5 hover:bg-gray-100 hover:text-gray-800 transition"
                              >
                                + Write an Answer
                              </button>
                            ) : aForm.editingAIdx === null ? (
                              <div className="p-4">
                                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                  Your Answer
                                </p>
                                <form
                                  onSubmit={(e) => handleAnswerSubmit(e, idx)}
                                  className="space-y-2"
                                >
                                  <textarea
                                    value={aForm.body || ""}
                                    onChange={(e) =>
                                      setAnswerForm(idx, {
                                        body: e.target.value,
                                      })
                                    }
                                    rows={3}
                                    placeholder="Share your experience or knowledge…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                                  />
                                  {aForm.error && (
                                    <p className="text-red-500 text-xs">
                                      {aForm.error}
                                    </p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      disabled={aForm.submitting}
                                      className="text-xs px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60 font-medium transition"
                                    >
                                      {aForm.submitting
                                        ? "Submitting…"
                                        : "Submit Answer"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAnswerForm(idx, { show: false })
                                      }
                                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                                    >
                                      Cancel
                                    </button>
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
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </section>
  );
}
