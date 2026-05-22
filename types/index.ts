export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number | null
  stock: number
  images: string[]
  featured: boolean
  categoryId: string
  category: Category
  reviews?: Review[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  createdAt: string
}

export interface Review {
  id: string
  rating: number
  comment?: string | null
  userId: string
  productId: string
  user: { name?: string | null; image?: string | null }
  createdAt: string
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  product: Product
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
}

export interface Order {
  id: string
  userId: string
  status: string
  total: number
  address: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product: Product
}

export interface User {
  id: string
  name?: string | null
  email: string
  image?: string | null
  role: string
  createdAt: string
}

export interface CartStoreItem {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  image: string
  quantity: number
  stock: number
}

export interface CartStore {
  items: CartStoreItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}
