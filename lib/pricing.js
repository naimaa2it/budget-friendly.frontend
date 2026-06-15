const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const hasPositivePrice = (value) => {
  const number = toNumber(value);
  return number != null && number > 0;
};

export const getPrimaryVariant = (product) =>
  Array.isArray(product?.variants) && product.variants.length
    ? product.variants.find((variant) => hasPositivePrice(variant?.price)) ||
      product.variants[0]
    : null;

export const getDisplayPrice = (product, variant = null) => {
  const activeVariant = variant || getPrimaryVariant(product);
  const price = hasPositivePrice(activeVariant?.price)
    ? toNumber(activeVariant.price)
    : toNumber(product?.price) || 0;
  const compareAtPrice = hasPositivePrice(activeVariant?.compareAtPrice)
    ? toNumber(activeVariant.compareAtPrice)
    : toNumber(product?.compareAtPrice);

  return {
    price,
    compareAtPrice,
    discountPct:
      compareAtPrice && compareAtPrice > price
        ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        : null,
  };
};

