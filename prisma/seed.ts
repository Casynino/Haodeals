import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const categories = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Latest gadgets and tech",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Trending styles and apparel",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
  },
  {
    name: "Home",
    slug: "home",
    description: "Furniture and home decor",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
  },
  {
    name: "Sports",
    slug: "sports",
    description: "Fitness and outdoor gear",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
  },
  {
    name: "Beauty",
    slug: "beauty",
    description: "Skincare and cosmetics",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
  },
  {
    name: "Books",
    slug: "books",
    description: "Best-sellers and classics",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
  },
]

// All prices in TZS (1 USD ≈ 2,600 TZS, rounded to nearest 1,000)
const products = [
  // Electronics
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    slug: "sony-wh1000xm5-headphones",
    description: "Industry-leading noise canceling with two processors and eight microphones. Up to 30-hour battery life with quick charging.",
    price: 728000,
    originalPrice: 1040000,
    stock: 45,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "electronics",
  },
  {
    name: "Apple AirPods Pro 2nd Generation",
    slug: "airpods-pro-2nd-gen",
    description: "Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio. H2 chip delivers smarter noise cancellation.",
    price: 494000,
    originalPrice: 647000,
    stock: 30,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "electronics",
  },
  {
    name: "Samsung Galaxy Watch 6 Classic",
    slug: "samsung-galaxy-watch-6-classic",
    description: "Premium smartwatch with rotating bezel, advanced health monitoring, and 40-hour battery life.",
    price: 780000,
    originalPrice: 1118000,
    stock: 22,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "electronics",
  },
  {
    name: "MacBook Air M3 13-inch",
    slug: "macbook-air-m3-13",
    description: "Supercharged by Apple M3 chip. Fanless design, all-day battery, and stunning Liquid Retina display.",
    price: 2857000,
    originalPrice: 3377000,
    stock: 12,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "electronics",
  },
  {
    name: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    description: "Titanium design. A17 Pro chip. 48MP main camera with 5x optical zoom. USB-C with USB 3 speeds.",
    price: 2597000,
    originalPrice: 3117000,
    stock: 18,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "electronics",
  },
  {
    name: "Sony Alpha A7 IV Camera",
    slug: "sony-alpha-a7-iv",
    description: "33MP full-frame BSI CMOS sensor. 4K 60fps video. 10fps continuous shooting with real-time tracking.",
    price: 5457000,
    originalPrice: 6497000,
    stock: 8,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "electronics",
  },
  // Fashion
  {
    name: "Nike Air Max 270",
    slug: "nike-air-max-270",
    description: "Max Air cushioning in a lightweight, breathable design. Perfect for all-day comfort and style.",
    price: 234000,
    originalPrice: 390000,
    stock: 60,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "fashion",
  },
  {
    name: "Levi's 501 Original Jeans",
    slug: "levis-501-original",
    description: "The iconic straight-fit jean that started it all. Rigid denim with a button fly — timeless American style.",
    price: 130000,
    originalPrice: 233000,
    stock: 80,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1541840031508-3ea10bc1fcd4?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "fashion",
  },
  {
    name: "Ray-Ban Aviator Classic Sunglasses",
    slug: "rayban-aviator-classic",
    description: "The original aviator since 1937. Crystal lenses with UV protection and lightweight metal frame.",
    price: 260000,
    originalPrice: 465000,
    stock: 35,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "fashion",
  },
  {
    name: "Luxury Leather Crossbody Bag",
    slug: "luxury-leather-crossbody",
    description: "Italian genuine leather. Adjustable strap, gold hardware, and multiple compartments for everyday elegance.",
    price: 390000,
    originalPrice: 777000,
    stock: 20,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "fashion",
  },
  // Home
  {
    name: "Dyson V15 Detect Vacuum",
    slug: "dyson-v15-detect",
    description: "Laser detects invisible dust. 60-minute runtime. HEPA filtration captures 99.99% of particles.",
    price: 1430000,
    originalPrice: 1950000,
    stock: 14,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "home",
  },
  {
    name: "Premium Coffee Maker with Grinder",
    slug: "premium-coffee-maker",
    description: "Built-in burr grinder, programmable 12-cup carafe, and thermal insulation to keep coffee hot for hours.",
    price: 338000,
    originalPrice: 520000,
    stock: 40,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "home",
  },
  {
    name: "Modern LED Desk Lamp",
    slug: "modern-led-desk-lamp",
    description: "5 color modes, 7 brightness levels, USB charging port. Eye-care technology for comfortable reading.",
    price: 104000,
    originalPrice: 182000,
    stock: 70,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "home",
  },
  // Sports
  {
    name: "Hydro Flask 32oz Water Bottle",
    slug: "hydro-flask-32oz",
    description: "TempShield double-wall vacuum insulation keeps drinks cold for 24 hrs and hot for 12 hrs.",
    price: 91000,
    originalPrice: 130000,
    stock: 100,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "sports",
  },
  {
    name: "Lululemon Align Leggings",
    slug: "lululemon-align-leggings",
    description: "Buttery-soft Nulu fabric. Four-way stretch and weightless feel for yoga and daily wear.",
    price: 177000,
    originalPrice: 255000,
    stock: 55,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "sports",
  },
  {
    name: "Adjustable Dumbbell Set 5-52.5 lbs",
    slug: "adjustable-dumbbell-set",
    description: "Replaces 15 sets of weights. Quick adjust dial. Compact and perfect for home gym.",
    price: 725000,
    originalPrice: 1115000,
    stock: 25,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "sports",
  },
  // Beauty
  {
    name: "La Mer Moisturizing Cream",
    slug: "la-mer-moisturizing-cream",
    description: "Legendary moisturizer with the miraculous broth. Transforms skin appearance in days.",
    price: 481000,
    originalPrice: 884000,
    stock: 15,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop",
    ]),
    featured: true,
    categorySlug: "beauty",
  },
  {
    name: "Charlotte Tilbury Pillow Talk Lipstick",
    slug: "charlotte-tilbury-pillow-talk",
    description: "The iconic universal flattering nude-pink. Creamy formula with long-lasting color.",
    price: 73000,
    originalPrice: 117000,
    stock: 90,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1586495777744-4e6232bf2f9b?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1631214524020-3c69a5c31b8d?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "beauty",
  },
  // Books
  {
    name: "Atomic Habits by James Clear",
    slug: "atomic-habits-james-clear",
    description: "A proven framework for improving every day. One of the most popular self-improvement books of all time.",
    price: 31000,
    originalPrice: 70000,
    stock: 200,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "books",
  },
  {
    name: "The Lean Startup",
    slug: "the-lean-startup",
    description: "How today's entrepreneurs use continuous innovation to create radically successful businesses.",
    price: 36000,
    originalPrice: 73000,
    stock: 150,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop",
    ]),
    featured: false,
    categorySlug: "books",
  },
]

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@haodeals.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@haodeals.com",
      password: adminPassword,
      role: "admin",
    },
  })
  console.log("✅ Admin user:", admin.email)

  // Create demo user
  const userPassword = await bcrypt.hash("user1234", 10)
  const demoUser = await prisma.user.upsert({
    where: { email: "user@haodeals.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "user@haodeals.com",
      password: userPassword,
      role: "customer",
    },
  })
  console.log("✅ Demo user:", demoUser.email)

  // Create categories
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    categoryMap[cat.slug] = created.id
    console.log("✅ Category:", cat.name)
  }

  // Create products
  for (const product of products) {
    const { categorySlug, ...productData } = product
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        price: productData.price,
        originalPrice: productData.originalPrice,
      },
      create: {
        ...productData,
        categoryId: categoryMap[categorySlug],
      },
    })
    console.log("✅ Product:", product.name)
  }

  // Create sample reviews
  const allProducts = await prisma.product.findMany({ take: 6 })
  const reviewComments = [
    "Absolutely love this product! Exceeded my expectations.",
    "Great quality for the price. Would recommend.",
    "Fast shipping and well packaged. Happy with the purchase.",
  ]
  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i]
    await prisma.review.create({
      data: {
        rating: 5,
        comment: reviewComments[i % reviewComments.length],
        userId: demoUser.id,
        productId: product.id,
      },
    }).catch(() => {})
  }
  console.log("✅ Sample reviews created")

  // Create sample order
  const firstProduct = allProducts[0]
  if (firstProduct) {
    await prisma.order.create({
      data: {
        userId: demoUser.id,
        status: "delivered",
        total: firstProduct.price,
        address: "123 Demo Street, San Francisco, CA 94102, US",
        items: {
          create: [
            {
              productId: firstProduct.id,
              quantity: 1,
              price: firstProduct.price,
            },
          ],
        },
      },
    })
    console.log("✅ Sample order created")
  }

  console.log("\n🎉 Seeding complete!")
  console.log("\nDemo credentials:")
  console.log("  Admin: admin@haodeals.com / admin123")
  console.log("  User:  user@haodeals.com  / user1234")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
