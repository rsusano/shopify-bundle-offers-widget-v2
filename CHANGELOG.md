# Changelog

All notable changes to the Shopify Bundle Offers Widget v2 will be documented in this file.

## [2.0.0] – 2026-02

### Added

- **Cart-agnostic design** – Works with any theme and any cart drawer (native, custom, or app).
- **`bundle:cart-added` event** – Dispatched with `{ cart, itemCount, sections }` for custom drawer integration.
- **Configurable Cart section IDs** – Block setting to request specific section IDs when adding to cart.
- **Optional bundle-cart-adapter snippet** – Opt-in DOM updates for theme cart display (heading, bubble count).
- Multi-tier bundle offers with dynamic pricing and free gifts.
- Enhanced add-to-cart button with dynamic price display.
- Full theme customizer integration (badges, colors, animations, mobile overrides).
- Documentation: Installation, Cart drawer integration, architecture flow diagram.

### Differences from v1

- No hard-coded cart drawer selectors; theme or app listens for events.
- Same root structure as v1 repo (assets, blocks, docs, snippets) for easy adoption.
