// @ts-nocheck
/** Bundle Offers v2 – cart-agnostic; works with any theme or cart drawer app */
if (typeof console !== 'undefined' && console.log) {
  console.log('Bundle Offers v2: script loaded');
}

/**
 * Optional: direct DOM update for cart display. Only runs when theme has opted in
 * by including the bundle-cart-adapter snippet (presence of [data-bundle-theme-cart]).
 * Use bundle:cart-added event for custom drawers or apps.
 */
function updateCartDrawerDisplay(itemCount, fullCart) {
  if (!document.querySelector('[data-bundle-theme-cart]')) return;
  try {
    const headings = document.querySelectorAll('#cart-drawer-heading, .cart-drawer__heading');
    const cartTitle = typeof Theme !== 'undefined' && Theme?.translations?.content?.cart_title ? Theme.translations.content.cart_title : 'Cart';
    headings.forEach((h) => {
      if (h.id !== 'cart-drawer-heading-empty') {
        h.textContent = `${cartTitle} • ${itemCount}`;
      }
    });
    const cartBubbleCount = document.querySelector('[ref="cartBubbleCount"], .cart-bubble__text-count');
    if (cartBubbleCount) {
      cartBubbleCount.textContent = itemCount > 0 && itemCount < 100 ? String(itemCount) : (itemCount >= 100 ? '' : '0');
      cartBubbleCount.classList.toggle('hidden', itemCount === 0);
    }
    const cartBubble = document.querySelector('[ref="cartBubble"], .cart-bubble');
    if (cartBubble) {
      cartBubble.classList.toggle('visually-hidden', itemCount === 0);
    }
    const cartDrawer = document.querySelector('cart-drawer-component, .cart-drawer');
    if (cartDrawer) {
      cartDrawer.classList.toggle('cart-drawer--empty', itemCount === 0);
    }
  } catch (e) {
    console.warn('Bundle Offers v2: Direct cart display update failed', e);
  }
}

class BundleOffersComponent extends HTMLElement {
  constructor() {
    super();
    this.radios = this.querySelectorAll('input[type="radio"]');
    this.items = this.querySelectorAll('.product-bundle-offers__item');
    this.productForm = null;
    this.quantityInput = null;
    this.selectedBundle = null;
    this.init();
  }

