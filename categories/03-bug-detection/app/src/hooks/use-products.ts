import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { products as allProducts } from '../data/products';

interface UseProductsOptions {
  categoryFilter: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'name';
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function simulateFetch(category: string): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (category === 'all') {
        resolve(allProducts);
      } else {
        resolve(allProducts.filter((p) => p.category === category));
      }
    }, 300);
  });
}

export function useProducts({
  categoryFilter,
  sortBy = 'rating',
}: UseProductsOptions): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (category: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await simulateFetch(category);
        let sorted = [...data];
        switch (sortBy) {
          case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
          case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        }
        setProducts(sorted);
      } catch (err) {
        setError('Failed to fetch products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [sortBy]
  );

  useEffect(() => {
    fetchProducts(categoryFilter);
  }, []);

  const refetch = useCallback(() => {
    fetchProducts(categoryFilter);
  }, [fetchProducts, categoryFilter]);

  return { products, isLoading, error, refetch };
}
