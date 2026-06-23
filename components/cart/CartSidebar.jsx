"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCart,
  getItemPrice,
  getItemCompareAtPrice,
} from "@/components/context/CartContext";
import QuantitySelector from "@/components/ui/QuantitySelector";
import {
  FaTimes,
  FaShoppingBag,
  FaTrash,
  FaPencilAlt,
  FaShareAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import EmptyAnimation from "@/components/ui/EmptyAnimation";
import VariantEditModal, {
  getVariantColors,
  getVariantSizes,
} from "@/components/cart/VariantEditModal";
import WaitlistModal from "@/components/cart/WaitlistModal";
import { useLanguage } from "@/components/context/LanguageContext";

export default function CartSidebar() {
  const router = useRouter();
  const {
    cartItems,
    isSidebarOpen,
    toggleSidebar,
    updateQty,
    removeFromCart,
    updateCartVariant,
    shareCart,
  } = useCart();

  const { t } = useLanguage();
  const [editItem, setEditItem] = useState(null);
  const [editMode, setEditMode] = useState("edit");
  const [waitlistProduct, setWaitlistProduct] = useState(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = await shareCart();
      if (navigator.share) {
        await navigator.share({ title: "My Pickob Cart", url });
      } else {
        await navigator.clipboard?.writeText(url);
        toast.success("Cart link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError")
        toast.error("Could not share cart. Try again.");
    } finally {
      setSharing(false);
    }
  };

  // lock body scroll when sidebar is open
  React.useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const total = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );
  const saved = cartItems.reduce((sum, item) => {
    const price = getItemPrice(item);
    const mrp = getItemCompareAtPrice(item);
    return sum + (mrp > price ? (mrp - price) * item.quantity : 0);
  }, 0);

  return (
    <>
      {/* backdrop to close when clicking outside */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={toggleSidebar}
        />
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-0 right-0 h-full w-full max-w-xs sm:w-80 md:w-96 bg-[#FFFCFC] shadow-lg transform transition-transform duration-300 z-50 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 bg-black text-white shrink-0">
          <div className="flex items-center gap-2">
            <FaShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              {t("cart.my_cart")} {cartItems.length} {t("cart.items_label")}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {cartItems.length > 0 && (
              <button
                onClick={handleShare}
                disabled={sharing}
                title="Share cart"
                className="p-1 hover:text-gray-300 disabled:opacity-50"
              >
                <FaShareAlt className="w-4 h-4" />
              </button>
            )}
            <button onClick={toggleSidebar} className="p-1">
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="p-4 grow overflow-y-auto">
          {cartItems.length === 0 && <EmptyAnimation />}

          {cartItems.map((item) => {
            const { product, quantity, cartKey, selectedColor, selectedSize } =
              item;
            const price = getItemPrice(item);
            const mrp = getItemCompareAtPrice(item);
            const itemSaved = mrp > price ? (mrp - price) * quantity : 0;
            const thumb = product.images?.[0]?.url;
            const allColors = getVariantColors(product);
            const allSizes = getVariantSizes(product);
            const hasVariants =
              allColors.length > 0 ||
              allSizes.length > 0 ||
              product.variants?.length > 0;

            // Find color hex for the selected color
            const selectedColorObj = selectedColor
              ? allColors.find(
                  (c) => c.name?.toLowerCase() === selectedColor?.toLowerCase(),
                )
              : null;
            const colorHex = selectedColorObj?.hex || null;

            return (
              <div key={cartKey} className="mb-4 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {thumb && (
                      <Image
                        src={encodeURI(thumb)}
                        alt={product.title || product.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {product.title || product.name}
                      </p>
                      {selectedColor || selectedSize ? (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {selectedColor && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {colorHex && (
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                  style={{ backgroundColor: colorHex }}
                                />
                              )}
                              <span className="text-gray-600">
                                {selectedColor}
                              </span>
                            </span>
                          )}
                          {selectedSize && (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              {selectedSize}
                            </span>
                          )}
                          {hasVariants && (
                            <button
                              onClick={() => {
                                setEditItem(item);
                                setEditMode("edit");
                              }}
                              title="Edit variant"
                              className="text-gray-400 hover:text-gray-700 p-0.5"
                            >
                              <FaPencilAlt className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        hasVariants && (
                          <button
                            onClick={() => {
                              setEditItem(item);
                              setEditMode("edit");
                            }}
                            className="flex items-center gap-1 mt-0.5 text-xs text-blue-600 hover:underline"
                          >
                            <FaPencilAlt className="w-2.5 h-2.5" />{" "}
                            {t("cart.select_option")}
                          </button>
                        )
                      )}
                      <p className="text-xs text-gray-500">
                        ৳{price.toFixed(2)} each
                      </p>
                      {hasVariants && (
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditMode("add");
                          }}
                          className="mt-1 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                        >
                          {t("cart.add_size_color")}
                        </button>
                      )}
                      {product.freeShipping && (
                        <p className="text-xs font-semibold text-green-700 mt-0.5">
                          {t("cart.free_shipping_badge")}
                        </p>
                      )}
                      {product.availability === "out_of_stock" && (
                        <button
                          onClick={() => setWaitlistProduct(product)}
                          className="mt-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded px-2 py-0.5 hover:bg-amber-100 transition"
                        >
                          {t("cart.out_of_stock_waitlist")}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(cartKey)}
                    className="text-gray-400 hover:text-red-600"
                    title="Remove item"
                  >
                    <FaTrash />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <QuantitySelector
                      quantity={quantity}
                      onChange={(q) => updateQty(cartKey, q)}
                    />
                    {itemSaved > 0 && (
                      <div className="text-xs whitespace-nowrap text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                        Save ৳{Math.round(itemSaved)}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    ৳{(price * quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {cartItems.length > 0 && (
          <div className="p-4 border-t shrink-0 mt-auto">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{t("checkout.total")}</span>
              <span className="font-semibold">৳{Math.round(total)}</span>
            </div>
            {saved > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 mb-2">
                <span className="text-sm">🎉</span>
                <span className="text-xs font-medium text-green-700">
                  {t("checkout.you_saving_prefix")}{" "}
                  <span className="font-extrabold">৳{Math.round(saved)}</span>{" "}
                  {t("checkout.you_saving_suffix")}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toggleSidebar();
                  router.push("/cart");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-1 rounded hover:bg-gray-50 "
              >
                {t("cart.view_cart")}
              </button>
              <button
                onClick={() => {
                  toggleSidebar();
                  router.push("/checkout");
                }}
                className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700"
              >
                {t("cart.proceed_checkout")}
              </button>
            </div>
          </div>
        )}
      </div>
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}
      {editItem && (
        <VariantEditModal
          item={editItem}
          mode={editMode}
          onClose={() => {
            setEditItem(null);
            setEditMode("edit");
          }}
          onSave={(c, s, v, q) => {
            updateCartVariant(editItem.cartKey, c, s, v, q);
            setEditItem(null);
            setEditMode("edit");
          }}
        />
      )}
    </>
  );
}