  init() {
    this.findProductForm();
    this.radios.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleSelection(e));
    });
    this.adoptSelectionFromOtherComponents();
    const checked = this.querySelector('input[type="radio"]:checked');
    if (checked) {
      this.selectedBundle = checked;
      this.updateSelection(checked);
      this.updateQuantityInput(checked);
      this.updateAllButtons(checked);
      this.syncSelectionToOtherComponents(checked);
    }
    this.interceptFormSubmission();
    this.saveBundleTiersToSession();
  }

  saveBundleTiersToSession() {
    try {
      const variantId = this.getAttribute('data-variant-id') || (this.querySelector('input[type="radio"]')?.dataset?.variantId);
      if (!variantId) return;
      const tiers = [];
      this.radios.forEach((radio) => {
        const qty = parseInt(radio.dataset.quantity, 10) || 1;
        tiers.push({
          quantity: qty,
          discountCode: (radio.dataset.discountCode || '').trim(),
          freeGiftDiscountCode: (radio.dataset.freeGiftDiscountCode || '').trim() || null,
          freeGiftVariantId: radio.dataset.freeGiftVariantId || null,
          freeGiftQuantity: parseInt(radio.dataset.freeGiftQuantity, 10) || 0,
          freeGiftDisplayVariantId: (radio.dataset.freeGiftDisplayVariantId || '').trim() || null,
          freeGiftDisplayQuantity: Math.max(0, parseInt(radio.dataset.freeGiftDisplayQuantity, 10) || 0)
        });
      });
      tiers.sort((a, b) => a.quantity - b.quantity);
      let store = {};
      try {
        const raw = sessionStorage.getItem('bundleTiers');
        if (raw) store = JSON.parse(raw);
      } catch (e) { /* ignore */ }
      store[variantId] = tiers;
      sessionStorage.setItem('bundleTiers', JSON.stringify(store));
    } catch (e) {
      console.warn('Bundle Offers v2: Could not save tier config', e);
    }
  }

  findProductForm() {
    const root = this.closest('[data-section-id]') || this.closest('section') || document.body;
    this.productForm = root.querySelector('form[action*="/cart/add"]') ||
      root.querySelector('product-form form') ||
      root.querySelector('.product-form form') ||
      document.querySelector('form[action*="/cart/add"]') ||
      document.querySelector('product-form form') ||
      document.querySelector('.product-form form') ||
      document.querySelector('[data-product-form]');
    if (this.productForm) {
      this.quantityInput = this.productForm.querySelector('input[name="quantity"]') ||
        document.querySelector('input[name="quantity"]') ||
        document.querySelector('.quantity__input') ||
        document.querySelector('[data-quantity-input]');
    }
  }

  interceptFormSubmission() {
    if (!this.productForm) {
      console.log('Bundle Offers v2: No product form found');
      return;
    }
    const ourRoot = this.closest('[data-section-id]') || this.closest('section');
    if (ourRoot && !ourRoot.contains(this.productForm)) {
      return;
    }
    const component = this;
    const addToCartButton = this.productForm.querySelector('[name="add"]') ||
      this.productForm.querySelector('button[type="submit"]');

    const handleAddToCart = async function (e) {
      if (handleAddToCart._handling) return;
      handleAddToCart._handling = true;
      e.preventDefault();
      e.stopPropagation();
      try {
        const formVariantInput = component.productForm.querySelector('input[name="id"]');
        const formVariantId = formVariantInput ? String(formVariantInput.value).trim() : null;
        const formSection = component.productForm.closest('[data-section-id]') || component.productForm.closest('section');
        let activeComponent = component;
        const allBundleOffers = document.querySelectorAll('bundle-offers-component');
        let inSectionMatches = [];
        let firstMatch = null;
        for (const el of allBundleOffers) {
          const matchVariant = el.getAttribute('data-variant-id') === formVariantId || (formVariantId && el.querySelector('input[data-variant-id="' + formVariantId + '"]'));
          if (!matchVariant) continue;
          if (!firstMatch) firstMatch = el;
          if (formSection && formSection.contains(el)) {
            inSectionMatches.push(el);
          }
        }
        let inSectionMatch = inSectionMatches.length > 0 ? inSectionMatches[inSectionMatches.length - 1] : null;
        if (inSectionMatches.length > 1) {
          let el = component.productForm.parentElement;
          let found = null;
          while (el && formSection && formSection.contains(el) && !found) {
            for (const comp of inSectionMatches) {
              if (el.contains(comp)) {
                found = comp;
                break;
              }
            }
            if (!found) el = el.parentElement;
          }
          if (found) inSectionMatch = found;
        }
        activeComponent = inSectionMatch || firstMatch || (formSection && formSection.querySelector('bundle-offers-component')) || component;
        const selectedRadio = activeComponent.querySelector('input[type="radio"]:checked') || activeComponent.selectedBundle;
        if (!selectedRadio) {
          console.log('Bundle Offers v2: No bundle selected');
          return;
        }
        activeComponent.selectedBundle = selectedRadio;

        const mainVariantId = selectedRadio.dataset.variantId;
        const mainQuantity = Math.max(1, parseInt(selectedRadio.dataset.quantity, 10) || 1);
        const freeGiftVariantId = selectedRadio.dataset.freeGiftVariantId;
        const freeGiftQuantity = parseInt(selectedRadio.dataset.freeGiftQuantity) || 0;
        const freeGiftCustomName = selectedRadio.dataset.freeGiftCustomName || '';
        const freeGiftDisplayVariantId = selectedRadio.dataset.freeGiftDisplayVariantId;
        const freeGiftDisplayQuantity = parseInt(selectedRadio.dataset.freeGiftDisplayQuantity) || 0;
        const freeGiftDisplayCustomName = selectedRadio.dataset.freeGiftDisplayCustomName || '';
        const discountCode = (selectedRadio.dataset.discountCode || '').trim();
        const freeGiftDiscountCode = (selectedRadio.dataset.freeGiftDiscountCode || '').trim();
        const combinedDiscountCodes = [discountCode, freeGiftDiscountCode].filter(Boolean);
        const seen = new Set();
        const uniqueCodes = combinedDiscountCodes.filter((c) => {
          const u = c.toUpperCase();
          if (seen.has(u)) return false;
          seen.add(u);
          return true;
        });
        const discountToApply = uniqueCodes.length > 0 ? uniqueCodes.join(',') : '';

        const items = [];
        const hasMainGift = freeGiftVariantId && freeGiftQuantity > 0;
        const hasDisplayGift = freeGiftDisplayVariantId && freeGiftDisplayQuantity > 0;
        const sameGiftVariant = hasMainGift && hasDisplayGift && String(freeGiftVariantId) === String(freeGiftDisplayVariantId);

        if (hasMainGift || hasDisplayGift) {
          const bundleId = `bundle_${Date.now()}_${mainVariantId}`;
          items.push({
            id: parseInt(mainVariantId),
            quantity: mainQuantity,
            properties: {
              '_bundle_id': bundleId,
              '_bundle_main': 'true',
              '_has_free_gift': 'true'
            }
          });
          if (hasMainGift) {
            const mainGiftQty = sameGiftVariant ? freeGiftQuantity + freeGiftDisplayQuantity : freeGiftQuantity;
            const giftProperties = {
              '_Free Gift': 'Yes',
              '_bundle_id': bundleId,
              '_bundle_gift': 'true',
              '_linked_to_variant': mainVariantId.toString()
            };
            if (freeGiftCustomName && freeGiftCustomName.trim()) {
              giftProperties['_bundle_gift_display_name'] = freeGiftCustomName.trim();
            }
            items.push({
              id: parseInt(freeGiftVariantId),
              quantity: mainGiftQty,
              properties: giftProperties
            });
          }
          if (hasDisplayGift && !sameGiftVariant) {
            const displayGiftProperties = {
              '_Free Gift': 'Yes',
              '_bundle_id': bundleId,
              '_bundle_gift': 'true',
              '_bundle_gift_display': 'true',
              '_linked_to_variant': mainVariantId.toString()
            };
            if (freeGiftDisplayCustomName && freeGiftDisplayCustomName.trim()) {
              displayGiftProperties['_bundle_gift_display_name'] = freeGiftDisplayCustomName.trim();
            }
            items.push({
              id: parseInt(freeGiftDisplayVariantId),
              quantity: freeGiftDisplayQuantity,
              properties: displayGiftProperties
            });
          }
        } else {
          items.push({
            id: parseInt(mainVariantId),
            quantity: mainQuantity
          });
        }

        const btn = addToCartButton || component.productForm?.querySelector('[name="add"]') || component.productForm?.querySelector('button[type="submit"]');
        try {
          if (btn) { btn.disabled = true; btn.classList.add('loading'); }

          // Section IDs: from data-cart-section-ids (theme/app-specific) or auto-detect
          let sectionIdsToRequest = [];
          const customIds = (activeComponent.getAttribute('data-cart-section-ids') || '').trim();
          if (customIds) {
            sectionIdsToRequest = customIds.split(',').map((id) => id.trim()).filter(Boolean);
          } else {
            const cartItemsComponents = document.querySelectorAll('cart-items-component');
            const sectionIds = [];
            cartItemsComponents.forEach((el) => {
              if (el instanceof HTMLElement && el.dataset.sectionId) {
                sectionIds.push(el.dataset.sectionId);
              }
            });
            sectionIdsToRequest = [...new Set([...sectionIds, 'cart-drawer'])];
          }

          const sectionsParam = sectionIdsToRequest.map((id) => id.replace(/^shopify-section-/, '')).filter(Boolean).join(',');
          const cartAddUrl = (typeof Theme !== 'undefined' && Theme?.routes?.cart_add_url) ? Theme.routes.cart_add_url : '/cart/add.js';
          const requestBody = {
            items: items,
            sections: sectionsParam,
            sections_url: (typeof window !== 'undefined' && window.location?.pathname) ? window.location.pathname : '/'
          };

          const response = await fetch(cartAddUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });

          const result = await response.json();

          if (response.ok) {
            let fullCart = result.item_count !== undefined ? result : await (await fetch('/cart.js')).json();
            let itemCount = fullCart.item_count ?? 0;
            let sections = {};

            updateCartDrawerDisplay(itemCount, fullCart);
            document.dispatchEvent(new CustomEvent('cart-drawer:open', { bubbles: true, detail: { loading: true } }));

            if (discountToApply) {
              try {
                const cartUpdateUrl = (typeof Theme !== 'undefined' && Theme?.routes?.cart_update_url) ? Theme.routes.cart_update_url : '/cart/update';
                try {
                  await fetch(cartUpdateUrl + '.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ discount: '' })
                  });
                  await new Promise((r) => setTimeout(r, 50));
                } catch (e) { /* ignore */ }
                await fetch(cartUpdateUrl + '.js', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ discount: discountToApply })
                });
                await new Promise((r) => setTimeout(r, 50));
                const normalizedIds = sectionIdsToRequest.map((id) => id.replace(/^shopify-section-/, '')).filter(Boolean);
                const sectionUrlObj = new URL(window.location.href);
                sectionUrlObj.searchParams.set('sections', normalizedIds.join(','));
                const sectionFetchPromise = fetch(sectionUrlObj.pathname + sectionUrlObj.search);
                const codesToCheck = discountToApply.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
                const deadline = Date.now() + 300;
                let discountConfirmed = false;
                while (Date.now() < deadline) {
                  const cartCheck = await (await fetch('/cart.js')).json();
                  const apps = cartCheck.cart_level_discount_applications || cartCheck.discount_applications || [];
                  const listCodes = cartCheck.discount_codes || [];
                  const appliedCodes = new Set([
                    ...apps.map((app) => (app.title || app.code || '').toUpperCase()),
                    ...listCodes.map((d) => (typeof d === 'string' ? d : (d.code || d.title || '')).toUpperCase())
                  ]);
                  const hasAnyOfOurs = codesToCheck.some((codeUpper) =>
                    Array.from(appliedCodes).some((c) => c === codeUpper || c.indexOf(codeUpper) !== -1 || codeUpper.indexOf(c) !== -1)
                  );
                  const hasDiscount = (cartCheck.total_discount && cartCheck.total_discount > 0) || apps.length > 0;
                  if (hasAnyOfOurs && hasDiscount) {
                    fullCart = cartCheck;
                    itemCount = fullCart.item_count ?? 0;
                    discountConfirmed = true;
                    break;
                  }
                  await new Promise((r) => setTimeout(r, 50));
                }
                if (!discountConfirmed) {
                  try {
                    const cartCheck = await (await fetch('/cart.js')).json();
                    const apps = cartCheck.cart_level_discount_applications || cartCheck.discount_applications || [];
                    const listCodes = cartCheck.discount_codes || [];
                    const appliedCodes = new Set([
                      ...apps.map((app) => (app.title || app.code || '').toUpperCase()),
                      ...listCodes.map((d) => (typeof d === 'string' ? d : (d.code || d.title || '')).toUpperCase())
                    ]);
                    const hasAnyOfOurs = codesToCheck.some((codeUpper) =>
                      Array.from(appliedCodes).some((c) => c === codeUpper || c.indexOf(codeUpper) !== -1 || codeUpper.indexOf(c) !== -1)
                    );
                    const hasDiscount = (cartCheck.total_discount && cartCheck.total_discount > 0) || apps.length > 0;
                    if (hasAnyOfOurs && hasDiscount) {
                      fullCart = cartCheck;
                      itemCount = fullCart.item_count ?? 0;
                    }
                  } catch (e) { /* ignore */ }
                }
                try {
                  const res = await sectionFetchPromise;
                  if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data === 'object') {
                      for (const [respId, html] of Object.entries(data)) {
                        if (html && typeof html === 'string') {
                          sections[respId] = html;
                          const origId = sectionIdsToRequest.find((s) => s.replace(/^shopify-section-/, '') === respId);
                          if (origId && origId !== respId) sections[origId] = html;
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.warn('Bundle Offers v2: Section fetch failed', err);
                }
              } catch (err) {
                console.warn('Bundle Offers v2: Discount apply failed', err);
              }
            }

            if (btn) { btn.classList.add('atc-added'); btn.classList.remove('loading'); }
            setTimeout(() => {
              if (btn) { btn.classList.remove('atc-added'); btn.disabled = false; }
            }, 2000);

            if (Object.keys(sections).length === 0) {
              const normalizedIds = sectionIdsToRequest.map((id) => id.replace(/^shopify-section-/, '')).filter(Boolean);
              const sectionUrlObj = new URL(window.location.href);
              sectionUrlObj.searchParams.set('sections', normalizedIds.join(','));
              try {
                const res = await fetch(sectionUrlObj.pathname + sectionUrlObj.search);
                if (res.ok) {
                  const data = await res.json();
                  if (data && typeof data === 'object') {
                    for (const [respId, html] of Object.entries(data)) {
                      if (html && typeof html === 'string') {
                        sections[respId] = html;
                        const origId = sectionIdsToRequest.find((s) => s.replace(/^shopify-section-/, '') === respId);
                        if (origId && origId !== respId) sections[origId] = html;
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn('Bundle Offers v2: Section fetch failed', err);
              }
            }
            if (Object.keys(sections).length === 0 && result.sections && typeof result.sections === 'object') {
              for (const [respId, html] of Object.entries(result.sections)) {
                if (html && typeof html === 'string') {
                  sections[respId] = html;
                  const origId = sectionIdsToRequest.find((s) => s.replace(/^shopify-section-/, '') === respId);
                  if (origId && origId !== respId) sections[origId] = html;
                }
              }
            }

            document.dispatchEvent(new CustomEvent('cart:update', {
              bubbles: true,
              detail: {
                resource: fullCart,
                sourceId: mainVariantId.toString(),
                itemCount: itemCount,
                cart: fullCart,
                data: {
                  source: 'bundle-offers',
                  itemCount: itemCount,
                  productId: component.getAttribute('data-product-id'),
                  variantId: mainVariantId.toString(),
                  sections: Object.keys(sections).length > 0 ? sections : undefined
                }
              }
            }));

            updateCartDrawerDisplay(itemCount, fullCart);

            document.dispatchEvent(new CustomEvent('bundle:cart-added', {
              bubbles: true,
              detail: {
                cart: fullCart,
                itemCount: itemCount,
                sections: Object.keys(sections).length > 0 ? sections : undefined
              }
            }));

            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('cart-drawer:loaded', { bubbles: true }));
            }, 280);

            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('cart:update', {
                bubbles: true,
                detail: {
                  resource: fullCart,
                  sourceId: mainVariantId.toString(),
                  itemCount: itemCount,
                  data: {
                    source: 'bundle-offers',
                    itemCount: itemCount,
                    variantId: mainVariantId.toString()
                  }
                }
              }));
            }, 400);

          } else {
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
            alert('Failed to add items to cart. Please try again.');
          }
        } catch (error) {
          console.error('Bundle Offers v2: Error adding to cart', error);
          const btn = component.productForm?.querySelector('[name="add"]') || component.productForm?.querySelector('button[type="submit"]');
          if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
          alert('Error adding items to cart. Please try again.');
        }
      } finally {
        handleAddToCart._handling = false;
      }
    };

    if (addToCartButton) {
      addToCartButton.addEventListener('click', handleAddToCart, true);
    }
    component.productForm.addEventListener('submit', handleAddToCart, true);
  }

  handleSelection(e) {
    const radio = e.target;
    this.selectedBundle = radio;
    this.updateSelection(radio);
    this.updateQuantityInput(radio);
    this.updateAllButtons(radio);
    this.syncSelectionToOtherComponents(radio);
  }

  adoptSelectionFromOtherComponents() {
    const variantId = this.getAttribute('data-variant-id') || '';
    const all = document.querySelectorAll('bundle-offers-component');
    for (const comp of all) {
      if (comp === this) continue;
      if ((comp.getAttribute('data-variant-id') || '') !== variantId) continue;
      const otherChecked = comp.querySelector('input[type="radio"]:checked');
      if (otherChecked) {
        const bundleValue = otherChecked.value;
        const ourRadio = this.querySelector('input[type="radio"][value="' + bundleValue + '"]');
        if (ourRadio && !ourRadio.checked) {
          ourRadio.checked = true;
          this.selectedBundle = ourRadio;
          this.updateSelection(ourRadio);
          this.updateQuantityInput(ourRadio);
          this.updateAllButtons(ourRadio);
        }
        break;
      }
    }
  }

  syncSelectionToOtherComponents(radio) {
    const bundleValue = radio.value;
    const variantId = this.getAttribute('data-variant-id') || '';
    const all = document.querySelectorAll('bundle-offers-component');
    for (const comp of all) {
      if (comp === this) continue;
      if ((comp.getAttribute('data-variant-id') || '') !== variantId) continue;
      const targetRadio = comp.querySelector('input[type="radio"][value="' + bundleValue + '"]');
      if (targetRadio && !targetRadio.checked) {
        targetRadio.checked = true;
        comp.selectedBundle = targetRadio;
        comp.updateSelection(targetRadio);
        comp.updateQuantityInput(targetRadio);
        comp.updateAllButtons(targetRadio);
      }
    }
  }

  updateSelection(radio) {
    this.items.forEach(item => item.classList.remove('is-selected'));
    radio.closest('.product-bundle-offers__item').classList.add('is-selected');
  }

  updateQuantityInput(radio) {
    const quantity = parseInt(radio.dataset.quantity);
    const quantitySelectors = [
      'input[name="quantity"]',
      '.quantity__input',
      '[data-quantity-input]',
      'quantity-selector input',
      '.quantity-input input',
      '.product-form__quantity input'
    ];
    quantitySelectors.forEach(selector => {
      const inputs = document.querySelectorAll(selector);
      inputs.forEach(input => {
        if (input) {
          input.value = quantity;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          const quantitySelector = input.closest('quantity-selector');
          if (quantitySelector && typeof quantitySelector.updateQuantity === 'function') {
            quantitySelector.updateQuantity(quantity);
          }
        }
      });
    });
    const quantityDisplays = document.querySelectorAll('.quantity-selector__value, .quantity__current');
    quantityDisplays.forEach(display => { display.textContent = quantity; });
    if (this.productForm) this.productForm.dataset.bundleQuantity = quantity;
  }

  updateAllButtons(radio) {
    const price = parseInt(radio.dataset.price);
    const formattedPrice = this.formatMoney(price);
    this.updateAddToCartButtons(formattedPrice);
    this.updateAcceleratedCheckout(formattedPrice);
    this.dispatchBundleEvent(radio);
  }

  updateAddToCartButtons(formattedPrice) {
    const buttonSelectors = [
      'button[name="add"]',
      '.product-form__submit',
      '.add-to-cart-button',
      '[data-add-to-cart]',
      '.product-form button[type="submit"]',
      'product-form button[type="submit"]'
    ];
    buttonSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        if (button && !button.closest('.shopify-payment-button')) {
          const priceElement = button.querySelector('[data-enhanced-atc-price]');
          const comparePriceElement = button.querySelector('[data-enhanced-atc-compare-price]');
          if (priceElement) {
            priceElement.textContent = formattedPrice;
            if (comparePriceElement) {
              const radio = this.selectedBundle;
              const comparePrice = parseInt(radio.dataset.comparePrice);
              if (comparePrice) {
                comparePriceElement.textContent = this.formatMoney(comparePrice);
              }
            }
          } else {
            if (!button.dataset.originalText) button.dataset.originalText = button.textContent.trim();
            const textElement = button.querySelector('span') || button.querySelector('.button-label') || button;
            if (textElement) textElement.textContent = `Add to cart - ${formattedPrice}`;
          }
        }
      });
    });
  }

  updateAcceleratedCheckout(formattedPrice) {
    const acceleratedSelectors = [
      '.shopify-payment-button button',
      '.shopify-payment-button__button',
      '[data-shopify-buttoncontainer] button',
      '.dynamic-checkout__button'
    ];
    acceleratedSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        if (button) {
          if (!button.dataset.originalText) button.dataset.originalText = button.textContent.trim();
          const textElement = button.querySelector('span') || button;
          if (textElement && textElement.textContent) {
            const originalText = button.dataset.originalText;
            textElement.textContent = originalText.toLowerCase().includes('buy') ? `Buy now - ${formattedPrice}` : `${originalText} - ${formattedPrice}`;
          }
        }
      });
    });
  }

  dispatchBundleEvent(radio) {
    const price = parseInt(radio.dataset.price);
    const comparePrice = parseInt(radio.dataset.comparePrice);
    const quantity = parseInt(radio.dataset.quantity);
    document.dispatchEvent(new CustomEvent('bundle:selected', {
      bubbles: true,
      detail: {
        price: price,
        comparePrice: comparePrice,
        quantity: quantity,
        formattedPrice: this.formatMoney(price),
        formattedComparePrice: this.formatMoney(comparePrice)
      }
    }));
    sessionStorage.setItem('selectedBundle', JSON.stringify({
      price: price,
      quantity: quantity,
      comparePrice: comparePrice
    }));
  }

  formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    if (window.Shopify && window.Shopify.currency) {
      const formatter = new Intl.NumberFormat(window.Shopify.locale || 'en-US', {
        style: 'currency',
        currency: window.Shopify.currency.active || 'USD'
      });
      return formatter.format(amount);
    }
    return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
  }
}

