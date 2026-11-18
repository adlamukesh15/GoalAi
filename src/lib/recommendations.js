export const GOALS = [
  {
    id: 'capsule',
    number: '01',
    title: 'Build a capsule wardrobe',
    shortTitle: 'A capsule wardrobe',
    description: 'A few thoughtful pieces. A lot more ways to wear them.',
    categoryHints: ["women's clothing", "men's clothing"],
    keywords: ['wardrobe', 'capsule', 'style', 'clothes', 'outfit', 'fashion', 'dress'],
    tone: 'lilac',
    icon: 'sparkles',
  },
  {
    id: 'tech',
    number: '02',
    title: 'Upgrade my tech setup',
    shortTitle: 'A better tech setup',
    description: 'Find the useful upgrades that make every day flow.',
    categoryHints: ['electronics'],
    keywords: ['tech', 'setup', 'electronics', 'laptop', 'phone', 'work', 'desk', 'headphones'],
    tone: 'peach',
    icon: 'monitor',
  },
  {
    id: 'gift',
    number: '03',
    title: 'Find a thoughtful gift',
    shortTitle: 'A thoughtful gift',
    description: 'Meaningful finds for someone who means a lot.',
    categoryHints: ['jewelery'],
    keywords: ['gift', 'present', 'birthday', 'jewelry', 'jewelery', 'anniversary'],
    tone: 'mint',
    icon: 'gift',
  },
  {
    id: 'everyday',
    number: '04',
    title: 'Refresh my everyday essentials',
    shortTitle: 'Everyday essentials',
    description: 'Small upgrades for the routines you already love.',
    categoryHints: [],
    keywords: ['everyday', 'essentials', 'refresh', 'routine', 'daily', 'upgrade'],
    tone: 'butter',
    icon: 'sun',
  },
];

const normalize = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9\s']/g, ' ');

export function goalForQuery(query) {
  const text = normalize(query);
  if (!text.trim()) return null;
  return GOALS.map((goal) => ({
    goal,
    score: goal.keywords.reduce((score, word) => score + (text.includes(word) ? word.length + 2 : 0), 0),
  })).sort((a, b) => b.score - a.score)[0]?.score > 0
    ? GOALS.map((goal) => ({
      goal,
      score: goal.keywords.reduce((score, word) => score + (text.includes(word) ? word.length + 2 : 0), 0),
    })).sort((a, b) => b.score - a.score)[0].goal
    : null;
}

export function getSuggestions(query, products = []) {
  const text = normalize(query).trim();
  if (!text) return [];
  const words = text.split(/\s+/).filter((word) => word.length > 1);
  const goals = GOALS.map((goal) => {
    const content = normalize(`${goal.title} ${goal.description} ${goal.keywords.join(' ')}`);
    const score = words.reduce((sum, word) => sum + (content.includes(word) ? word.length + 2 : 0), 0);
    return { type: 'goal', value: goal.title, goal, score };
  }).filter((item) => item.score > 0);
  const matches = products.map((product) => {
    const content = normalize(`${product.title} ${product.category} ${product.description}`);
    const score = words.reduce((sum, word) => sum + (content.includes(word) ? word.length + 1 : 0), 0);
    return { type: 'product', value: product.title, product, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  return [...goals.sort((a, b) => b.score - a.score).slice(0, 4), ...matches]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function recommendProducts(products, goal, query = '', budget = Infinity, exchangeRate = 1) {
  const text = normalize(`${query} ${goal?.title || ''} ${goal?.keywords?.join(' ') || ''}`);
  const words = text.split(/\s+/).filter((word) => word.length > 2);
  return products
    .filter((product) => product.price * exchangeRate <= budget)
    .map((product) => {
      const category = normalize(product.category);
      const content = normalize(`${product.title} ${product.description} ${product.category}`);
      const categoryScore = goal?.categoryHints?.some((hint) => category === normalize(hint)) ? 9 : 0;
      const keywordScore = words.reduce((sum, word) => sum + (content.includes(word) ? word.length : 0), 0);
      const popularScore = Number(product.rating?.rate || 0) * 0.15;
      return { product, score: categoryScore + keywordScore + popularScore };
    })
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .map(({ product, score }) => ({ ...product, matchScore: score }));
}

export function formatCategory(category = '') {
  return category.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
