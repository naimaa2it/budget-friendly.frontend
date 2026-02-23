"use client";
import { useState } from "react";

export default function ProductInfoTabs({ product }) {
  const [activeTab, setActiveTab] = useState("description");

  return (
    <section className="w-full bg-white mt-10 mb-6 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        <div className="flex items-center justify-start border-b border-gray-200 mb-3">
          <button
            onClick={() => setActiveTab("description")}
            className={`px-6 py-3 text-lg font-semibold transition-all duration-200 ${
              activeTab === "description"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Description
          </button>

          <button
            onClick={() => setActiveTab("specification")}
            className={`px-6 py-3 text-lg font-semibold transition-all duration-200 ${
              activeTab === "specification"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            Specification
          </button>
        </div>

        {/* Content */}
        <div className="  bg-white p-2 mb-4">
          {activeTab === "description" && (
            <div className="animate-fadeIn">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product?.description ||
                  "No description available for this product."}
              </p>
            </div>
          )}

          {activeTab === "specification" && (
            <div className="animate-fadeIn">
              {product?.specifications?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <tbody>
                      {product.specifications.map((spec, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-200 ${
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          <td className="px-4 py-2 font-medium text-gray-800 w-1/3">
                            {spec.key}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-700">No specifications found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
