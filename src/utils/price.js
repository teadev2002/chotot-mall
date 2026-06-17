// Dynamic price formatter helper

export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'Contact for Price';
  const numPrice = Number(price);
  if (isNaN(numPrice)) return 'Contact for Price';

  // Large prices (>= 1000) display as Vietnamese Dong (VND), others as USD
  if (numPrice >= 10000) {
    return `${numPrice.toLocaleString('vi-VN')} ₫`;
  }
  return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
