import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Heart,
  Menu, Minus, Plus, RefreshCw, ShoppingBag, Sparkles, X,
  Gift, Monitor, Sun, Compass, UserRound, Scale, Trash2, ClipboardList,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import GoalSearch from './components/GoalSearch.jsx';
import ProductCard from './components/ProductCard.jsx';
import Modals from './components/Modals.jsx';
import OrdersPage from './components/OrdersPage.jsx';
import usePersistedState from './hooks/usePersistedState.js';
import { getCatalog, getUsdInrRate } from './lib/api.js';
import { formatCategory, GOALS, recommendProducts } from './lib/recommendations.js';
import { FALLBACK_RATE_DATE, FALLBACK_USD_INR_RATE, formatINR, usdToInr } from './lib/currency.js';
import { canAdvanceOrderStatus, createDemoOrder, createInitialOrders } from './lib/orders.js';
import { downloadInvoice } from './lib/invoice.js';

const goalIcons = { sparkles: Sparkles, monitor: Monitor, gift: Gift, sun: Sun };
const currency = (usdAmount, rate) => formatINR(usdToInr(usdAmount, rate));

function Brand() {
  return (
    <button className="brand" aria-label="GoalAI home">
      <span className="brand-mark"><span /></span>
      <span className="brand-word"><strong>Goal</strong><em>AI</em></span>
    </button>
  );
}

function GoalCard({ goal, index, active, onClick }) {
  const Icon = goalIcons[goal.icon] || Sparkles;
  return (
    <button className={`goal-card goal-card--${goal.tone} ${active ? 'is-selected' : ''}`} onClick={() => onClick(goal)}>
      <span className="goal-card-number">{goal.number}</span>
      <span className="goal-card-icon"><Icon size={20} strokeWidth={1.7} /></span>
      <span className="goal-card-copy"><strong>{goal.shortTitle}</strong><small>{goal.description}</small></span>
      <span className="goal-card-arrow"><ArrowUpRight size={18} /></span>
      <span className="goal-card-index">0{index + 1}</span>
    </button>
  );
}

