import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Heart, LockKeyhole, Minus, Plus, Scale, ShieldCheck, Sparkles, X } from 'lucide-react';
import { formatCategory } from '../lib/recommendations.js';
import { formatINR, usdToInr } from '../lib/currency.js';

function Frame({ children, onClose, className = '' }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${className}`} role="dialog" aria-modal="true">
        <button className="modal-close" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        {children}
      </section>
    </div>
  );
}

function ProductModal({ product, wished, onClose, onWishlist, onAdd, onBuy, exchangeRate }) {
  return (
    <Frame onClose={onClose} className="product-modal">
      <div className="product-modal-image"><img src={product.image} alt={product.title} /></div>
      <div className="product-modal-content">
        <div className="eyebrow"><span className="eyebrow-line" /> {formatCategory(product.category)}</div>
        <h2>{product.title}</h2>
        <div className="product-modal-price">{formatINR(usdToInr(product.price, exchangeRate))} {product.rating?.rate && <span>★ {product.rating.rate.toFixed(1)} <small>({product.rating.count || 0} reviews)</small></span>}</div>
        <p>{product.description || 'A useful find, chosen to fit the goal you have in mind.'}</p>
        <div className="fit-note"><Sparkles size={16} /><span><strong>Why it fits</strong> A thoughtful option from the Fake Store API sample catalog. Explore a few ways it could support your goal.</span></div>
        <div className="product-modal-actions"><button className="button button--lime" onClick={() => onBuy(product)}>Buy now <ArrowRight size={16} /></button><button className="button button--dark" onClick={() => onAdd(product)}>Add to plan <Plus size={16} /></button><button className={`modal-heart ${wished ? 'is-active' : ''}`} onClick={() => onWishlist(product)} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}><Heart size={18} fill={wished ? 'currentColor' : 'none'} /></button></div>
        <small className="modal-demo-note">Sample listing · INR amount is a reference conversion; price and availability are illustrative.</small>
      </div>
    </Frame>
  );
}

function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) { setError('Use at least 6 characters for this demo sign-in.'); return; }
    const label = name.trim() || email.split('@')[0] || 'Goal setter';
    onSuccess({ name: label, email });
  };

  return (
    <Frame onClose={onClose} className="auth-modal">
      <div className="modal-brand-mark"><span className="brand-mark"><span /></span></div>
      <div className="eyebrow"><span className="eyebrow-line" /> KEEP YOUR MOMENTUM</div>
      <h2>{mode === 'signin' ? 'Pick up where you left off.' : 'Make this plan yours.'}</h2>
      <p className="modal-lede">Your goal and the things you picked are staying right here.</p>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'signup' && <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we greet you?" required /></label>}
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button--lime button--wide" type="submit">{mode === 'signin' ? 'Sign in to GoalAI' : 'Create your demo account'} <ArrowRight size={16} /></button>
      </form>
      <div className="auth-switch">{mode === 'signin' ? 'New to GoalAI?' : 'Already have an account?'} <button onClick={() => { setError(''); setMode((value) => value === 'signin' ? 'signup' : 'signin'); }}>{mode === 'signin' ? 'Create a demo account' : 'Sign in'}</button></div>
      <div className="auth-trust"><LockKeyhole size={14} /> Demo access only. This prototype doesn’t create a real account or send your password.</div>
    </Frame>
  );
}

function CheckoutModal({ cart, total, user, onClose, onSubmit, exchangeRate }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    onSubmit({ name, email, address });
  };

  return (
    <Frame onClose={onClose} className="checkout-modal">
      <div className="eyebrow"><span className="eyebrow-line" /> CHECKOUT, KEPT SIMPLE</div>
      <h2>One clear next step.</h2>
      <p className="modal-lede">This is a demo checkout. It won’t charge you or place a real order.</p>
      <div className="checkout-items">{cart.map(({ product, quantity }) => <div className="checkout-item" key={product.id}><img src={product.image} alt="" /><span>{product.title}<small>Qty {quantity}</small></span><strong>{formatINR(usdToInr(product.price * quantity, exchangeRate))}</strong></div>)}</div>
      <div className="checkout-total"><span>Estimated total</span><strong>{formatINR(usdToInr(total, exchangeRate))}</strong></div>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="checkout-fields"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label></div>
        <label>Delivery address<input value={address} onChange={(event) => setAddress(event.target.value)} required placeholder="Address for this demo order" /></label>
        <div className="payment-note"><ShieldCheck size={17} /><span><strong>Demo checkout</strong><small>No card details are collected. No payment is processed.</small></span><span className="demo-chip">SAMPLE</span></div>
        <button className="button button--lime button--wide" type="submit" disabled={submitted || cart.length === 0}>Place demo order <ArrowRight size={16} /></button>
      </form>
      <div className="secure-note"><LockKeyhole size={14} /> Your selections were kept while you signed in.</div>
    </Frame>
  );
}

function CompareModal({ products, onClose, onRemove, exchangeRate }) {
  return (
    <Frame onClose={onClose} className="compare-modal">
      <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE SIDE BY SIDE</div>
      <h2>Good choices, <em>clearer.</em></h2>
      <p className="modal-lede">Compare what matters, then choose what fits your goal and budget.</p>
      <div className="compare-table" style={{ '--compare-columns': products.length }}>
        <div className="compare-label-column"><span>Product</span><span>Price</span><span>Category</span><span>Rating</span><span>Details</span></div>
        {products.map((product) => <div className="compare-column" key={product.id}><button className="compare-remove" onClick={() => onRemove(product)} aria-label="Remove from comparison"><X size={15} /></button><img src={product.image} alt={product.title} /><strong>{product.title}</strong><span className="compare-price">{formatINR(usdToInr(product.price, exchangeRate))}</span><span>{formatCategory(product.category)}</span><span>{product.rating?.rate ? `★ ${product.rating.rate.toFixed(1)}` : 'Not rated'}</span><span>{product.description}</span></div>)}
      </div>
      <button className="button button--dark" onClick={onClose}>Back to your picks <ArrowRight size={15} /></button>
    </Frame>
  );
}

function OrderModal({ order, onClose, exchangeRate }) {
  return (
    <Frame onClose={onClose} className="order-modal">
      <div className="order-check"><Check size={28} /></div>
      <div className="eyebrow"><span className="eyebrow-line" /> DEMO ORDER CONFIRMED</div>
      <h2>That’s a good <em>next step.</em></h2>
      <p className="modal-lede">Your sample order summary is ready. No payment was taken and no real order was placed.</p>
      <div className="order-reference"><span>DEMO REFERENCE</span><strong>{order.reference}</strong><span>For {order.name} · {order.email}</span></div>
      <div className="order-receipt">{order.items.map(({ product, quantity }) => <div key={product.id}><span>{product.title} <small>× {quantity}</small></span><strong>{formatINR(usdToInr(product.price * quantity, exchangeRate))}</strong></div>)}<div className="order-receipt-total"><span>Demo total</span><strong>{formatINR(usdToInr(order.total, exchangeRate))}</strong></div></div>
      <button className="button button--lime button--wide" onClick={onClose}>Keep exploring <ArrowRight size={16} /></button>
    </Frame>
  );
}

const Modals = { ProductModal, AuthModal, CheckoutModal, CompareModal, OrderModal };
export default Modals;
