import { ArrowUpRight, Heart, Plus, Scale, Star } from 'lucide-react';
import { formatCategory } from '../lib/recommendations.js';
import { formatINR, usdToInr } from '../lib/currency.js';

export default function ProductCard({
  product,
  wished,
  compared,
  onWishlist,
  onCompare,
  onDetails,
  onAdd,
  onBuy,
  exchangeRate,
  compact = false,
}) {
  return (
    <article className={`product-card ${compact ? 'product-card--compact' : ''}`}>
      <div className="product-image-wrap">
        <span className="product-category">{formatCategory(product.category)}</span>
        {product.matchScore > 0 && <span className="match-pill"><span className="match-dot" /> Goal match</span>}
        <button className="product-image-action" aria-label={`View details for ${product.title}`} onClick={() => onDetails(product)}>
          <img src={product.image} alt="" loading="lazy" />
        </button>
        <button className={`icon-button product-heart ${wished ? 'is-active' : ''}`} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => onWishlist(product)}>
          <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-info">
        <div className="product-title-line">
          <button className="product-title" onClick={() => onDetails(product)}>{product.title}</button>
          <button className="text-arrow" aria-label={`View ${product.title}`} onClick={() => onDetails(product)}><ArrowUpRight size={16} /></button>
        </div>
        <div className="product-meta">
          <span className="price">{formatINR(usdToInr(product.price, exchangeRate))}</span>
          {product.rating?.rate && <span className="rating"><Star size={12} fill="currentColor" /> {product.rating.rate.toFixed(1)}</span>}
        </div>
        <div className="product-actions">
          <button className="button button--dark button--small" onClick={() => onAdd(product)}><Plus size={15} /> Add to plan</button>
          <button className={`compare-button ${compared ? 'is-selected' : ''}`} onClick={() => onCompare(product)}><Scale size={15} /> {compared ? 'Comparing' : 'Compare'}</button>
          {!compact && <button className="buy-link" onClick={() => onBuy(product)}>Buy now <ArrowUpRight size={14} /></button>}
        </div>
      </div>
    </article>
  );
}
