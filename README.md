# GoalAI

GoalAI is a responsive, goal-first shopping frontend built with React, Vite, JavaScript, and CSS. It uses the public Fake Store API catalog at `https://fakestoreapi.com` and matches sample products to a user's goal in the browser. API prices are supplied in USD and displayed in INR, converted with the dated USD/INR reference rate from Frankfurter. The interface shows the rate date; if the rate service is unavailable, it uses the documented fallback rate.

## Run locally

```bash
pnpm install
pnpm dev
```

The Vite development server listens on port `3000`. Create a production bundle with `pnpm build`.

## Prototype behavior

Goal suggestions and product matching are client-side heuristics, not a live LLM service. The catalog is sample data. Demo sign-in, cart, wishlist, active goal, and My Orders history are stored in browser localStorage. Completing demo checkout creates a browser-local mock order record so the My Orders page can demonstrate tracking; it does not create a real order, collect card details, charge a payment method, or arrange fulfillment. The contact form is a presentation-only interaction and does not send messages.

## My Orders demo

Open [`/orders`](http://localhost:3000/orders) or choose **My Orders** from the signed-in profile menu. The page includes sample orders, status summaries and filters, order search/details, simulated tracking updates, confirmation-based cancellation of eligible demo orders, and reorder-to-cart. **Download invoice** creates a printable HTML file in the browser; it is a demo document, not a tax invoice or proof of payment. All order updates remain on this browser/device in the `goalai-orders` localStorage key.
