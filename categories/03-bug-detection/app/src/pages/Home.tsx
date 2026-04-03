import React from 'react';
import { ProductList } from '../components/ProductList';

export function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          TechMart Electronics
        </h1>
        <p className="text-gray-600">
          Discover the latest in tech - from premium audio to powerful laptops
          and smart accessories.
        </p>
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-blue-500 rounded-2xl p-8 mb-10 text-white">
        <div className="max-w-xl">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-80">
            Limited Time Offer
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-3">
            Up to 25% Off Select Electronics
          </h2>
          <p className="opacity-90 mb-4">
            Free shipping on orders over $99. Shop our curated collection of
            premium tech products.
          </p>
        </div>
      </div>

      <ProductList />
    </div>
  );
}
