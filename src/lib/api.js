const API_BASE = 'https://fakestoreapi.com';
const FX_API_BASE = 'https://api.frankfurter.dev/v2';

export async function getUsdInrRate() {
  const response = await fetch(`${FX_API_BASE}/rate/USD/INR`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}`);
  const data = await response.json();
  if (data.base !== 'USD' || data.quote !== 'INR' || !Number.isFinite(Number(data.rate)) || Number(data.rate) <= 0) {
    throw new Error('Exchange-rate service returned an invalid USD/INR rate');
  }
  return { rate: Number(data.rate), date: data.date, source: 'Frankfurter reference' };
}

async function request(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Fake Store API returned ${response.status}. Please try again.`);
  }
  return response.json();
}

export async function getCatalog() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  try {
    const [productsResult, categoriesResult] = await Promise.allSettled([
      request('/products', controller.signal),
      request('/products/categories', controller.signal),
    ]);
    if (productsResult.status === 'rejected') throw productsResult.reason;

    const products = productsResult.value.map((product) => ({
      ...product,
      id: Number(product.id),
      price: Number(product.price) || 0,
      rating: product.rating || null,
    }));
    const categories = categoriesResult.status === 'fulfilled'
      ? categoriesResult.value
      : [...new Set(products.map((product) => product.category).filter(Boolean))];

    return { products, categories };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The product catalog took too long to respond. Please retry.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}
