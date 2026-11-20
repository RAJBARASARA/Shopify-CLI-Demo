/*
  product-carousel.js — shared behaviour for the Figma PDP carousels.
  Renders identical Figma product cards for:
    - "You May Also Like"  -> Shopify Recommendations API (data-pc-ymal)
    - "Recently Viewed"    -> localStorage history (data-pc-recent) + a tracker
  Plus a horizontal carousel controller (arrows + pagination dots, desktop).
*/
(function () {
  'use strict';

  var STORE_KEY = 'pc_recently_viewed';
  var MAX_STORED = 20;

  var ICON_HEART =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M12 20.5C12 20.5 3.5 15.36 3.5 9.5C3.5 7.29 5.29 5.5 7.5 5.5C9.04 5.5 10.38 6.37 11.05 7.64C11.3 8.11 11.99 8.11 12.24 7.64C12.62 6.37 13.96 5.5 15.5 5.5C17.71 5.5 19.5 7.29 19.5 9.5C19.5 15.36 12 20.5 12 20.5Z" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var ICON_ARROW =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---- money ----
  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    var value = '';
    var fmt = format || '${{amount}}';
    var num = (cents || 0) / 100.0;
    function defaultTo(x, def) { return (x == null || isNaN(x)) ? def : x; }
    function thousands(number, precision, thousand, decimal) {
      precision = defaultTo(precision, 2);
      thousand = thousand || ',';
      decimal = decimal || '.';
      var n = Math.abs(number).toFixed(precision);
      var parts = precision ? n.split('.') : [n];
      var dollars = parts[0];
      var centsPart = parts[1] ? decimal + parts[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(dollars)) dollars = dollars.replace(rgx, '$1' + thousand + '$2');
      return dollars + centsPart;
    }
    var match = fmt.match(/\{\{\s*(\w+)\s*\}\}/);
    var placeholder = match ? match[1] : 'amount';
    switch (placeholder) {
      case 'amount': value = thousands(num, 2); break;
      case 'amount_no_decimals': value = thousands(num, 0); break;
      case 'amount_with_comma_separator': value = thousands(num, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = thousands(num, 0, '.', ','); break;
      case 'amount_with_space_separator': value = thousands(num, 2, ' ', ','); break;
      case 'amount_no_decimals_with_space_separator': value = thousands(num, 0, ' '); break;
      case 'amount_with_apostrophe_separator': value = thousands(num, 2, "'"); break;
      default: value = thousands(num, 2);
    }
    return fmt.replace(/\{\{\s*\w+\s*\}\}/, value);
  }
  function moneyFormat() { return window.__pcMoneyFormat || '${{amount}}'; }

  // ---- card rendering ----
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function imgUrl(src) {
    if (!src) return '';
    // request a sensible width from the Shopify CDN without breaking existing params
    if (/cdn\.shopify\.com/.test(src) && src.indexOf('width=') === -1) {
      return src + (src.indexOf('?') === -1 ? '?' : '&') + 'width=650';
    }
    return src;
  }
  function renderCard(p, opts) {
    opts = opts || {};
    var now = formatMoney(p.price, moneyFormat());
    var compare = (p.compare_at_price && p.compare_at_price > p.price) ? p.compare_at_price : null;
    var priceInner = '<span class="pc-card__price-now">' + now + '</span>';
    if (compare) {
      var pct = Math.round((1 - (p.price / compare)) * 100);
      priceInner +=
        '<span class="pc-card__price-top">' +
          '<span class="pc-card__price-was">' + formatMoney(compare, moneyFormat()) + '</span>' +
          '<span class="pc-card__badge">' + pct + '%</span>' +
        '</span>';
    }
    var media = p.featured_image
      ? '<img src="' + esc(imgUrl(p.featured_image)) + '" alt="' + esc(p.title) + '" loading="lazy" width="325" height="325">'
      : '';
    var ribbon = opts.ribbon ? '<span class="pc-card__ribbon">' + esc(opts.ribbon) + '</span>' : '';
    return (
      '<a class="pc-card" href="' + esc(p.url || ('/products/' + p.handle)) + '">' +
        '<div class="pc-card__media">' + media + ribbon +
          '<button type="button" class="pc-card__wish" aria-label="Add to wishlist" data-pc-wish>' + ICON_HEART + '</button>' +
        '</div>' +
        '<div class="pc-card__info">' +
          (p.vendor ? '<p class="pc-card__vendor">' + esc(p.vendor) + '</p>' : '') +
          '<p class="pc-card__title">' + esc(p.title) + '</p>' +
          '<div class="pc-card__price">' + priceInner + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function fillTrack(root, products, opts) {
    var track = root.querySelector('.pcarousel__track');
    if (!track) return;
    if (!products || !products.length) {
      root.setAttribute('data-pc-empty', '');
      if (root.hasAttribute('data-pc-hide-empty')) { root.style.display = 'none'; return; }
      track.innerHTML = '<p class="pcarousel__empty">' + (root.getAttribute('data-pc-empty-text') || 'Nothing to show yet.') + '</p>';
      return;
    }
    track.innerHTML = products.map(function (p) { return renderCard(p, opts); }).join('');
    wireWishlist(track);
    initCarousel(root);
  }

  function wireWishlist(scope) {
    scope.querySelectorAll('[data-pc-wish]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        btn.classList.toggle('is-active');
      });
    });
  }

  // ---- carousel controller ----
  function initCarousel(root) {
    var track = root.querySelector('.pcarousel__track');
    var prev = root.querySelector('.pcarousel__arrow--prev');
    var next = root.querySelector('.pcarousel__arrow--next');
    var dotsWrap = root.querySelector('.pcarousel__dots');
    if (!track) return;

    function step() {
      var card = track.querySelector('.pc-card');
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 20) || 20;
      return card.getBoundingClientRect().width + gap;
    }
    function pageCount() {
      var perView = Math.max(1, Math.round(track.clientWidth / step()));
      return Math.max(1, Math.ceil(track.children.length / perView));
    }
    function currentPage() {
      var perView = Math.max(1, Math.round(track.clientWidth / step()));
      return Math.round(track.scrollLeft / (step() * perView));
    }
    function buildDots() {
      if (!dotsWrap) return;
      var n = pageCount();
      dotsWrap.innerHTML = '';
      if (n <= 1) return;
      for (var i = 0; i < n; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        (function (idx) {
          b.addEventListener('click', function () {
            var perView = Math.max(1, Math.round(track.clientWidth / step()));
            track.scrollTo({ left: idx * step() * perView, behavior: 'smooth' });
          });
        })(i);
        dotsWrap.appendChild(b);
      }
      sync();
    }
    function sync() {
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (dotsWrap) {
        var cur = currentPage();
        Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
          d.classList.toggle('is-active', i === cur);
        });
      }
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', buildDots);
    buildDots();
    sync();
  }

  // ---- recently viewed storage ----
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function writeStore(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(0, MAX_STORED))); } catch (e) {}
  }
  function trackCurrent(root) {
    var raw = root.getAttribute('data-pc-current');
    if (!raw) return;
    var p;
    try { p = JSON.parse(raw); } catch (e) { return; }
    if (!p || !p.id) return;
    var list = readStore().filter(function (x) { return x.id !== p.id; });
    list.unshift(p);
    writeStore(list);
  }

  // ---- init on DOM ready ----
  function boot() {
    if (window.__pcBooted) return;
    window.__pcBooted = true;
    if (window.__pcMoneyFormat == null) {
      var holder = document.querySelector('[data-pc-money-format]');
      if (holder) window.__pcMoneyFormat = holder.getAttribute('data-pc-money-format');
    }

    // record the current product view first (any section may carry it)
    document.querySelectorAll('[data-pc-current]').forEach(trackCurrent);

    // You May Also Like
    document.querySelectorAll('[data-pc-ymal]').forEach(function (root) {
      var pid = root.getAttribute('data-pc-product-id');
      var limit = root.getAttribute('data-pc-limit') || 10;
      var intent = root.getAttribute('data-pc-intent') || 'related';
      if (!pid) { fillTrack(root, []); return; }
      var url = (window.Shopify && Shopify.routes && Shopify.routes.root ? Shopify.routes.root : '/') +
        'recommendations/products.json?product_id=' + encodeURIComponent(pid) +
        '&limit=' + encodeURIComponent(limit) + '&intent=' + encodeURIComponent(intent);
      fetch(url.replace('//recommendations', '/recommendations'))
        .then(function (r) { return r.json(); })
        .then(function (data) { fillTrack(root, (data && data.products) || [], { ribbon: root.getAttribute('data-pc-ribbon') || '' }); })
        .catch(function () { fillTrack(root, []); });
    });

    // Recently Viewed
    document.querySelectorAll('[data-pc-recent]').forEach(function (root) {
      var limit = parseInt(root.getAttribute('data-pc-limit') || '10', 10);
      var excludeId = root.getAttribute('data-pc-exclude-id');
      var list = readStore().filter(function (p) {
        return String(p.id) !== String(excludeId);
      }).slice(0, limit);
      fillTrack(root, list, { ribbon: root.getAttribute('data-pc-ribbon') || '' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
