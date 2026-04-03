import { ApiClient } from '@acme/sdk';

interface UserV1 {
  id: number;
  name: string;
  email: string;
  role: string;
  created: string; // Unix timestamp as string
}

interface ProductV1 {
  id: number;
  title: string;
  price: number;
  category: string;
  active: boolean;
}

interface OrderV1 {
  id: number;
  userId: number;
  items: Array<{ productId: number; qty: number; price: number }>;
  total: number;
  status: string;
  created: string;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

const client = new ApiClient({
  baseUrl: 'https://api.acme.com/v1',
  apiKey: process.env.ACME_API_KEY!,
});

// Fetch all users with pagination
async function getUsers(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<UserV1>> {
  const response = await client.get('/users', {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

// Fetch single user
async function getUser(userId: number): Promise<UserV1> {
  const response = await client.get(`/users/${userId}`);
  return response.data;
}

// Create user
async function createUser(userData: Omit<UserV1, 'id' | 'created'>): Promise<UserV1> {
  const response = await client.post('/users', userData);
  return response.data;
}

// Update user
async function updateUser(userId: number, updates: Partial<UserV1>): Promise<UserV1> {
  const response = await client.put(`/users/${userId}`, updates);
  return response.data;
}

// Fetch products with filtering
async function getProducts(
  category?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedResponse<ProductV1>> {
  const params: Record<string, any> = { page, page_size: pageSize };
  if (category) params.category = category;
  const response = await client.get('/products', { params });
  return response.data;
}

// Create order
async function createOrder(
  userId: number,
  items: Array<{ productId: number; qty: number }>
): Promise<OrderV1> {
  const response = await client.post('/orders', {
    user_id: userId,
    items: items.map((i) => ({ product_id: i.productId, qty: i.qty })),
  });
  return response.data;
}

// Get orders for user with filtering
async function getUserOrders(
  userId: number,
  status?: string,
  page: number = 1
): Promise<PaginatedResponse<OrderV1>> {
  const params: Record<string, any> = { page, page_size: 20 };
  if (status) params.status = status;
  const response = await client.get(`/users/${userId}/orders`, { params });
  return response.data;
}

// Error handling wrapper
async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Resource not found');
    }
    if (error.status === 422) {
      throw new Error('Validation error: ' + error.message);
    }
    if (error.status === 429) {
      // Simple retry after 1 second
      await new Promise((r) => setTimeout(r, 1000));
      return fn();
    }
    throw error;
  }
}

export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  getProducts,
  createOrder,
  getUserOrders,
  withErrorHandling,
};
