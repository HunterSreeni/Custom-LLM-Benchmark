import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

interface OrderState {
  orderId: string;
  total: number;
  items: number;
  address: {
    fullName: string;
    city: string;
    state: string;
  };
}

export function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const orderState = location.state as OrderState | null;

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Order Confirmed!
      </h1>
      <p className="text-gray-600 mb-2">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Order ID: <span className="font-mono font-medium">{orderId}</span>
      </p>

      {orderState && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="text-gray-900">{orderState.items} products</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="text-gray-900 font-semibold">
                ${orderState.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ship to</span>
              <span className="text-gray-900">
                {orderState.address.fullName}, {orderState.address.city},{' '}
                {orderState.address.state}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated delivery</span>
              <span className="text-gray-900">5-7 business days</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/"
          className="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