function EmptyState({ icon: Icon = ShoppingBag, title, copy, onClick, action = 'Explore goals' }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><Icon size={25} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {onClick && <button className="button button--dark" onClick={onClick}>{action}<ArrowRight size={16} /></button>}
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const [catalogError, setCatalogError] = useState('');
  const [exchange, setExchange] = useState({ rate: FALLBACK_USD_INR_RATE, date: FALLBACK_RATE_DATE, source: 'saved fallback' });
  const [query, setQuery] = useState('');
  const [goal, setGoal] = usePersistedState('goalai-active-goal', null);
  const [cart, setCart] = usePersistedState('goalai-cart', []);
  const [wishlist, setWishlist] = usePersistedState('goalai-wishlist', []);
  const [user, setUser] = usePersistedState('goalai-user', null);
  const initialOrders = useMemo(() => createInitialOrders(), []);
  const [orders, setOrders] = usePersistedState('goalai-orders', initialOrders);
  const [view, setView] = useState(() => location.pathname === '/orders' ? 'orders' : 'explore');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [budget, setBudget] = useState(100000);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [sort, setSort] = useState('match');
  const [compared, setCompared] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authPending, setAuthPending] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const loadCatalog = async () => {
    setCatalogStatus('loading');
    setCatalogError('');
    try {
      const catalog = await getCatalog();
      setProducts(catalog.products);
      setCategories(catalog.categories);
      setCatalogStatus('ready');
    } catch (error) {
      setCatalogError(error.message || 'We could not load the catalog. Please try again.');
      setCatalogStatus('error');
    }
  };

  useEffect(() => { loadCatalog(); }, []);
  useEffect(() => {
    let active = true;
    getUsdInrRate()
      .then((nextRate) => { if (active) setExchange(nextRate); })
      .catch(() => { /* Keep the dated fallback rate if the reference service is unavailable. */ });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (location.pathname === '/orders') setView('orders');
    else setView((current) => current === 'orders' ? 'explore' : current);
  }, [location.pathname]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const cartTotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const visibleProducts = useMemo(() => {
    let list = recommendProducts(products, goal, goal ? query : '', budget, exchange.rate);
    if (selectedCategory !== 'all') list = list.filter((product) => product.category === selectedCategory);
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, goal, query, budget, exchange.rate, selectedCategory, sort]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.goalaiToastTimer);
    window.goalaiToastTimer = window.setTimeout(() => setToast(''), 2600);
  };

  const chooseGoal = (nextGoal) => {
    setGoal(nextGoal);
    setQuery(nextGoal.title);
    setSelectedCategory('all');
    setView('explore');
    setMobileNavOpen(false);
    window.setTimeout(() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const openAuth = (pending = '') => {
    setAuthPending(pending);
    setAuthOpen(true);
    setProfileOpen(false);
  };

  const addToCart = (product) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) return current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { product, quantity: 1 }];
    });
    notify('Added to your plan');
  };

  const buyNow = (product) => {
    addToCart(product);
    if (!user) openAuth('checkout');
    else setCheckoutOpen(true);
  };

  const changeQuantity = (productId, delta) => {
    setCart((current) => current
      .map((line) => line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line)
      .filter((line) => line.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((line) => line.product.id !== productId));
    notify('Removed from your plan');
  };

  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    setWishlist((current) => exists ? current.filter((item) => item.id !== product.id) : [...current, product]);
    if (exists) notify('Removed from wishlist');
    else {
      notify('Saved to your wishlist');
      if (!user) openAuth('wishlist');
    }
  };

  const toggleCompare = (product) => {
    const exists = compared.some((item) => item.id === product.id);
    if (exists) setCompared((current) => current.filter((item) => item.id !== product.id));
    else if (compared.length >= 3) notify('Compare up to 3 products at a time');
    else setCompared((current) => [...current, product]);
  };

  const finishAuth = (profile) => {
    setUser(profile);
    setAuthOpen(false);
    if (authPending === 'checkout') setCheckoutOpen(true);
    if (authPending === 'wishlist') notify('Your wishlist is saved on this device');
    setAuthPending('');
  };

  const placeDemoOrder = (details) => {
    const placedOrder = createDemoOrder({ cart, total: cartTotal, exchangeRate: exchange.rate, details });
    setOrder(placedOrder);
    setOrders((current) => [placedOrder, ...current]);
    setCart([]);
    setCheckoutOpen(false);
    setOrderOpenState(true);
  };

  const [orderOpen, setOrderOpenState] = useState(false);

  const goTo = (nextView) => {
    setView(nextView);
    if (nextView === 'orders') navigate('/orders');
    else if (location.pathname === '/orders') navigate('/', { replace: true });
    setMobileNavOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navAnchor = (id) => {
    setView('explore');
    if (location.pathname === '/orders') navigate('/', { replace: true });
    setMobileNavOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const updateOrderStatus = (orderId, status) => {
    const currentOrder = orders.find((item) => item.id === orderId);
    if (!currentOrder || !canAdvanceOrderStatus(currentOrder.status, status)) return;
    setOrders((current) => current.map((item) => item.id === orderId && canAdvanceOrderStatus(item.status, status)
      ? { ...item, status, updatedAt: new Date().toISOString() }
      : item));
    notify('Demo tracking status updated');
  };

  const cancelDemoOrder = (orderId) => {
    setOrders((current) => current.map((item) => item.id === orderId && item.status === 'processing'
      ? { ...item, status: 'cancelled', updatedAt: new Date().toISOString() }
      : item));
  };

  const reorderOrder = (pastOrder) => {
    setCart((current) => {
      const next = [...current];
      pastOrder.items.forEach(({ product, quantity }) => {
        const index = next.findIndex((line) => line.product.id === product.id);
        if (index >= 0) next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        else next.push({ product, quantity });
      });
      return next;
    });
    notify('Past order added to your plan');
    goTo('cart');
  };

  const downloadOrderInvoice = (pastOrder) => {
    downloadInvoice(pastOrder);
    notify('Your demo invoice was downloaded');
  };

  const productHandlers = {
    wished: (product) => wishlist.some((item) => item.id === product.id),
    compared: (product) => compared.some((item) => item.id === product.id),
  };

  return (
    <div className="app-shell">
      <div className="announcement-bar"><Sparkles size={13} /> Less scrolling. More “that’s exactly what I needed.” <span>Meet your goal-first shopping guide</span></div>
      <header className="site-header">
        <div className="header-inner">
          <div onClick={() => goTo('explore')}><Brand /></div>
          <nav className={`main-nav ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <button className={view === 'explore' ? 'nav-link is-active' : 'nav-link'} onClick={() => goTo('explore')}>Explore</button>
            <button className="nav-link" onClick={() => navAnchor('about')}>About</button>
            <button className="nav-link" onClick={() => navAnchor('contact')}>Contact</button>
            <span className="nav-mobile-actions">
              <button className="nav-link" onClick={() => goTo('wishlist')}><Heart size={16} /> Wishlist</button>
              <button className="nav-link" onClick={() => goTo('cart')}><ShoppingBag size={16} /> Cart <span className="mobile-count">{cartCount}</span></button>
              {!user && <button className="nav-link" onClick={() => openAuth()}><UserRound size={16} /> Sign in</button>}
            </span>
          </nav>
          <div className="header-actions">
            <button className="header-icon-link" onClick={() => goTo('wishlist')} aria-label={`Wishlist, ${wishlist.length} saved`}><Heart size={18} /><span>Wishlist</span>{wishlist.length > 0 && <b className="count-badge">{wishlist.length}</b>}</button>
            <button className="header-icon-link cart-link" onClick={() => goTo('cart')} aria-label={`Cart, ${cartCount} items`}><ShoppingBag size={18} /><span>Cart</span><b className="count-badge">{cartCount}</b></button>
            {user ? (
              <div className="profile-wrap">
                <button className="profile-button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} aria-label="Open profile menu"><span>{(user.name || user.email || 'G').slice(0, 1).toUpperCase()}</span><ChevronDown size={14} /></button>
                {profileOpen && <div className="profile-menu"><div className="profile-greeting">Shopping with intention</div><strong>{user.name || user.email}</strong><button onClick={() => goTo('orders')}><ClipboardList size={15} /> My Orders</button><button onClick={() => goTo('wishlist')}><Heart size={15} /> Saved picks</button><button onClick={() => goTo('cart')}><ShoppingBag size={15} /> Your plan</button><button onClick={() => { setUser(null); setProfileOpen(false); notify('Signed out on this device'); }}><X size={15} /> Sign out</button></div>}
              </div>
            ) : <button className="signin-button" onClick={() => openAuth()}>Sign in <ArrowUpRight size={15} /></button>}
          </div>
          <button className="mobile-menu-button" onClick={() => setMobileNavOpen((value) => !value)} aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}>{mobileNavOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </header>

      {view === 'explore' && (
        <main>
          <section className="hero-section">
            <div className="hero-backdrop hero-backdrop--one" /><div className="hero-backdrop hero-backdrop--two" />
            <div className="hero-content">
              <div className="eyebrow"><span className="eyebrow-line" /> SHOP BY OUTCOME <span className="eyebrow-dot">●</span> NOT BY AISLE</div>
              <h1>What are you<br />working <em>toward?</em></h1>
              <p className="hero-copy">Tell us the life you’re building. We’ll help you find a few good things to get you there.</p>
              <GoalSearch products={products} query={query} onQuery={setQuery} onSelectGoal={chooseGoal} onSelectProduct={setSelectedProduct} activeGoal={goal} />
              <div className="hero-footnote"><span><span className="status-dot" /> Goal matching is ready</span><span>Free to explore. No account needed.</span></div>
            </div>
            <div className="hero-visual" aria-label="A selection of products for everyday goals">
              <div className="hero-orbit hero-orbit--outer" /><div className="hero-orbit hero-orbit--inner" />
              <div className="hero-star">✳</div><div className="hero-note"><span>YOUR NEXT CHAPTER</span><strong>starts with one<br />good choice.</strong><span className="hero-note-arrow"><ArrowDown size={15} /></span></div>
              <div className="hero-product hero-product--large">
                {products[0] && <img src={products[0].image} alt={products[0].title} />}
                <span className="hero-product-label">A better everyday</span>
              </div>
              <div className="hero-product hero-product--small">
                {products[1] && <img src={products[1].image} alt={products[1].title} />}
                <span className="hero-product-label">Picked for you</span>
              </div>
              <div className="hero-caption"><Sparkles size={15} /> Curated around your goal</div>
            </div>
            <div className="hero-side-note">GOOD THINGS, WITH A REASON <span>↗</span></div>
          </section>

          <section className="goals-section section-wrap" id="explore-goals">
            <div className="section-heading section-heading--split">
              <div><div className="eyebrow"><span className="eyebrow-line" /> FIND YOUR STARTING POINT</div><h2>A goal looks good<br /><em>on you.</em></h2></div>
              <p className="section-intro">Choose a direction or start typing your own. There’s no wrong way to begin.</p>
            </div>
            <div className="goal-grid">
              {GOALS.map((item, index) => <GoalCard key={item.id} goal={item} index={index} active={goal?.id === item.id} onClick={chooseGoal} />)}
            </div>
            <div className="goal-section-foot"><span><span className="step-dot">01</span> A little clarity goes a long way.</span><button className="text-link" onClick={() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' })}>Browse the edit <ArrowDown size={15} /></button></div>
          </section>

          <section className="recommendations-section" id="recommendations">
            <div className="section-wrap">
              <div className="recommendation-topline"><div className="eyebrow"><span className="eyebrow-line" /> {goal ? 'YOUR GOAL, THOUGHTFULLY MATCHED' : 'THE GOALAI EDIT'}</div><span className="live-note" title="Indicative mid-market reference rate, not a payment quote"><span className="status-dot" /> {exchange.source} · 1 USD ≈ ₹{exchange.rate.toFixed(2)} · {exchange.date}</span></div>
              <div className="results-heading-row">
                <div><h2>{goal ? <>A few good picks for<br /><em>{goal.shortTitle.toLowerCase()}.</em></> : <>Start with something<br /><em>that feels right.</em></>}</h2><p>{goal ? goal.description : 'Real sample catalog items. Sorted around your goals, not just what’s trending.'}</p></div>
                <div className="results-controls">
                  <label className="budget-control"><span>Under <strong>{formatINR(budget)}</strong></span><input type="range" min="500" max="100000" step="500" value={budget} onChange={(event) => setBudget(Number(event.target.value))} aria-label="Maximum product price in Indian rupees" /></label>
                  <label className="sort-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="match">Best match</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
                </div>
              </div>
              <div className="category-row">
                <button className={`category-chip ${selectedCategory === 'all' ? 'is-active' : ''}`} onClick={() => setSelectedCategory('all')}>All picks</button>
                {categories.map((category) => <button key={category} className={`category-chip ${selectedCategory === category ? 'is-active' : ''}`} onClick={() => setSelectedCategory(category)}>{formatCategory(category)}</button>)}
              </div>

              {catalogStatus === 'loading' && <div className="catalog-message"><span className="loader" /> Finding the right things for the life you’re building…</div>}
              {catalogStatus === 'error' && <div className="catalog-error"><div><strong>We lost the thread.</strong><span>{catalogError}</span></div><button className="button button--dark button--small" onClick={loadCatalog}><RefreshCw size={15} /> Try again</button></div>}
              {catalogStatus === 'ready' && visibleProducts.length === 0 && <div className="catalog-message catalog-message--empty">No picks under {formatINR(budget)} in this category. Try a wider budget or another category.</div>}
              {catalogStatus === 'ready' && visibleProducts.length > 0 && <div className="product-grid">{visibleProducts.slice(0, showAllProducts ? visibleProducts.length : 8).map((product) => <ProductCard key={product.id} product={product} exchangeRate={exchange.rate} wished={productHandlers.wished(product)} compared={productHandlers.compared(product)} onWishlist={toggleWishlist} onCompare={toggleCompare} onDetails={setSelectedProduct} onAdd={addToCart} onBuy={buyNow} />)}</div>}
              {catalogStatus === 'ready' && visibleProducts.length > 8 && <div className="more-products"><span>{showAllProducts ? `Showing all ${visibleProducts.length} picks` : `Showing 8 of ${visibleProducts.length} picks`}</span><button className="button button--light" onClick={() => setShowAllProducts((value) => !value)}>{showAllProducts ? 'Show fewer' : `See all ${visibleProducts.length} picks`} {showAllProducts ? <Minus size={16} /> : <ArrowRight size={16} />}</button></div>}
              {compared.length > 0 && <div className="compare-tray"><div className="compare-tray-copy"><span className="compare-tray-icon"><Scale size={17} /></span><span><strong>{compared.length} / 3 compared</strong><small>Good choices are easier side by side.</small></span></div><div className="compare-thumbs">{compared.map((item) => <img key={item.id} src={item.image} alt={item.title} />)}</div><button className="button button--dark button--small" onClick={() => setCompareOpen(true)} disabled={compared.length < 2}>Compare picks <ArrowRight size={15} /></button><button className="tray-close" aria-label="Clear comparison" onClick={() => setCompared([])}><X size={17} /></button></div>}
            </div>
          </section>

          <section className="manifesto-section" id="about">
            <div className="manifesto-mark"><span className="brand-mark brand-mark--large"><span /></span><span className="manifesto-orbit" /></div>
            <div className="manifesto-copy"><div className="eyebrow"><span className="eyebrow-line" /> THE GOALAI WAY</div><h2>Less “what’s popular?”<br />More <em>“what’s next for me?”</em></h2><p>GoalAI starts with the person you’re becoming. We turn a big intention into a few useful, thoughtful picks—so every purchase has somewhere to go.</p><button className="text-link" onClick={() => navAnchor('contact')}>A question or an idea? <ArrowUpRight size={15} /></button></div>
            <div className="manifesto-stamp"><span>SHOP</span><span>WITH</span><strong>INTENT</strong><span className="stamp-star">✳</span></div>
          </section>

          <section className="contact-section section-wrap" id="contact">
            <div className="contact-heading"><div className="eyebrow"><span className="eyebrow-line" /> A HUMAN ON THE OTHER SIDE</div><h2>We’re all <em>ears.</em></h2><p>Tell us what you’re working toward, what felt useful, or what we could do better.</p></div>
            <form className="contact-form" onSubmit={(event) => { event.preventDefault(); setContactSent(true); }}>
              <label>Your email<input required type="email" placeholder="you@example.com" /></label>
              <label>Your note<textarea required rows="3" placeholder="I’m working toward…" /></label>
              <div className="contact-form-bottom"><span aria-live="polite">{contactSent ? 'No message was sent; this form is a prototype.' : 'Prototype only: this form does not send messages.'}</span><button className="button button--dark" type="submit">{contactSent ? 'Not sent — demo only' : 'Try demo form'} {contactSent ? <X size={16} /> : <ArrowUpRight size={16} />}</button></div>
            </form>
          </section>
        </main>
      )}

      {view === 'orders' && <OrdersPage orders={orders} exchangeRate={exchange.rate} onGoExplore={() => goTo('explore')} onStatusChange={updateOrderStatus} onCancelOrder={cancelDemoOrder} onReorder={reorderOrder} onDownloadInvoice={downloadOrderInvoice} notify={notify} />}

      {view === 'cart' && (
        <main className="page-main section-wrap">
          <div className="page-kicker"><button className="text-link" onClick={() => goTo('explore')}><ArrowRight className="back-arrow" size={15} /> Back to exploring</button><span>YOUR PLAN / 01</span></div>
          <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> A CLEARER NEXT STEP</div><h1>Your <em>plan.</em></h1><p>Every good goal starts with a few good picks.</p></div><span className="page-title-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span></div>
          {cart.length === 0 ? <EmptyState title="Your plan is a blank page." copy="Find something that moves you closer to what you want." onClick={() => goTo('explore')} /> : (
            <div className="cart-layout"><div className="cart-lines">{cart.map(({ product, quantity }) => <article className="cart-line" key={product.id}><button className="cart-line-image" onClick={() => setSelectedProduct(product)}><img src={product.image} alt={product.title} /></button><div className="cart-line-details"><span className="product-category">{formatCategory(product.category)}</span><button className="cart-line-title" onClick={() => setSelectedProduct(product)}>{product.title}</button><button className="remove-line" onClick={() => removeFromCart(product.id)}><Trash2 size={14} /> Remove</button></div><div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label="Increase quantity"><Plus size={14} /></button></div><strong className="cart-line-price">{currency(product.price * quantity, exchange.rate)}</strong></article>)}</div><aside className="order-summary"><div className="eyebrow"><span className="eyebrow-line" /> THE WHOLE PICTURE</div><h3>Plan summary</h3><div className="summary-line"><span>Items ({cartCount})</span><strong>{currency(cartTotal, exchange.rate)}</strong></div><div className="summary-line"><span>Shipping</span><strong>Calculated later</strong></div><div className="summary-divider" /><div className="summary-line summary-total"><span>Estimated total</span><strong>{currency(cartTotal, exchange.rate)}</strong></div><p className="summary-note">Sample prices converted from USD at the displayed reference rate. No payment will be taken in this prototype.</p><button className="button button--lime button--wide" onClick={() => user ? setCheckoutOpen(true) : openAuth('checkout')}>Continue to checkout <ArrowRight size={17} /></button><div className="secure-note"><CircleHelp size={14} /> Sign in is only needed when you’re ready to continue.</div></aside></div>
          )}
        </main>
      )}

      {view === 'wishlist' && (
        <main className="page-main section-wrap">
          <div className="page-kicker"><button className="text-link" onClick={() => goTo('explore')}><ArrowRight className="back-arrow" size={15} /> Back to exploring</button><span>THE KEEPS / 02</span></div>
          <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> SAVED WITH INTENTION</div><h1>Your <em>keeps.</em></h1><p>Good finds, held for the right moment.</p></div><span className="page-title-count">{wishlist.length} saved</span></div>
          {wishlist.length === 0 ? <EmptyState icon={Heart} title="Nothing saved just yet." copy="Tap the heart on anything that feels right. We’ll keep it here." onClick={() => goTo('explore')} /> : <div className="product-grid product-grid--wishlist">{wishlist.map((product) => <ProductCard key={product.id} product={product} exchangeRate={exchange.rate} wished compared={productHandlers.compared(product)} onWishlist={toggleWishlist} onCompare={toggleCompare} onDetails={setSelectedProduct} onAdd={addToCart} onBuy={buyNow} />)}</div>}
        </main>
      )}

      <footer className="site-footer"><div className="footer-main"><div><div onClick={() => goTo('explore')}><Brand /></div><p>Good things, with a reason.</p></div><div className="footer-links"><button onClick={() => goTo('explore')}>Explore</button><button onClick={() => goTo('cart')}>Your plan</button><button onClick={() => navAnchor('about')}>About GoalAI</button><button onClick={() => navAnchor('contact')}>Contact</button></div><div className="footer-signoff"><span>MADE FOR WHAT’S NEXT</span><span className="footer-star">✳</span></div></div><div className="footer-bottom"><span>© 2026 GoalAI. Shopping that starts with you.</span><span>Catalog by Fake Store API · Demo experience</span></div></footer>

      {selectedProduct && <Modals.ProductModal product={selectedProduct} exchangeRate={exchange.rate} wished={productHandlers.wished(selectedProduct)} onClose={() => setSelectedProduct(null)} onWishlist={toggleWishlist} onAdd={(product) => { addToCart(product); setSelectedProduct(null); }} onBuy={(product) => { setSelectedProduct(null); buyNow(product); }} />}
      {authOpen && <Modals.AuthModal onClose={() => { setAuthOpen(false); setAuthPending(''); }} onSuccess={finishAuth} />}
      {checkoutOpen && <Modals.CheckoutModal cart={cart} total={cartTotal} exchangeRate={exchange.rate} user={user} onClose={() => setCheckoutOpen(false)} onSubmit={placeDemoOrder} />}
      {compareOpen && <Modals.CompareModal products={compared} exchangeRate={exchange.rate} onClose={() => setCompareOpen(false)} onRemove={toggleCompare} />}
      {orderOpen && order && <Modals.OrderModal order={order} exchangeRate={order.exchangeRate} onClose={() => { setOrderOpenState(false); setOrder(null); goTo('explore'); }} />}
      {toast && <div className="toast" role="status"><span><Check size={15} /></span>{toast}</div>}
      <button className="help-button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowDown size={17} /></button>
    </div>
  );
}
