# GoalAI Test Plan

## 1. Scope and test setup

This plan covers the current GoalAI React frontend: goal discovery, Fake Store API catalog loading, USD-to-INR reference conversion, INR-denominated budget filtering, product matching, filters, comparison, wishlist, cart, local demo authentication, demo checkout, navigation, responsive layout, accessibility, and resilience. It does not treat prototype behavior as real commerce. No real accounts, payment capture, message delivery, stock reservation, or durable order processing exist.

**Test targets:** the project Preview and a local development server. Run `pnpm install` once, then `pnpm dev` from the project root. The Vite app uses port `3000`. Confirm `GET /` returns the GoalAI page and `GET /site-routes.json` returns JSON containing the root route.

**Browser coverage:** current Chrome/Edge and Firefox on desktop; Safari/iOS Safari if available; Android Chrome if available. Check desktop at about 1440×900, tablet at 768×1024, and mobile at 390×844 and 320×700. Use a clean browser profile for baseline tests. Repeat persistence tests in the same profile. Clear GoalAI localStorage between clean runs with browser devtools: remove keys `goalai-active-goal`, `goalai-cart`, `goalai-wishlist`, and `goalai-user`.

**Test data:** the live API currently exposes 20 products and four categories (`electronics`, `jewelery`, `men's clothing`, `women's clothing`), but never assume that exact sample count in assertions. Test with returned data. Use the installed product catalog while the API is healthy; use browser network throttling or request blocking to exercise errors.

## 2. Priority legend

- **P0 — Release blocker:** primary journey, data integrity, privacy, or a critical accessibility failure.
- **P1 — Important:** core feature correctness or common viewport behavior.
- **P2 — Quality:** lower-risk edge case or polish.

Record each test as **Pass**, **Fail**, **Blocked**, or **Not run**. For failures, include browser/version, viewport, steps, expected and actual results, console/network errors, and a screenshot if useful. Do not include real passwords or payment data in bug reports.

## 3. Functional test cases

### A. Startup, route manifest, and catalog API

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| START-01 | P0 | Open home route | Open `/`. | GoalAI loads with no blank screen or uncaught runtime error. The page title identifies GoalAI. |
| START-02 | P1 | Static route declaration | Request `/site-routes.json`. | HTTP 200; valid JSON; routes includes `/` and a GoalAI title. It is JSON, not SPA fallback HTML. |
| API-01 | P0 | Load product catalog | Open Explore with network online. | Loading state appears briefly, then products render with title, price, category, image, and available rating. |
| API-02 | P1 | Load categories | Inspect category chips after catalog load. | Category chips derive from the API response; each category filters the displayed product set. |
| API-03 | P1 | Product data fidelity | Compare one product card and details modal to `/products/{id}`. | Title, category, image, description, and rating correspond to the returned API product. The USD API price is converted and displayed in INR using the rate/date shown in the app. |
| FX-01 | P1 | INR price conversion | Compare the app's current `1 USD ≈ ₹rate` label with the returned `/v2/rate/USD/INR` rate, then convert a product price. | Product card and detail price equal API USD price multiplied by the shown rate, formatted as INR. |
| FX-02 | P1 | Price consistency | Add a product to cart and inspect comparison, checkout, and demo receipt. | The same item uses the same displayed INR price in every view, and totals equal converted line prices times quantities. |
| FX-03 | P1 | INR budget filter | Set the maximum budget just below and just above a known converted product price. | Product is excluded below its converted INR price and included at or above it. Budget label and empty-state copy show ₹, not $. |
| FX-04 | P2 | FX service unavailable | Block `api.frankfurter.dev`, reload, and inspect the displayed rate. | App remains usable and labels the dated fallback rate; no price is shown with a false live-rate claim. |
| API-04 | P1 | API timeout/error | Throttle the API beyond the timeout or block `fakestoreapi.com`, then load/retry. | A clear error state and retry action appear. App shell and navigation remain usable. No uncaught promise error or endless spinner. |
| API-05 | P2 | Categories endpoint unavailable | Block only `/products/categories` while `/products` succeeds. | Product catalog still appears and category filters fall back to categories inferred from products. |
| API-06 | P2 | Empty catalog response | Mock `/products` as an empty array. | Empty-state message is shown; page does not crash. |
| API-07 | P2 | Malformed/unexpected product fields | Mock a product with missing rating, description, or category. | The product remains renderable; optional fields are omitted or safely defaulted; no runtime exception. |
| API-08 | P1 | Retry after outage | Start with API blocked, use Retry after restoring connectivity. | Loading state appears and catalog recovers without a full page reload. |

