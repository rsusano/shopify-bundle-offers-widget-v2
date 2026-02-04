# Cart drawer integration

The Bundle Offers Widget v2 is **cart-agnostic**: it does not assume a specific cart drawer. It adds items to cart via the Storefront API and then dispatches events. Your theme or app decides whether to open a drawer, redirect to `/cart`, or do something else.

## Events dispatched after add to cart

| Event | When | Use |
|-------|------|-----|
| `cart-drawer:open` | Right after items are added (with `detail.loading: true` if applicable) | Open your drawer and show a loading state. |
| `cart:update` | When cart and (optionally) section HTML are ready | Refresh cart UI; many themes use this for section re-render / morph. |
| `cart-drawer:loaded` | When loading state can be cleared | Remove “Updating cart…” in the drawer. |
| **`bundle:cart-added`** | After a successful bundle add, with full payload | **Use this for any custom or app-based drawer.** |

## `bundle:cart-added` payload

```js
document.addEventListener('bundle:cart-added', (e) => {
  const { cart, itemCount, sections } = e.detail;
  // cart: full cart JSON from /cart.js
  // itemCount: number of items
  // sections: { [sectionId]: htmlString } if section IDs were requested
});
```

- **Redirect to cart:**  
  `window.location.href = '/cart';`

- **Open your drawer:**  
  Open your drawer component, then update its content from `cart` (and optionally replace HTML from `sections` if your theme uses section rendering).

- **Cart drawer app:**  
  Listen for `bundle:cart-added` and trigger your app’s “refresh cart” / “open drawer” API.

## Native theme cart drawer

Many themes already listen for `cart-drawer:open` and `cart:update`. If your theme does:

1. Ensure the cart section ID(s) used by your theme are requested when adding to cart. Either:
   - Leave **Cart section IDs** blank in the block settings (widget will auto-detect `cart-items-component[data-section-id]` and add `cart-drawer`), or  
   - Set **Cart section IDs** to your theme’s section IDs (e.g. `cart-drawer`, `main-cart`).
2. No extra code is needed; the widget will dispatch `cart-drawer:open` and `cart:update` with section HTML.

## Optional: theme cart display adapter

If your theme uses the **same** selectors as the widget’s built-in adapter (cart heading, cart bubble count, empty state), you can opt in to automatic DOM updates:

1. In your theme layout (e.g. `layout/theme.liquid`) or cart drawer section, include once:
   ```liquid
   {% render 'bundle-cart-adapter' %}
   ```
2. This renders a hidden element that tells the widget to run its optional “theme cart display” logic (update heading, bubble count, empty state). If you don’t include this snippet, the widget **never** touches your DOM and only dispatches events.

Use this only if your theme matches the selectors documented in the snippet; otherwise use `bundle:cart-added` and update your own UI.

## Custom cart drawer

1. Listen for `bundle:cart-added`.
2. Open your drawer.
3. Update the drawer content:
   - From `e.detail.cart` (e.g. render line items, total), and/or  
   - From `e.detail.sections` if you requested section IDs and your drawer is rendered from those sections (inject the HTML for the matching section ID).

## Cart drawer app

1. Have your app inject a script that listens for `bundle:cart-added`.
2. On event: refresh the cart in your app (e.g. fetch `/cart.js` or use `e.detail.cart`) and open or refresh your drawer UI.
3. Optionally set **Cart section IDs** in the block to your app’s section ID so `e.detail.sections` contains the section HTML your app expects.
