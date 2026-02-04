# Getting Started – Bundle Offers Widget v2

Quick path to a working bundle widget on any Shopify theme.

## 1. Copy files into your theme

Copy these into your theme root (same folder names):

| From this repo | To your theme |
|----------------|----------------|
| `blocks/product-bundle-offers.liquid` | `blocks/` |
| `assets/bundle-offers-v2.js` | `assets/` |
| `assets/enhanced-add-to-cart.js` | `assets/` |
| `snippets/add-to-cart-button-enhanced.liquid` | `snippets/` (optional) |
| `snippets/bundle-cart-adapter.liquid` | `snippets/` (optional, for cart display updates) |

## 2. Add the block

1. **Online Store → Themes → Customize**
2. Open a **product page**
3. In the product section, click **Add block** → **Bundle Offers**
4. Configure tiers, prices, free gifts, and badges in the block settings

## 3. Add to cart button

Your product form must have an **Add to cart** button (e.g. `name="add"` or `type="submit"`). The bundle script will intercept it.

For a button that shows the **dynamic bundle price**, use the enhanced snippet in your product form (see [docs/INSTALLATION.md](docs/installation.md)).

## 4. Cart behavior

- **Redirect to cart:** No extra code; cart updates and customer can go to `/cart`.
- **Cart drawer:** If your theme already listens for `cart-drawer:open` and `cart:update`, it may work as-is. Otherwise see [Cart drawer integration](docs/cart-drawer-integration.md) and use the `bundle:cart-added` event.

## Next steps

- [Full installation guide](docs/installation.md)
- [Cart drawer integration](docs/cart-drawer-integration.md)
- [README](README.md) – features, architecture, and customization
