/**
 * Enhanced Add to Cart Button
 * Listens for bundle selection changes and updates the price display on the button
 */

class EnhancedAddToCartComponent extends HTMLElement {
  constructor() {
    super();
    this.priceElement = this.querySelector('[data-enhanced-atc-price]');
    this.comparePriceElement = this.querySelector('[data-enhanced-atc-compare-price]');
    this.initializeListeners();
  }

  connectedCallback() {
    if (typeof console !== 'undefined' && console.log) {
      console.log('Enhanced Add to Cart: Initialized');
    }
  }

  initializeListeners() {
    document.addEventListener('bundle:selected', (event) => {
      this.updatePrice(event.detail);
    });

    document.addEventListener('variant:update', (event) => {
      if (event.detail && event.detail.price) {
        this.updatePriceValue(event.detail.price);
      }
    });
  }

  updatePrice(bundleData) {
    if (!this.priceElement) return;

    const price = bundleData.price || bundleData.formattedPrice;
    const comparePrice = bundleData.comparePrice || bundleData.formattedComparePrice;

    if (price) {
      if (typeof price === 'string' && (price.includes('$') || price.includes('₱') || price.match(/^[^\d\s]/))) {
        this.priceElement.textContent = price;
      } else {
        this.updatePriceValue(price);
      }
    }

    if (this.comparePriceElement && comparePrice) {
      if (typeof comparePrice === 'string' && (comparePrice.includes('$') || comparePrice.includes('₱') || comparePrice.match(/^[^\d\s]/))) {
        this.comparePriceElement.textContent = comparePrice;
      } else {
        this.comparePriceElement.textContent = this.formatMoney(comparePrice);
      }
    }
  }

  updatePriceValue(priceInCents) {
    if (!this.priceElement) return;
    this.priceElement.textContent = this.formatMoney(priceInCents);
  }

  formatMoney(cents) {
    if (typeof cents === 'string') {
      cents = parseFloat(cents.replace(/[^0-9.-]+/g, ''));
    }
    const amount = (cents / 100).toFixed(2);
    const existingPrice = document.querySelector('.price-item--regular .price, .product__price .price, [data-enhanced-atc-price]');
    let currencySymbol = '$';
    if (existingPrice) {
      const priceText = existingPrice.textContent.trim();
      const symbolMatch = priceText.match(/^[^\d\s]+/);
      if (symbolMatch) currencySymbol = symbolMatch[0];
    }
    return `${currencySymbol}${amount}`;
  }
}

if (!customElements.get('enhanced-add-to-cart-component')) {
  customElements.define('enhanced-add-to-cart-component', EnhancedAddToCartComponent);
}
