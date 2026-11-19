import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ClipboardList, CreditCard,
  Download, MapPin, PackageCheck, RotateCcw, Search, ShieldCheck, Truck, X,
} from 'lucide-react';
import { formatCategory } from '../lib/recommendations.js';
import { formatINR, usdToInr } from '../lib/currency.js';
import {
  ORDER_FILTERS, TRACKING_STEPS,
  filterOrders, getForwardOrderStatuses, getOrderStatusLabel, getOrderSummary, getTrackingIndex,
} from '../lib/orders.js';

function dateLabel(value) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function money(amountUsd, order, exchangeRate) {
  return formatINR(usdToInr(amountUsd, Number(order.exchangeRate) || exchangeRate));
}

function StatusPill({ status }) {
  return <span className={`order-status order-status--${status.replaceAll('_', '-')}`}>{getOrderStatusLabel(status)}</span>;
}

function OrderItems({ order, exchangeRate, compact = false }) {
  return (
    <div className={`order-items ${compact ? 'order-items--compact' : ''}`}>
      {order.items.map(({ product, quantity }) => (
        <div className="order-item" key={product.id}>
          <div className="order-item-image"><img src={product.image} alt={product.title} loading="lazy" /></div>
          <div className="order-item-copy">
            <strong>{product.title}</strong>
            <small>{formatCategory(product.category)} · Qty {quantity} · {money(product.price, order, exchangeRate)} each</small>
          </div>
          <b>{money(product.price * quantity, order, exchangeRate)}</b>
        </div>
      ))}
    </div>
  );
}

