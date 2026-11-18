# GoalAI implementation plan

## Product and implementation approach

Build a responsive, frontend-first React storefront that makes shopping goal-led. The primary journey starts with a natural-language goal prompt; suggestions update as the user types, and selecting a goal opens a curated results view. The product catalog will load from the user's Fake Store API at `https://fakestoreapi.com`. The client will request products and categories, normalize the catalog, and match products to goal intent using lightweight local rules and category/product text, so no AI provider key or server is required for this demo. Fake Store API prices are USD; display them in INR by converting with the Frankfurter USD/INR reference rate. Show the rate and date, retain a dated fallback if the rate service is unavailable, and apply the INR conversion consistently to cards, details, comparison, cart, checkout, order confirmation, and budget filtering. Loading, empty, and error states will keep the experience usable when the APIs are slow or unavailable.

The journey will support product details, comparison, budget filtering, wishlist toggles, quantity changes, add/remove, cart summary, and an in-app checkout flow. Because this request is for a frontend application and Fake Store API supplies sample catalog data rather than a real payment service, checkout will be a clearly labeled demo flow: it will collect mock checkout details, show an in-app order confirmation, and never redirect to an external store or charge a card. Sign-in/sign-up will be introduced only when the visitor wants to save or checkout; demo session, cart, wishlist, and active goal will persist in localStorage through the auth dialog. This is frontend demo authentication, not a secure production identity service.

## Project structure

- `src/main.jsx`: React application bootstrap.
- `src/App.jsx`: application shell, navigation, goal discovery and route-like view state.
- `src/components/`: reusable navigation, search suggestions, goal cards, product cards/detail, compare tray, cart, wishlist, auth and checkout dialogs.
- `src/hooks/`: catalog data loading and local persistence hooks.
- `src/lib/`: Fake Store API and exchange-rate clients, INR formatting/conversion, product normalization and goal-to-product matching helpers.
- `src/styles/`: global tokens, responsive layout and component styles.
- `public/site-routes.json`: static route manifest for the single-page `/` application.
- `index.html`, `package.json`, and `vite.config.js`: React/Vite entry and scripts.

## Design direction

Three possible styles (tail-probability options):
- New-wave editorial commerce — 0.07
- Soft 3D wellness storefront — 0.04
- Neo-brutalist product lab — 0.08

Chosen: **New-wave editorial commerce**, with clear goal-led hierarchy and warm, confident product imagery.

- **Design Movement:** Contemporary editorial commerce with the compositional restraint of independent lifestyle magazines and the clarity of a modern product studio.
- **Core Principles:** Keep the user's aspiration more prominent than product taxonomy; use deliberate visual rhythm rather than a wall of cards; make price and selection state immediately legible; keep every shopping action reversible.
- **Color Philosophy:** Warm ivory and deep evergreen provide a calm canvas, while bright chartreuse marks active goals and high-confidence actions. Muted lavender and pale peach distinguish supporting categories without competing with the products.
- **Layout Paradigm:** Asymmetric magazine-like composition: a broad left-aligned goal search and editorial hero, a horizontal set of goal paths, then a staggered catalog with a persistent compare/cart rail on wide screens. Collapse into a single scrolling column with a compact mobile navigation on narrow screens.
- **Signature Elements:** A chartreuse goal-orbit motif around the search affordance; numbered goal cards with an oversized step numeral; small rounded recommendation badges that explain why a product fits.
- **Interaction Philosophy:** Typing surfaces useful choices immediately; selecting a goal reveals the “why” behind product suggestions; add/remove and compare actions have visible feedback and never interrupt exploration. Auth appears only at save or checkout intent.
- **Animation:** A restrained drifting background glow and orbit accent; suggestion list fades/slides in; goal cards lift slightly on hover; cart and wishlist counters animate briefly on change. Respect `prefers-reduced-motion` and keep motion short and low-amplitude.
- **Typography System:** Use a crisp sans family such as DM Sans for interface and a high-contrast editorial serif such as Fraunces for display headlines. Use a small, consistent scale: large editorial title, medium section title, compact labels, and readable product metadata.
- **Brand Essence:** A goal-first shopping guide for people buying toward a life change, not merely browsing a category. Personality: thoughtful, optimistic, capable.
- **Brand Voice:** Short, specific, encouraging language that speaks to outcomes rather than products. Examples: “Make room for the routine you want.” “A few good picks. One clear next step.”
- **Wordmark & Logo:** A custom CSS/SVG wordmark with a compact four-point “north-star” mark nested in a rounded goal-ring, followed by a strongly weighted “Goal” and lighter “AI”; do not use a default text-only logo.
- **Signature Brand Color:** Electric chartreuse `#D7F26B`, reserved for goal selection, key focus states and primary calls to action.

## Frontend and serving

Use React with Vite and plain JavaScript/CSS, matching the requested HTML/CSS/JS/React stack. Keep data fetching in a small `fetch`-based API module and avoid adding an unnecessary backend. Expose the root route and a valid `site-routes.json` before starting the dev server; use the initialized project's configured preview port. The catalog is live sample data; account, cart, wishlist and checkout confirmation are browser-local demo state. Real authentication, payment processing, inventory guarantees, and durable orders are outside the frontend-only Fake Store API prototype and would require an approved backend/payment integration.
