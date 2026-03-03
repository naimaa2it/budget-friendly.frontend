"use client";
import { useState } from "react";

export default function ProductInfoTabs({ product }) {
  const [activeTab, setActiveTab] = useState("description");
  // tabs: description, specification, guides, reviews, questions

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
              {product?.reviews && product.reviews.length > 0 ? (
                <ul className="space-y-4">
                  {product.reviews.map((r, i) => (
                    <li key={i} className="border p-3 rounded">
                      <p className="font-medium">{r.user || 'User'}</p>
                      <p className="text-gray-700">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">No reviews yet.</p>
              )}

              {/* review submission form */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Write a review</h3>
                <form className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Your Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map((_, idx)=> (
                        <svg key={idx} className="w-6 h-6 text-gray-300 hover:text-green-500 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.455a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.455a1 1 0 00-1.175 0l-3.37 2.455c-.783.57-1.838-.197-1.538-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.013 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comment</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={4}
                      placeholder="Share details of your own experience about this product"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 transition"
                  >
                    Submit review
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="animate-fadeIn max-w-6xl bg-gray-50">
              <form className="space-y-6 max-w-xl mx-auto bg-gray-50 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ask a Question</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={5}
                    placeholder="Enter Your Message"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