function TrackingTimeline({ status }) {
  const currentIndex = getTrackingIndex(status);
  return (
    <ol className={`tracking-timeline ${status === 'cancelled' ? 'tracking-timeline--cancelled' : ''}`}>
      {TRACKING_STEPS.map((step, index) => {
        const isComplete = status === 'delivered' || index < currentIndex;
        const isCancelled = status === 'cancelled' && index === currentIndex;
        const state = isCancelled ? 'cancelled' : isComplete ? 'complete' : index === currentIndex ? 'current' : 'pending';
        return (
          <li className={`tracking-step tracking-step--${state}`} key={step.id}>
            <span className="tracking-marker">{isComplete ? <Check size={13} /> : isCancelled ? <X size={13} /> : index + 1}</span>
            <span className="tracking-copy"><strong>{step.label}</strong><small>{isCancelled ? 'Order cancelled before shipping.' : step.note}</small></span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetails({ order, exchangeRate, onBack, onStatusChange, onReorder, onDownloadInvoice, onAskCancel }) {
  const canCancel = order.status === 'processing';
  const forwardStatuses = getForwardOrderStatuses(order.status);
  return (
    <section className="order-details-view" aria-label={`Details for order ${order.id}`}>
      <div className="order-details-heading">
        <button className="text-link" onClick={onBack}><ArrowLeft size={15} /> Back to all orders</button>
        <StatusPill status={order.status} />
      </div>
      <div className="order-detail-title-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> ORDER DETAILS</div><h2>{order.id}</h2><p>Placed {dateLabel(order.orderDate)}</p></div>
        <div className="order-detail-actions">
          <button className="button button--light" onClick={() => onDownloadInvoice(order)}><Download size={15} /> Download invoice</button>
          <button className="button button--light" onClick={() => onReorder(order)}><RotateCcw size={15} /> Reorder</button>
          {canCancel && <button className="button button--cancel" onClick={() => onAskCancel(order)}><X size={15} /> Cancel order</button>}
        </div>
      </div>
      <div className="order-detail-layout">
        <div className="order-detail-main">
          <section className="order-panel tracking-panel">
            <div className="order-panel-heading">
              <div><div className="eyebrow"><span className="eyebrow-line" /> TRACKING</div><h3>Your order, step by step.</h3></div>
              <label className="status-simulator">
                <span>Demo status</span>
                <select aria-label="Simulate order status" value={order.status} disabled={order.status === 'cancelled' || order.status === 'delivered'} onChange={(event) => onStatusChange(order.id, event.target.value)}>
                  <option value={order.status}>{getOrderStatusLabel(order.status)}</option>
                  {forwardStatuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>
            {order.status === 'cancelled' && <p className="order-cancelled-note">This demo order was cancelled on {dateLabel(order.updatedAt || order.orderDate)}.</p>}
            <TrackingTimeline status={order.status} />
          </section>
          <section className="order-panel">
            <div className="order-panel-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> WHAT’S IN THE ORDER</div><h3>Purchased products</h3></div><span className="order-item-count">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
            <OrderItems order={order} exchangeRate={exchangeRate} />
            <div className="order-detail-total"><span>Order total</span><strong>{money(order.total, order, exchangeRate)}</strong></div>
          </section>
        </div>
        <aside className="order-detail-aside">
          <section className="order-panel order-facts-panel"><div className="eyebrow"><span className="eyebrow-line" /> ORDER INFORMATION</div><div className="order-fact"><CalendarDays size={16} /><span><small>Expected delivery</small><strong>{dateLabel(order.expectedDeliveryDate)}</strong></span></div><div className="order-fact"><MapPin size={16} /><span><small>Shipping address</small><strong>{order.name}<br />{order.shippingAddress}</strong></span></div><div className="order-fact"><CreditCard size={16} /><span><small>Payment method</small><strong>{order.paymentMethod}</strong></span></div><div className="order-fact"><ShieldCheck size={16} /><span><small>Order type</small><strong>Frontend demo · no payment taken</strong></span></div></section>
          <section className="order-panel order-aside-total"><span>Order total</span><strong>{money(order.total, order, exchangeRate)}</strong><small>Indicative INR conversion at ₹{(Number(order.exchangeRate) || exchangeRate).toFixed(2)} per USD.</small></section>
        </aside>
      </div>
    </section>
  );
}

export default function OrdersPage({ orders, exchangeRate, onGoExplore, onStatusChange, onCancelOrder, onReorder, onDownloadInvoice, notify }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const summary = getOrderSummary(orders);
  const visibleOrders = useMemo(() => filterOrders(orders, filter, query), [orders, filter, query]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const summaryCards = [
    { label: 'Total Orders', value: summary.totalOrders, icon: ClipboardList, tone: 'total' },
    { label: 'Processing', value: summary.processing, icon: PackageCheck, tone: 'processing' },
    { label: 'Shipped', value: summary.shipped, icon: Truck, tone: 'shipped' },
    { label: 'Delivered', value: summary.delivered, icon: Check, tone: 'delivered' },
    { label: 'Cancelled', value: summary.cancelled, icon: X, tone: 'cancelled' },
  ];

  const confirmCancel = () => {
    if (!cancelTarget || cancelTarget.status !== 'processing') return;
    onCancelOrder(cancelTarget.id);
    notify(`Order ${cancelTarget.id} cancelled in this demo`);
    setCancelTarget(null);
  };

  return (
    <main className="page-main section-wrap orders-page">
      <div className="page-kicker"><button className="text-link" onClick={onGoExplore}><ArrowLeft size={15} /> Back to exploring</button><span>YOUR JOURNEY / ORDERS</span></div>
      <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR SHOPPING, IN ONE PLACE</div><h1>My <em>orders.</em></h1><p>A clear view of what’s on its way and what’s already arrived.</p></div><span className="page-title-count">{summary.totalOrders} {summary.totalOrders === 1 ? 'order' : 'orders'}</span></div>
      <section className="order-summary-grid" aria-label="Order summary">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => <article className={`order-summary-card order-summary-card--${tone}`} key={label}><span className="order-summary-icon"><Icon size={16} /></span><span className="order-summary-label">{label}</span><strong>{value}</strong></article>)}
      </section>
      {selectedOrder ? (
        <OrderDetails order={selectedOrder} exchangeRate={exchangeRate} onBack={() => setSelectedOrderId(null)} onStatusChange={onStatusChange} onReorder={onReorder} onDownloadInvoice={onDownloadInvoice} onAskCancel={setCancelTarget} />
      ) : (
        <>
          <div className="orders-toolbar"><div className="orders-filter-list" role="group" aria-label="Filter orders">{ORDER_FILTERS.map((item) => <button className={`orders-filter ${filter === item.id ? 'is-active' : ''}`} aria-pressed={filter === item.id} key={item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{item.id === 'all' ? summary.totalOrders : item.id === 'shipped' ? summary.shipped : summary[item.id]}</span></button>)}</div><label className="orders-search"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order ID or product…" aria-label="Search order ID or product name" /></label></div>
          {visibleOrders.length > 0 ? <div className="orders-list">{visibleOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header"><div><span className="order-card-kicker">ORDER</span><strong>{order.id}</strong></div><div className="order-card-date"><span>Placed</span><strong>{dateLabel(order.orderDate)}</strong></div><StatusPill status={order.status} /></div>
              <OrderItems order={order} exchangeRate={exchangeRate} compact />
              <div className="order-card-footer"><div className="order-card-delivery"><CalendarDays size={15} /><span><small>Expected delivery</small><strong>{dateLabel(order.expectedDeliveryDate)}</strong></span></div><div className="order-card-total"><small>Order total</small><strong>{money(order.total, order, exchangeRate)}</strong></div><div className="order-card-actions"><button className="button button--dark button--small" onClick={() => setSelectedOrderId(order.id)}>View details <ArrowRight size={14} /></button><button className="button button--light button--small" onClick={() => onReorder(order)}><RotateCcw size={14} /> Reorder</button><button className="order-icon-action" aria-label={`Download invoice for ${order.id}`} title="Download invoice" onClick={() => onDownloadInvoice(order)}><Download size={16} /></button>{order.status === 'processing' && <button className="order-icon-action order-icon-action--cancel" aria-label={`Cancel order ${order.id}`} title="Cancel order" onClick={() => setCancelTarget(order)}><X size={16} /></button>}</div></div>
            </article>
          ))}</div> : orders.length === 0 ? <div className="orders-empty"><span className="orders-empty-mark"><PackageCheck size={23} /></span><h2>No orders yet.</h2><p>Your next thoughtful find will show up here once you complete checkout.</p><button className="button button--dark" onClick={onGoExplore}>Explore good things <ArrowRight size={15} /></button></div> : <div className="orders-empty orders-empty--small"><span className="orders-empty-mark"><Search size={22} /></span><h2>No matches this time.</h2><p>Try another order ID, product name, or status filter.</p><button className="button button--light" onClick={() => { setQuery(''); setFilter('all'); }}>Clear search and filters <X size={15} /></button></div>}
        </>
      )}
      {cancelTarget && <div className="order-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCancelTarget(null)}><section className="order-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cancel-order-title"><span className="order-dialog-icon"><X size={20} /></span><div className="eyebrow"><span className="eyebrow-line" /> DEMO ORDER ACTION</div><h2 id="cancel-order-title">Cancel this order?</h2><p>Order <strong>{cancelTarget.id}</strong> will be marked Cancelled on this device. No payment or shipment is affected.</p><div className="order-dialog-actions"><button className="button button--light" onClick={() => setCancelTarget(null)}>Keep order</button><button className="button button--cancel" onClick={confirmCancel}>Yes, cancel order <X size={15} /></button></div></section></div>}
    </main>
  );
}
