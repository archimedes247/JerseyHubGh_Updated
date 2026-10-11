/* ============================================
   JerseyHubGh - Main Application Script
   Handles: Cart, Wishlist, Mobile Nav, Toast, Animations
   ============================================ */

(function() {
    'use strict';

    const CART_KEY = 'jh_cart';
    const WISHLIST_KEY = 'jh_wishlist';

    document.addEventListener('DOMContentLoaded', () => {
        // Render cart and wishlist pages when their containers are present.
        // The previous version called undefined initCart/initWishlist functions,
        // which stopped all click handlers from being registered.
        renderCartPage();
        renderWishlistPage();
        initMobileMenu();
        initHeaderScroll();
        initScrollAnimations();
        initBackToTop();
        initProductCards();
        initCheckoutPage();
        updateAllBadges();
    });

    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch(e) { return []; }
    }

    function saveCart(cart) {
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
        catch (error) { showToast('Your browser blocked storage. Please enable site storage and try again.', 'info'); }
        updateAllBadges();
        dispatchCartEvent();
    }

    function addToCart(product) {
        const cart = getCart();
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        saveCart(cart);
        showToast(product.name + ' added to cart!', 'success');
    }

    function removeFromCart(id) {
        let cart = getCart();
        cart = cart.filter(item => item.id !== id);
        saveCart(cart);
        renderCartPage();
        showToast('Item removed from cart', 'info');
    }

    function updateCartQty(id, delta) {
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty = (item.qty || 1) + delta;
        if (item.qty < 1) item.qty = 1;
        saveCart(cart);
        renderCartPage();
    }

    function setCartQty(id, qty) {
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty = Math.max(1, parseInt(qty) || 1);
        saveCart(cart);
        renderCartPage();
    }

    function getCartTotal() {
        return getCart().reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            return sum + (price * (item.qty || 1));
        }, 0);
    }

    function getCartCount() {
        return getCart().reduce((sum, item) => sum + (item.qty || 1), 0);
    }

    function clearCart() {
        localStorage.removeItem(CART_KEY);
        updateAllBadges();
        dispatchCartEvent();
    }

    function getWishlist() {
        try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
        catch(e) { return []; }
    }

    function saveWishlist(list) {
        try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); }
        catch (error) { showToast('Your browser blocked storage. Please enable site storage and try again.', 'info'); }
        updateAllBadges();
        updateHeartIcons();
    }

    function addToWishlist(product) {
        const list = getWishlist();
        if (!list.find(item => item.id === product.id)) {
            list.push(product);
            saveWishlist(list);
            showToast(product.name + ' added to wishlist!', 'success');
        } else {
            removeFromWishlist(product.id);
        }
    }

    function removeFromWishlist(id) {
        let list = getWishlist();
        list = list.filter(item => item.id !== id);
        saveWishlist(list);
        if (document.body.classList.contains('page-wishlist')) {
            renderWishlistPage();
        }
        showToast('Removed from wishlist', 'info');
    }

    function isInWishlist(id) {
        return getWishlist().some(item => item.id === id);
    }

    function getWishlistCount() {
        return getWishlist().length;
    }

    function updateAllBadges() {
        const cartCount = getCartCount();
        const wishCount = getWishlistCount();

        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = cartCount;
            badge.style.display = cartCount > 0 ? 'flex' : 'none';
        });

        document.querySelectorAll('.wishlist-badge').forEach(badge => {
            badge.textContent = wishCount;
            badge.style.display = wishCount > 0 ? 'flex' : 'none';
        });
    }

    function updateHeartIcons() {
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const id = btn.dataset.id;
            const icon = btn.querySelector('i');
            if (isInWishlist(id)) {
                btn.classList.add('active');
                if (icon) { icon.classList.remove('fa-regular'); icon.classList.add('fa-solid'); }
            } else {
                btn.classList.remove('active');
                if (icon) { icon.classList.remove('fa-solid'); icon.classList.add('fa-regular'); }
            }
        });
    }

    function dispatchCartEvent() {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    function initProductCards() {
        document.querySelectorAll('.product-card').forEach(card => {
            const img = card.querySelector('img');
            const nameEl = card.querySelector('h4');
            const priceEl = card.querySelector('.price') || card.querySelector('span');
            
            if (!nameEl || !priceEl) return;

            const id = card.dataset.id || slugify(nameEl.textContent);
            const name = nameEl.textContent.trim();
            const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
            const price = parseFloat(priceText) || 0;
            const image = img ? img.getAttribute('src') : '';

            card.dataset.id = id;
            card.dataset.name = name;
            card.dataset.price = price;
            card.dataset.image = image;

            if (img && !img.getAttribute('alt')) {
                img.setAttribute('alt', name);
            }

            if (!card.querySelector('.product-actions')) {
                const actions = document.createElement('div');
                actions.className = 'product-actions';
                actions.innerHTML = `
                    <button type="button" class="action-btn wishlist-btn" data-id="${id}" data-name="${escapeHtml(name)}" data-price="${price}" data-image="${escapeHtml(image)}" aria-label="Add to wishlist" title="Add to wishlist">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                    <button type="button" class="action-btn add-cart-btn" data-id="${id}" data-name="${escapeHtml(name)}" data-price="${price}" data-image="${escapeHtml(image)}" aria-label="Add ${escapeHtml(name)} to cart">
                        <i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Add to Cart
                    </button>
                `;
                card.appendChild(actions);
            }
        });

        document.addEventListener('click', (e) => {
            const wishBtn = e.target.closest('.wishlist-btn');
            const cartBtn = e.target.closest('.add-cart-btn');

            if (wishBtn) {
                e.preventDefault();
                const product = {
                    id: wishBtn.dataset.id,
                    name: wishBtn.dataset.name,
                    price: parseFloat(wishBtn.dataset.price),
                    image: wishBtn.dataset.image
                };
                addToWishlist(product);
            }

            if (cartBtn) {
                e.preventDefault();
                const product = {
                    id: cartBtn.dataset.id,
                    name: cartBtn.dataset.name,
                    price: parseFloat(cartBtn.dataset.price),
                    image: cartBtn.dataset.image
                };
                addToCart(product);
            }
        });

        updateHeartIcons();
    }

    function renderCartPage() {
        const container = document.getElementById('cart-items-container');
        const emptyState = document.getElementById('cart-empty');
        const summaryBox = document.getElementById('cart-summary');
        if (!container) return;

        const cart = getCart();

        if (cart.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (summaryBox) summaryBox.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (summaryBox) summaryBox.style.display = 'block';

        container.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-img">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
                </div>
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p class="cart-item-price">GHS ${item.price.toFixed(2)}</p>
                    <div class="qty-control">
                        <button class="qty-btn minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                        <input type="number" class="qty-input" value="${item.qty || 1}" min="1" data-id="${item.id}" aria-label="Quantity">
                        <button class="qty-btn plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <p>GHS ${((item.qty || 1) * item.price).toFixed(2)}</p>
                    <button class="remove-btn" data-id="${item.id}" aria-label="Remove item">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const subtotal = getCartTotal();
        const shipping = subtotal > 500 ? 0 : 30;
        const total = subtotal + shipping;

        const subtotalEl = document.getElementById('summary-subtotal');
        const shippingEl = document.getElementById('summary-shipping');
        const totalEl = document.getElementById('summary-total');

        if (subtotalEl) subtotalEl.textContent = 'GHS ' + subtotal.toFixed(2);
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : 'GHS ' + shipping.toFixed(2);
        if (totalEl) totalEl.textContent = 'GHS ' + total.toFixed(2);

        container.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => updateCartQty(btn.dataset.id, -1));
        });
        container.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => updateCartQty(btn.dataset.id, 1));
        });
        container.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', () => setCartQty(input.dataset.id, input.value));
        });
        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });
    }

    function renderWishlistPage() {
        const container = document.getElementById('wishlist-grid');
        const emptyState = document.getElementById('wishlist-empty');
        if (!container) return;

        const list = getWishlist();

        if (list.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = list.map(item => `
            <div class="product-card wishlist-card" data-id="${item.id}">
                <div class="product-img-wrap">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
                </div>
                <h4>${escapeHtml(item.name)}</h4>
                <span class="price">GHS ${item.price.toFixed(2)}</span>
                <div class="product-actions">
                    <button class="action-btn remove-wishlist-btn" data-id="${item.id}" aria-label="Remove from wishlist">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="action-btn add-cart-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-price="${item.price}" data-image="${escapeHtml(item.image)}" aria-label="Add to cart">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
            btn.addEventListener('click', () => removeFromWishlist(btn.dataset.id));
        });
        container.querySelectorAll('.add-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const product = {
                    id: btn.dataset.id,
                    name: btn.dataset.name,
                    price: parseFloat(btn.dataset.price),
                    image: btn.dataset.image
                };
                addToCart(product);
            });
        });
    }

    function initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('nav');
        const overlay = document.querySelector('.nav-overlay');
        if (!toggle || !nav) return;

        toggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            toggle.classList.toggle('active', isOpen);
            document.body.classList.toggle('menu-open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen);
        });

        if (overlay) {
            overlay.addEventListener('click', () => {
                nav.classList.remove('open');
                toggle.classList.remove('active');
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        }

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                toggle.classList.remove('active');
                document.body.classList.remove('menu-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function initHeaderScroll() {
        const header = document.querySelector('header');
        if (!header) return;
        window.addEventListener('scroll', () => {
            const current = window.pageYOffset;
            header.classList.toggle('scrolled', current > 50);
        }, { passive: true });
    }

    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.product-card, .category-card, .testimonial, .section-title, .deal-banner, .blog-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    function initBackToTop() {
        const btn = document.querySelector('.back-to-top');
        if (!btn) return;
        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.pageYOffset > 400);
        }, { passive: true });
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    function slugify(str) {
        return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    function initCheckoutPage() {
        const form = document.getElementById('checkout-form');
        if (!form) return;
        renderCheckoutSummary();
        const paymentSelect = form.querySelector('[name="payment"]');
        const momoDetails = document.getElementById('momo-payment-details');
        const whatsappBtn = document.getElementById('order-whatsapp');

        function updatePaymentDetails() {
            const isMomo = paymentSelect && paymentSelect.value === 'Mobile Money';
            if (momoDetails) momoDetails.hidden = !isMomo;
            if (whatsappBtn) {
                whatsappBtn.innerHTML = isMomo
                    ? '<i class="fa-brands fa-whatsapp"></i> Confirm MoMo order on WhatsApp'
                    : '<i class="fa-brands fa-whatsapp"></i> Arrange payment on WhatsApp';
            }
        }
        if (paymentSelect) paymentSelect.addEventListener('change', updatePaymentDetails);
        updatePaymentDetails();

        const copyButton = document.getElementById('copy-momo-number');
        if (copyButton) copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText('0248455506');
                showToast('Mobile Money number copied.', 'success');
            } catch (_error) {
                showToast('Please copy this number manually: 0248455506', 'info');
            }
        });

        if (whatsappBtn) whatsappBtn.addEventListener('click', async () => {
            if (!form.reportValidity()) return;
            const cart = getCart();
            if (!cart.length) { showToast('Your cart is empty.', 'info'); return; }
            const data = new FormData(form);
            const subtotal = getCartTotal();
            const shipping = subtotal > 500 ? 0 : 30;
            const total = subtotal + shipping;
            const payment = String(data.get('payment') || 'Other payment method, arrange through WhatsApp');
            const lines = cart.map(i => `- ${i.name} x${i.qty || 1} = GHS ${(i.price * (i.qty || 1)).toFixed(2)}`).join('\n');
            const message = `Hello JerseyHubGh, I would like to place an order.\n\nOrder items:\n${lines}\n\nSubtotal: GHS ${subtotal.toFixed(2)}\nEstimated delivery: ${shipping ? 'GHS '+shipping.toFixed(2) : 'FREE'}\nEstimated total: GHS ${total.toFixed(2)}\n\nCustomer: ${data.get('fullname')}\nPhone: ${data.get('phone')}\nEmail: ${data.get('email') || 'Not provided'}\nDelivery address: ${data.get('address')}, ${data.get('region')}\nPayment preference: ${payment}\n${payment === 'Mobile Money' ? 'Mobile Money account name: Abdul Rahim Mohammed\nMobile Money number: 0248455506\nI will confirm the final total and share my transaction reference with the store.' : 'Please advise and arrange the payment method with me through WhatsApp.'}\nNotes: ${data.get('notes') || 'None'}`;

            // Save order details when the site is running with its Express backend.
            // WhatsApp remains available if the backend is offline.
            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer: {
                            fullname: data.get('fullname'), phone: data.get('phone'),
                            email: data.get('email'), address: data.get('address'), region: data.get('region')
                        },
                        items: cart.map(i => ({ id: String(i.id || slugify(i.name)), name: i.name, qty: Number(i.qty || 1), price: Number(i.price) })),
                        paymentPreference: payment,
                        notes: data.get('notes') || ''
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    showToast(`Order ${result.orderId} saved. Opening WhatsApp...`, 'success');
                }
            } catch (_error) {
                // The WhatsApp order message still works if no backend is running.
            }
            window.location.href = `https://wa.me/233248455506?text=${encodeURIComponent(message)}`;
        });
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (whatsappBtn) whatsappBtn.click();
        });
    }

    function renderCheckoutSummary() {
        const box = document.getElementById('checkout-order-items');
        if (!box) return;
        const cart = getCart();
        if (!cart.length) {
            box.innerHTML = '<p>Your cart is empty. <a href="./Products.html">Continue shopping</a>.</p>';
            const submit = document.getElementById('order-whatsapp');
            if (submit) submit.disabled = true;
            return;
        }
        box.innerHTML = cart.map(item => `<div class="checkout-line"><span>${escapeHtml(item.name)} × ${item.qty || 1}</span><strong>GHS ${(item.price * (item.qty || 1)).toFixed(2)}</strong></div>`).join('');
        const subtotal = getCartTotal(), shipping = subtotal > 500 ? 0 : 30;
        const put = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
        put('checkout-subtotal', `GHS ${subtotal.toFixed(2)}`);
        put('checkout-shipping', shipping ? `GHS ${shipping.toFixed(2)}` : 'FREE');
        put('checkout-total', `GHS ${(subtotal+shipping).toFixed(2)}`);
    }

    renderCartPage();
    renderWishlistPage();

    window.JerseyHub = {
        addToCart, removeFromCart, updateCartQty, addToWishlist, removeFromWishlist,
        getCart, getWishlist, getCartTotal, showToast
    };
})();

