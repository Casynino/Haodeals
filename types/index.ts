export interface ProductOption {
  name: string
  values: string[]
}

export interface SelectedOption {
  name: string
  value: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number | null
  stock: number
  images: string[]
  options?: ProductOption[] | null
  featured: boolean
  dealEndsAt?: string | null
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

export interface TrackingEvent {
  id: string
  orderId: string
  status: string
  message: string
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  status: string
  trackingId?: string | null
  total: number
  address: string
  items: OrderItem[]
  trackingEvents?: TrackingEvent[]
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

export interface DiscountCode {
  id: string
  code: string
  userId: string
  percent: number
  used: boolean
  expiresAt: string
  createdAt: string
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
  id: string          // variant key: productId or productId:optionHash
  productId: string   // actual product ID for checkout
  name: string
  price: number
  originalPrice?: number | null
  image: string
  quantity: number
  stock: number
  selectedOptions?: SelectedOption[]
}

export interface CartStore {
  items: CartStoreItem[]
  addItem: (product: Product, quantity?: number, selectedOptions?: SelectedOption[]) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
  // Buy-now: single-item express checkout (not persisted)
  buyNowItem: CartStoreItem | null
  setBuyNow: (product: Product) => void
  clearBuyNow: () => void
}

export interface Message {
  id: string
  conversationId: string
  senderId?: string | null
  senderRole: "customer" | "admin" | "system"
  body: string
  createdAt: string
  sender?: { name?: string | null; email: string } | null
}

export interface ConversationOrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images: string[]
  }
}

export interface ConversationOrder {
  id: string
  trackingId?: string | null
  status: string
  total: number
  address: string
  createdAt: string
  items: ConversationOrderItem[]
  trackingEvents: TrackingEvent[]
}

export interface Conversation {
  id: string
  userId: string
  orderId?: string | null
  subject: string
  status: string
  customerUnread: number
  adminUnread: number
  lastMessageAt: string
  createdAt: string
  user: { name?: string | null; email: string }
  order?: ConversationOrder | null
  messages?: Message[]
}