### B. Goal search and recommendations

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| GOAL-01 | P0 | Empty search initial state | Load home and focus search. | No forced registration. Search shows helpful placeholder and the goal cards are visible. |
| GOAL-02 | P0 | Live suggestions | Type `gift` one character at a time. | Suggestions update as text changes and show relevant goal/product suggestions below the search field. |
| GOAL-03 | P1 | Search matches a goal | Type `capsule wardrobe`. Select the matching goal suggestion. | Goal is selected, results heading reflects it, and the page moves to recommendations. |
| GOAL-04 | P1 | Select a goal card | Select each of the four pre-defined goal cards. | Active goal styling updates, query reflects the goal, and product results update. |
| GOAL-05 | P1 | Search matches catalog product | Type a term from a product title/category and select a product suggestion. | The matching product details dialog opens. |
| GOAL-06 | P1 | Enter key selection | Type a query that produces suggestions and press Enter. | The top-ranked suggestion is selected using the same behavior as clicking it. |
| GOAL-07 | P2 | Escape clears query | Enter query and press Escape. | Query clears and suggestion panel closes. |
| GOAL-08 | P1 | Unrecognized free-form goal | Enter a phrase with no keyword match. | No false promise of precise AI interpretation; user can still choose one of the goal cards or browse catalog. No crash. |
| GOAL-09 | P1 | Goal persistence | Select a goal, reload the page. | Selected goal is restored from localStorage and search/results remain coherent. |
| GOAL-10 | P1 | Change selected goal | Choose a second goal after selecting the first. | The new goal replaces the active goal and recommendations are recalculated; cart and wishlist remain intact. |
| GOAL-11 | P2 | Suggestion keyboard navigation | Tab to search, type, Tab through suggestions, activate with Enter. | Interactive suggestions are reachable and activation matches pointer behavior. Verify focus is visible. |

### C. Product discovery, details, filters, and comparison

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| DISC-01 | P0 | Open product detail | Click product image, title, or detail arrow. | Detail dialog displays product image, title, price, category, description, rating when present, and clearly identifies sample listing. |
| DISC-02 | P1 | Close product detail | Close with X; click backdrop; press Escape if supported. | Dialog closes by supported mechanisms; underlying page state is unchanged. (Escape behavior should be checked and recorded as a current gap if not available.) |
| DISC-03 | P1 | Wishlist in details | Toggle heart in product detail. | Wishlist state changes and the confirmation state is visible; dialog remains usable. |
| DISC-04 | P1 | Category filter | Select each category chip and then All picks. | Only matching category products show; All picks restores all matching products. |
| DISC-05 | P1 | Budget filter | Move budget slider to low/high values. | Only products at or below the displayed USD cap remain; empty-result message appears if none qualify. |
| DISC-06 | P1 | Sort by price | Select low-to-high and high-to-low. | Visible product prices are monotonic in the chosen direction. |
| DISC-07 | P1 | Best match sorting | Select Best match with a goal active. | Products are shown in recommendation order. No sorting control causes a page error. |
| DISC-08 | P1 | Expand catalog | When more than eight products match, click “See all … picks.” | All matching products render. Button changes to “Show fewer”; selecting it returns to the first eight. |
| DISC-09 | P1 | Compare two products | Select Compare on two products, open Compare picks. | Comparison displays both items, prices, categories, ratings when available, and descriptions. |
| DISC-10 | P1 | Compare maximum | Select a fourth product after three are selected. | Third-item cap is enforced and a clear notice appears. Existing comparisons remain unchanged. |
| DISC-11 | P1 | Remove comparison item | Remove one product from comparison dialog/tray. | Item is removed from selection and comparison UI; remaining items stay correct. |
| DISC-12 | P2 | Compare one item | Select one product and inspect Compare picks. | Compare action is disabled until at least two items are selected. |
| DISC-13 | P2 | Image loading failure | Block a product image URL. | Layout remains stable; image failure does not prevent other product actions. Record if a fallback image is needed. |

