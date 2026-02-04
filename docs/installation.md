# Installation

Install the Bundle Offers Widget v2 on any Shopify theme (Online Store 2.0).

## 1. Copy theme files

Copy the contents of `theme-files/` into your theme root so that:

- `theme-files/blocks/product-bundle-offers.liquid` → `blocks/product-bundle-offers.liquid`
- `theme-files/assets/bundle-offers-v2.js` → `assets/bundle-offers-v2.js`
- `theme-files/assets/enhanced-add-to-cart.js` → `assets/enhanced-add-to-cart.js`
- `theme-files/snippets/add-to-cart-button-enhanced.liquid` → `snippets/add-to-cart-button-enhanced.liquid` (optional, for dynamic price on button)
- `theme-files/snippets/bundle-cart-adapter.liquid` → `snippets/bundle-cart-adapter.liquid` (optional; see [Cart drawer integration](./cart-drawer-integration.md))

## 2. Add the block to your product template

1. In the theme editor, go to **Product page** (or the template that shows the product).
2. Add or open the section that contains the product form (e.g. “Product information”).
3. Click **Add block** and choose **Bundle Offers**.
4. Configure your bundle tiers, pricing, free gifts, and badges.

## 3. Add to cart button

Ensure the product form includes an **Add to cart** button (e.g. `name="add"` or `type="submit"`). The bundle script will intercept the form and add the selected quantity (and free gifts) to cart.

For a button that shows the **dynamic bundle price**, use the enhanced add-to-cart snippet in your product form:

```liquid
{% render 'add-to-cart-button-enhanced',
  can_add_to_cart: product.selected_or_first_available_variant.available,
  add_to_cart_text: 'Add to cart',
  product: product,
  show_price: true,
  show_compare_price: true,
  display_price: product.selected_or_first_available_variant.price,
  display_compare_price: product.selected_or_first_available_variant.compare_at_price
%}
```

(Adjust parameters to match your theme’s product object and styling.)

## 4. Cart drawer / cart page

The widget works with **any** cart experience:

- **Native theme cart drawer** – See [Cart drawer integration](./cart-drawer-integration.md).
- **Custom cart drawer** – Listen for `bundle:cart-added` and open your drawer; use `detail.sections` if you use section HTML.
- **Cart drawer app** – Have the app listen for `bundle:cart-added` and refresh/open as needed.
- **Redirect to cart** – Listen for `bundle:cart-added` and set `window.location.href = '/cart'`.

No extra step is required for “redirect to cart” themes; you only need to wire the event if you want a drawer or custom behavior.

## 5. Optional: Cart section IDs

If your theme or app uses specific section IDs for the cart (e.g. a different cart drawer section), set **Cart section IDs** in the Bundle Offers block settings (comma-separated). The widget will request those sections when adding to cart and include them in the `bundle:cart-added` event so your drawer can re-render.
