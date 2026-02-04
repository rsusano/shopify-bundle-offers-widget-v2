# Start Here – Bundle Offers Widget v2

Welcome to the **Shopify Bundle Offers Widget v2**. This package works with **any theme** and **any cart drawer** (native, custom, or app).

## What you get

- **Bundle block** – Multi-tier offers (e.g. Buy 1, Buy 2 Get 1 Free) with dynamic pricing and free gifts.
- **Enhanced add-to-cart button** – Optional; shows the selected bundle price and updates when the customer changes tier.
- **Cart-agnostic** – Adds items via the Storefront API and dispatches events; your theme or app handles opening/refreshing the cart.

## Quick links

| I want to… | Go to |
|------------|--------|
| Install on a theme | [GETTING_STARTED.md](GETTING_STARTED.md) or [docs/installation.md](docs/installation.md) |
| Connect my cart drawer | [docs/cart-drawer-integration.md](docs/cart-drawer-integration.md) |
| See features and architecture | [README.md](README.md) |
| See what changed in v2 | [CHANGELOG.md](CHANGELOG.md) |

## Repo structure

```
shopify-bundle-offers-widget-v2/
├── blocks/          → Copy to your theme blocks/
├── assets/          → Copy to your theme assets/
├── snippets/        → Copy to your theme snippets/
├── docs/            → Installation and cart integration guides
├── README.md        → Overview, features, architecture diagram
├── GETTING_STARTED.md
├── START_HERE.md    → This file
├── CHANGELOG.md
└── LICENSE
```

Copy the contents of `blocks/`, `assets/`, and `snippets/` into your theme, add the **Bundle Offers** block to your product section, and you’re ready to configure.

For a visual overview and how it works, see the [README](README.md).
