import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cart-store';
import { CartItemRow } from './CartItem';

export function Cart() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach((item) => {
      initial[item.product.id] = item.quantity;
    });
    return initial;
  });

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeItem(productId);
        setQuantities((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        return;
      }

      const currentQty = quantities[productId] || 0;
      const updatedQty = currentQty + (newQuantity > currentQty ? 1 : -1);
      setQuantities({ ...quantities, [productId]: updatedQty });

      useCartStore.getState().updateQuantity(productId, updatedQty);
    },
    [quantities, removeItem]
  );

  const handleRemove = useCallback(
    (productId: string) => {
      removeItem(productId);
      setQuantities((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    },
    [removeItem]
  );

  const total = getTotal();
  const shipping = total > 99 ? 0 : 9.99;
  const tax = total * 0.08;
  const orderTotal = total + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-24 h-24 mx-auto text-gray-300 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-6">
          Looks like you have not added any products yet.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h2>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {items.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900 text-lg">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          {shipping > 0 && (
            <p className="text-sm text-green-600 mb-4">
              Add ${(99 - total).toFixed(2)} more for free shipping!
            </p>
          )}

          <Link
            to="/checkout"
            className="block w-full py-3 bg-brand-600 text-white text-center rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Proceed to Checkout
          </Link>

          <Link
            to="/"
            className="block w-full py-3 mt-3 text-brand-600 text-center rounded-lg font-medium border border-brand-600 hover:bg-brand-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