### D. Wishlist

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| WISH-01 | P0 | Save item from card | Toggle a product heart. | Heart state and wishlist count update; product appears on Wishlist page. |
| WISH-02 | P1 | Remove item from card | Toggle heart on a saved product. | Product is removed from wishlist and count updates. |
| WISH-03 | P1 | Wishlist page empty state | Clear wishlist and open Wishlist. | Empty state and Explore action appear. |
| WISH-04 | P1 | Wishlist persistence | Save items, reload, open Wishlist. | Saved products persist with their catalog details. |
| WISH-05 | P1 | Add saved item to plan | From Wishlist, add product to cart. | Cart count and cart line update; product remains saved unless explicitly unsaved. |
| WISH-06 | P1 | Deferred sign-in from wishlist | Signed out: save a product. | Save works before auth. Sign-in prompt is introduced only at save intent. Product and goal remain saved when completing demo sign-in or closing the dialog. |
| WISH-07 | P2 | Duplicate save | Toggle a saved product repeatedly. | Only one copy exists in wishlist; count reflects unique products. |

### E. Cart, quantities, totals, and Buy Now

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| CART-01 | P0 | Add product | Click Add to plan on a product. | Cart count increments and visible confirmation appears. |
| CART-02 | P1 | Add same product twice | Add the same product twice. | One cart line remains with quantity 2; count and line total reflect quantity. |
| CART-03 | P0 | Cart totals | Add two different products, one with quantity >1. | Each line shows `price × quantity`; item count and estimated total are mathematically correct. |
| CART-04 | P1 | Change quantity | Increase and decrease quantity in cart. | Quantity, item count, line price, and total update correctly. |
| CART-05 | P1 | Remove item | Remove a cart line. | Item disappears and count/total update. Removing last item restores cart empty state. |
| CART-06 | P1 | Cart persistence | Add products, reload, open Cart. | Items and quantities persist. |
| CART-07 | P1 | Buy Now while signed out | Click Buy now on a product. | Product is added to cart, auth appears only at purchase intent, and selected product/cart/goal are preserved. |
| CART-08 | P1 | Buy Now while signed in | Sign in via demo and click Buy now. | Product is added once and checkout opens. Check for duplicates if the same product was already in cart. |
| CART-09 | P1 | Navigation count | Add/remove items and inspect header/cart count on desktop and mobile. | Count stays in sync with quantities across navigation layouts. |
| CART-10 | P2 | Storage unavailable | Disable localStorage or simulate quota error. | App remains usable for the session; persistence failure does not crash UI. |

### F. Demo authentication and state preservation

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| AUTH-01 | P0 | Sign-in visibility before login | Clear local user state and load app. | Sign In appears in desktop navigation; mobile menu contains Sign in. No forced auth during exploration. |
| AUTH-02 | P1 | Demo sign-in validation | Submit invalid email or password shorter than six characters. | Browser/form validation blocks submission; short-password feedback is clear. |
| AUTH-03 | P1 | Demo sign-in success | Enter valid-format email and password of at least six characters. | Dialog closes; profile icon replaces Sign In; profile menu opens. |
| AUTH-04 | P1 | Demo sign-up | Switch to sign-up and submit name, valid email, and password. | Local demo user is set; profile icon and account menu appear. |
| AUTH-05 | P1 | Preserve goal and selections | Select goal and add products, then sign in through checkout or wishlist prompt. | Goal, cart, and wishlist remain unchanged through the modal flow. |
| AUTH-06 | P1 | Profile menu | Open profile, visit saved picks/plan, sign out. | Account options navigate correctly; sign out restores Sign In without deleting cart/wishlist/goal. |
| AUTH-07 | P1 | Reload signed-in state | Complete demo sign-in and reload. | Demo profile persists on the same browser/device. State is explicitly not a real secure account. |
| AUTH-08 | P0 | No credential transmission | Sign in and inspect Network panel. | Email/password are not sent to Fake Store API or any other endpoint; only local state changes. Do not use real credentials. |

