const DAY_MS = 24 * 60 * 60 * 1000;

export const ORDER_STATUSES = [
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function getForwardOrderStatuses(status) {
  const currentIndex = ORDER_STATUSES.findIndex((item) => item.id === status);
  if (currentIndex < 0) return [];
  return ORDER_STATUSES.filter((item, index) => index > currentIndex && item.id !== 'cancelled');
}

export function canAdvanceOrderStatus(currentStatus, nextStatus) {
  return getForwardOrderStatuses(currentStatus).some((item) => item.id === nextStatus);
}

export const ORDER_FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const TRACKING_STEPS = [
  { id: 'placed', label: 'Order Placed', note: 'Your order is confirmed.' },
  { id: 'processing', label: 'Processing', note: 'Your items are being prepared.' },
  { id: 'shipped', label: 'Shipped', note: 'Your parcel is on its way.' },
  { id: 'out_for_delivery', label: 'Out for Delivery', note: 'Your parcel is nearly there.' },
  { id: 'delivered', label: 'Delivered', note: 'Your order has arrived.' },
];

const productCatalog = {
  backpack: {
    id: 1,
    title: 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops',
    price: 109.95,
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png',
    description: 'A practical everyday backpack from the sample catalog.',
    rating: { rate: 3.9, count: 120 },
  },
  shirt: {
    id: 2,
    title: 'Mens Casual Premium Slim Fit T-Shirts',
    price: 22.3,
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png',
    description: 'A simple casual tee from the sample catalog.',
    rating: { rate: 4.1, count: 259 },
  },
  jacket: {
    id: 3,
    title: 'Mens Cotton Jacket',
    price: 55.99,
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png',
    description: 'A lightweight cotton jacket from the sample catalog.',
    rating: { rate: 4.7, count: 500 },
  },
  drive: {
    id: 12,
    title: 'WD 4TB Gaming Drive Works with Playstation 4 Portable External Hard Drive',
    price: 114,
    category: 'electronics',
    image: 'https://fakestoreapi.com/img/61mtL65D4cL._AC_SX679_t.png',
    description: 'External storage from the sample catalog.',
    rating: { rate: 4.8, count: 400 },
  },
  bracelet: {
    id: 5,
    title: "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet",
    price: 695,
    category: 'jewelery',
    image: 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png',
    description: 'A jewelry sample listing from the catalog.',
    rating: { rate: 4.6, count: 400 },
  },
};

function daysFrom(date, count) {
  return new Date(date.getTime() + count * DAY_MS).toISOString();
}

function makeSeedOrder({ id, daysAgo, status, deliveryInDays, items, name }) {
  const orderDate = new Date(Date.now() - daysAgo * DAY_MS);
  const normalizedItems = items.map(([productKey, quantity]) => ({ product: productCatalog[productKey], quantity }));
  const total = normalizedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return {
    id,
    reference: id,
    orderDate: orderDate.toISOString(),
    expectedDeliveryDate: daysFrom(orderDate, deliveryInDays),
    status,
    items: normalizedItems,
    total,
    exchangeRate: 94.03,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.test`,
    shippingAddress: '24 Garden Lane, Pune, Maharashtra 411001',
    paymentMethod: 'Demo checkout · no payment processed',
    updatedAt: orderDate.toISOString(),
    demo: true,
  };
}

export function createInitialOrders() {
  return [
    makeSeedOrder({ id: 'GA-DEMO-2418', daysAgo: 1, status: 'processing', deliveryInDays: 6, items: [['backpack', 1], ['shirt', 2]], name: 'Aarav Mehta' }),
    makeSeedOrder({ id: 'GA-DEMO-2417', daysAgo: 3, status: 'shipped', deliveryInDays: 6, items: [['drive', 1]], name: 'Mira Shah' }),
    makeSeedOrder({ id: 'GA-DEMO-2416', daysAgo: 10, status: 'delivered', deliveryInDays: 6, items: [['bracelet', 1]], name: 'Kabir Rao' }),
    makeSeedOrder({ id: 'GA-DEMO-2415', daysAgo: 12, status: 'cancelled', deliveryInDays: 6, items: [['jacket', 1]], name: 'Anaya Iyer' }),
  ];
}

export function createOrderId(now = new Date()) {
  const timestamp = now.toISOString().replace(/\D/g, '').slice(0, 14);
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 8).toUpperCase()
    || Math.random().toString(36).slice(2, 10).toUpperCase();
  return `GA-${timestamp}-${random}`;
}

export function createDemoOrder({ cart, total, exchangeRate, details, now = new Date() }) {
  const id = createOrderId(now);
  return {
    id,
    reference: id,
    orderDate: now.toISOString(),
    expectedDeliveryDate: daysFrom(now, 6),
    status: 'processing',
    items: cart.map(({ product, quantity }) => ({ product, quantity })),
    total,
    exchangeRate,
    name: details.name.trim(),
    email: details.email.trim(),
    shippingAddress: details.address.trim(),
    paymentMethod: 'Demo checkout · no payment processed',
    updatedAt: now.toISOString(),
    demo: true,
  };
}

export function getOrderStatusLabel(status) {
  return ORDER_STATUSES.find((item) => item.id === status)?.label || 'Processing';
}

export function getTrackingIndex(status) {
  if (status === 'cancelled') return 1;
  return Math.max(1, TRACKING_STEPS.findIndex((step) => step.id === status));
}

export function getOrderSummary(orders = []) {
  return {
    totalOrders: orders.length,
    processing: orders.filter((order) => order.status === 'processing').length,
    shipped: orders.filter((order) => order.status === 'shipped' || order.status === 'out_for_delivery').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    cancelled: orders.filter((order) => order.status === 'cancelled').length,
  };
}

export function filterOrders(orders = [], status = 'all', query = '') {
  const term = query.trim().toLocaleLowerCase();
  return orders.filter((order) => {
    const statusMatches = status === 'all'
      || order.status === status
      || (status === 'shipped' && order.status === 'out_for_delivery');
    const queryMatches = !term
      || `${order.id} ${order.reference || ''} ${order.items.map(({ product }) => product.title).join(' ')}`.toLocaleLowerCase().includes(term);
    return statusMatches && queryMatches;
  }).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
}