if (!customElements.get('bundle-offers-component')) {
  customElements.define('bundle-offers-component', BundleOffersComponent);
}

window.__applyBundleDiscountCode = async function (code) {
  if (!code || !String(code).trim()) return;
  const c = String(code).trim();
  const cartUpdateUrl = (typeof Theme !== 'undefined' && Theme?.routes?.cart_update_url) ? Theme.routes.cart_update_url : '/cart/update';
  const updateJs = cartUpdateUrl.endsWith('.js') ? cartUpdateUrl : cartUpdateUrl + '.js';
  try {
    await fetch(updateJs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discount: '' })
    });
    await new Promise((r) => setTimeout(r, 50));
  } catch (e) { /* ignore */ }
  await fetch(updateJs, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discount: c })
  });
  await new Promise((r) => setTimeout(r, 30));
  const codesToCheck = c.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const deadline = Date.now() + 500;
  let ok = false;
  while (Date.now() < deadline) {
    const cartCheck = await (await fetch('/cart.js')).json();
    const apps = cartCheck.cart_level_discount_applications || cartCheck.discount_applications || [];
    const listCodes = cartCheck.discount_codes || [];
    const appliedCodes = new Set([
      ...apps.map((app) => (app.title || app.code || '').toUpperCase()),
      ...listCodes.map((d) => (typeof d === 'string' ? d : (d.code || d.title || '')).toUpperCase())
    ]);
    const hasAnyOfOurs = codesToCheck.some((codeUpper) =>
      Array.from(appliedCodes).some((x) => x === codeUpper || x.indexOf(codeUpper) !== -1 || codeUpper.indexOf(x) !== -1)
    );
    const hasDiscount = (cartCheck.total_discount && cartCheck.total_discount > 0) || apps.length > 0;
    if (hasAnyOfOurs && hasDiscount) {
      ok = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!ok) {
    try {
      const cartCheck = await (await fetch('/cart.js')).json();
      const apps = cartCheck.cart_level_discount_applications || cartCheck.discount_applications || [];
      const listCodes = cartCheck.discount_codes || [];
      const appliedCodes = new Set([
        ...apps.map((app) => (app.title || app.code || '').toUpperCase()),
        ...listCodes.map((d) => (typeof d === 'string' ? d : (d.code || d.title || '')).toUpperCase())
      ]);
      const hasAnyOfOurs = codesToCheck.some((codeUpper) =>
        Array.from(appliedCodes).some((x) => x === codeUpper || x.indexOf(codeUpper) !== -1 || codeUpper.indexOf(x) !== -1)
      );
      const hasDiscount = (cartCheck.total_discount && cartCheck.total_discount > 0) || apps.length > 0;
      if (hasAnyOfOurs && hasDiscount) ok = true;
    } catch (e) { /* ignore */ }
  }
};

console.log('Bundle Offers v2: Loaded');