### G. Demo checkout and order confirmation

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| CHECK-01 | P0 | Checkout authentication gate | With items in cart while signed out, select Continue to checkout. | Auth modal opens; cart and goal stay intact. |
| CHECK-02 | P0 | Checkout fields | Complete demo name, email, and delivery address. | Required fields validate; no card number or payment credential is requested. |
| CHECK-03 | P0 | In-app checkout | Submit a valid demo order. | Confirmation displays within GoalAI without redirecting to an external store. |
| CHECK-04 | P0 | Explicitly non-payment | Submit demo checkout and inspect Network panel. | No payment provider request or charge is initiated. UI states no real order/payment occurred. |
| CHECK-05 | P1 | Order summary accuracy | Submit a cart with multiple products/quantities. | Demo receipt itemization and total equal cart values at checkout. |
| CHECK-06 | P1 | Cart after confirmation | Complete demo checkout and return to Explore. | Cart is cleared only after demo confirmation; goal/wishlist/user remain. |
| CHECK-07 | P1 | Cancel checkout | Close checkout without submitting. | Cart and goal remain intact; no order confirmation appears. |
| CHECK-08 | P2 | Empty cart guard | Try to open/submit checkout with an empty cart. | Purchase action is unavailable or blocked; no empty order is created. |

### H. Navigation, About, Contact, and mobile menu

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| NAV-01 | P1 | Explore navigation | Select Explore from each page. | User returns to goal-led Explore at top of page. |
| NAV-02 | P1 | About navigation | Select About. | Explore page is shown and About section is brought into view. |
| NAV-03 | P1 | Contact navigation | Select Contact. | Contact section is brought into view. |
| NAV-04 | P1 | Cart and Wishlist navigation | Select each header link on desktop and mobile. | Correct view renders; back-to-exploring action returns to Explore. |
| NAV-05 | P1 | Mobile menu open/close | At mobile width, open menu, follow each link, reopen and close with X. | Menu opens/closes; choosing a link closes menu; underlying page remains usable. |
| NAV-06 | P1 | Brand link | Select GoalAI brand mark from footer/header. | Returns to Explore. Keyboard activation works. |
| CONTACT-01 | P1 | Contact prototype disclosure | Submit valid contact email and note. | UI explicitly says no message was sent; it does not claim the team received a message. No network request is made. |
| CONTACT-02 | P2 | Contact required validation | Submit with required email/note missing or invalid. | Native form validation blocks submission. |

### I. Responsive layout and visual quality

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| RWD-01 | P0 | Desktop layout | Open at 1440×900 and scroll through all sections. | Header, hero, goal cards, catalog, About, Contact, and footer are visible and usable without horizontal page overflow. |
| RWD-02 | P1 | Tablet layout | Open at 768×1024. | Header and content reflow; controls and product cards remain readable/clickable. |
| RWD-03 | P0 | Mobile 390px | Test at 390×844. | No page-level horizontal scroll; compact nav and two-column products work; buttons remain tappable. |
| RWD-04 | P1 | Narrow mobile 320px | Test at 320×700. | No clipped essential controls; search, menu, cards, cart lines, modal, and checkout remain usable. |
| RWD-05 | P1 | Modal on mobile | Open product, auth, checkout, and compare dialogs. | Dialog content scrolls within viewport; close button is reachable; form controls do not overflow. |
| RWD-06 | P2 | Long titles/descriptions | Use products with long title/description. | Text wraps/clamps without overlap; product actions remain accessible. |
| RWD-07 | P2 | Reduced motion | Enable OS/browser `prefers-reduced-motion: reduce`. | Decorative motion is suppressed or reduced; no functionality depends on animation. |

