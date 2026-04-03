import React from 'react';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <Link
        to={`/product/${product.id}`}
        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${product.id}`}
          className="font-medium text-gray-900 hover:text-brand-600 transition-colors line-clamp-1"
        >
          {product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">{product.category}</p>
        <p className="font-semibold text-gray-900 mt-1">
          ${product.price.toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="w-8 text-center font-medium text-gray-900">
          {quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-900">
          ${(product.price * quantity).toFixed(2)}
        </p>
        <button
          onClick={() => onRemove(product.id)}
          className="text-sm text-red-500 hover:text-red-700 transition-colors mt-1"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