### J. Accessibility and input behavior

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| A11Y-01 | P0 | Keyboard-only primary flow | Use Tab/Shift+Tab/Enter/Space from page load through goal selection, product detail, cart, and checkout. | Every actionable control is reachable; focus is visible; native buttons activate with Enter/Space. |
| A11Y-02 | P1 | Product image controls | Tab to product image and heart. | Separate native buttons open details and toggle wishlist; no nested button semantics. |
| A11Y-03 | P1 | Accessible labels | Inspect inputs and icon-only buttons with screen reader/accessibility tree. | Search, menu, close, wishlist, cart, quantity, and profile controls have meaningful accessible names. |
| A11Y-04 | P1 | Dialog semantics | Open every modal and inspect accessibility tree. | Modal has dialog role and `aria-modal=true`; close control is labeled. Focus containment/return should be verified and recorded if absent. |
| A11Y-05 | P1 | Text zoom | Increase browser zoom to 200%. | Content remains readable and controls can be reached; avoid clipped fixed-width regions. |
| A11Y-06 | P2 | Color contrast | Check body copy, labels, and controls with a contrast checker. | Text remains legible against backgrounds; report any failing small-text contrasts. |
| A11Y-07 | P2 | Screen-reader status updates | Add item, save wishlist item, and submit demo form. | Status messages are announced, not only shown visually. |

### K. Security, privacy, and prototype truthfulness

| ID | Priority | Test | Steps | Expected result |
|---|---|---|---|---|
| SEC-01 | P0 | No secrets in frontend bundle | Search built `dist/` and Network requests for API keys/secrets. | No private API key, provider credential, or database secret is embedded. Fake Store API is called directly as a public endpoint. |
| SEC-02 | P0 | No real payment | Inspect checkout UI and Network panel during order submission. | No payment credentials are collected and no charge/payment endpoint is called. |
| SEC-03 | P0 | No external commerce redirect | Click Buy now and complete demo checkout. | Entire flow remains in GoalAI; no navigation to external shops. |
| SEC-04 | P1 | No user data transmission | Submit demo auth/contact forms and inspect Network panel. | Credentials/contact text remain in local demo state; no endpoint receives them. |
| SEC-05 | P1 | UI claims match behavior | Review sign-in, contact, order confirmation, and price labels. | Demo account/order/message limits are explicit; no live account, payment, order, or message is falsely claimed. |
| SEC-06 | P2 | Stored data visibility | Inspect localStorage. | Only demo user profile, goal, cart, and wishlist are stored; users are not told this is secure server-side storage. |

## 4. Automated checks

Run these checks from the project root after code changes:

```bash
pnpm build
curl -fsS http://127.0.0.1:3000/ >/dev/null
curl -fsS http://127.0.0.1:3000/site-routes.json | python3 -m json.tool
```

The API and recommendation smoke check can be run from the project root with Node:

```bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { GOALS, getSuggestions, recommendProducts } from './src/lib/recommendations.js';
const response = await fetch('https://fakestoreapi.com/products');
assert.equal(response.ok, true);
const products = await response.json();
assert.ok(Array.isArray(products) && products.length > 0);
assert.ok(getSuggestions('build a capsule wardrobe', products)
  .some((item) => item.type === 'goal' && item.goal.id === 'capsule'));
assert.ok(recommendProducts(products, GOALS[0], 'build a capsule wardrobe', 1000).length > 0);
console.log(`Passed: ${products.length} products loaded and goal search returns recommendations.`);
JS
```

## 5. Suggested execution order

1. Run START and API cases first; a broken API or page load blocks meaningful shopping tests.
2. Run GOAL, DISC, WISH, and CART cases to cover the user’s primary discovery-to-selection flow.
3. Run AUTH and CHECK cases only with clearly fake test information; never enter real credentials or payment details.
4. Run navigation, responsive, and accessibility cases at every target viewport/browser.
5. Run privacy and prototype-truthfulness checks before sharing the demo.
6. Record each result, file defects with reproducible steps, and rerun affected cases after fixes.

## 6. Known boundaries and likely follow-up tests

Goal matching is a local keyword/category heuristic rather than a connected LLM. Test it as an interactive recommendation prototype, not an open-ended language-understanding service. Fake Store API is sample catalog data and may be unavailable or change. Sign-in is browser-local demo state; it is not secure authentication or cross-device identity. Checkout is a confirmation simulation without payment processing or durable order creation. The contact form does not transmit messages. A production release needs separately implemented and reviewed backend authentication, payment processing, order persistence, inventory/shipping rules, and a real contact delivery path.
