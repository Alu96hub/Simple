/* ========================================
   SIMPLE - COSMÉTICOS NATURALES
   Script Avanzado: Familias, Variantes y Promociones Automáticas
   ======================================== */

/* === CONFIGURACIÓN === */
const CONFIG = {
    adminPassword: "simple2025",
    storageKey: "simple-store-data", // Cambiado para englobar todo el JSON
    github: {
        repo: "Alu96hub/Simple",
        branch: "main",
        productsPath: "data/products.json",
        token: "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" 
    },
    cacheDuration: 5 * 60 * 1000
};

/* === ESTADO GLOBAL === */
let storeData = {
    configuracion_tienda: {},
    ofertas_banner: [],
    productos: [],
    promociones_automaticas: []
};
let cart = [];
let isAdmin = false;
let currentCategory = 'todos';
let domCache = {};

/* === UTILIDADES DE PERFORMANCE === */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function cacheDOM() {
    domCache = {
        productsContainer: document.getElementById('products-grid') || document.querySelector('.products-container'),
        offersContainer: document.getElementById('offers-display'),
        cartCount: document.getElementById('cart-count') || document.querySelector('.cart-count'),
        cartDropdown: document.getElementById('cart-dropdown') || document.querySelector('.cart-modal'),
        cartItemsContainer: document.getElementById('cart-items') || document.querySelector('.cart-items'),
        cartTotalElement: document.getElementById('cart-total-price') || document.querySelector('.cart-total strong'),
        checkoutModal: document.getElementById('checkout-modal'),
        notification: document.getElementById('notification') || document.querySelector('.notification'),
        adminPanel: document.getElementById('admin-panel'),
        adminProductsList: document.getElementById('admin-products-list'),
        filterBtns: document.querySelectorAll('.filter-btn')
    };
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS',
        minimumFractionDigits: 0 
    }).format(price).replace('ARS', '$');
}

/* === GESTIÓN DE DATOS: GITHUB & LOCALSTORAGE === */
async function loadStoreData() {
    // 1. Intentar GitHub
    if (CONFIG.github.token && CONFIG.github.repo) {
        try {
            const url = `https://raw.githubusercontent.com/${CONFIG.github.repo}/${CONFIG.github.branch}/${CONFIG.github.productsPath}`;
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
                storeData = await response.json();
                saveToLocalStorage();
                return;
            }
        } catch (e) {
            console.log('⚠️ GitHub no disponible, usando localStorage');
        }
    }
    
    // 2. Fallback LocalStorage
    const local = localStorage.getItem(CONFIG.storageKey);
    if (local) {
        storeData = JSON.parse(local);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(storeData));
    } catch (e) {
        console.warn('⚠️ Error guardando en localStorage');
    }
}

async function commitToGitHub() {
    if (!CONFIG.github.token) return false;
    const url = `https://api.github.com/repos/${CONFIG.github.repo}/contents/${CONFIG.github.productsPath}`;
    
    let sha = '';
    try {
        const getResp = await fetch(url, {
            headers: { 'Authorization': `token ${CONFIG.github.token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (getResp.ok) {
            const data = await getResp.json();
            sha = data.sha;
        }
    } catch (e) {}
    
    // Convertir utf8 a base64 correctamente
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(storeData, null, 2))));
    const body = {
        message: `🛍️ Update tienda - ${new Date().toLocaleString('es-AR')}`,
        content: content,
        branch: CONFIG.github.branch
    };
    if (sha) body.sha = sha;
    
    try {
        await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.github.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return true;
    } catch (error) {
        return false;
    }
}

/* === RENDERIZADO DE OFERTAS BANNER === */
function renderOffers() {
    if (!domCache.offersContainer) return;
    const activeOffers = (storeData.ofertas_banner || []).filter(o => o.activa);
    
    if (activeOffers.length === 0) {
        domCache.offersContainer.parentElement.style.display = 'none';
        return;
    }

    domCache.offersContainer.innerHTML = activeOffers.map(offer => `
        <div class="offer-card">
            <img src="${offer.imagen}" alt="${offer.titulo}" loading="lazy">
            <div class="offer-body">
                <h3 style="color: var(--rosa-principal); margin-bottom: 5px;">${offer.titulo}</h3>
                <p style="font-size: 0.9rem; color: var(--texto-oscuro);">${offer.descripcion}</p>
            </div>
        </div>
    `).join('');
}

/* === RENDERIZADO DE PRODUCTOS (SOPORTA FAMILIAS) === */
const debouncedRender = debounce(renderProducts, 100);

function renderProducts(category) {
    currentCategory = category;
    const container = domCache.productsContainer;
    if (!container) return;
    
    const products = storeData.productos || [];
    const filtered = category === 'todos' 
        ? products.filter(p => p.activo)
        : products.filter(p => p.activo && p.categoria === category);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-msg">No se encontraron productos ✨</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        
        let priceHtml = '';
        let variantHtml = '';
        let addBtnHtml = '';
        let defaultPrice = product.precio || 0;

        // Lógica si es Familia (tiene variantes)
        if (product.tipo_producto === 'familia' && product.variantes) {
            defaultPrice = product.variantes[0].precio;
            
            variantHtml = `
                <div class="variant-selector-container">
                    <select class="variant-select" onchange="window.updateCardPrice(this, ${product.id})">
                        ${product.variantes.map((v, i) => `
                            <option value="${v.id}" data-price="${v.precio}" data-ing="${v.ingredientes || ''}">
                                ${v.nombre}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
            addBtnHtml = `<button class="btn-add-cart" onclick="window.addFamilyToCart(${product.id}, this)">
                            <i class="fas fa-cart-plus"></i> Agregar
                          </button>`;
        } else {
            // Lógica si es Simple
            addBtnHtml = `<button class="btn-add-cart" onclick="window.addSimpleToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> Agregar
                          </button>`;
        }

        // Precios y Descuentos Visuales
        if (product.descuento > 0) {
            const finalPrice = defaultPrice * (1 - product.descuento / 100);
            priceHtml = `
                <div class="discount-badge-card">${product.descuento}% OFF</div>
                <div class="product-price-container">
                    <span class="price-old">${formatPrice(defaultPrice)}</span>
                    <span class="price-current" id="price-display-${product.id}">${formatPrice(finalPrice)}</span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="product-price-container">
                    <span class="price-current" id="price-display-${product.id}">${formatPrice(defaultPrice)}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="product-img">
                <span class="product-category">${product.categoria}</span>
                <img src="assets/productos/${product.imagen}" alt="${product.nombre}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/FFF0F5/FF69B4?text=Simple';">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.nombre}</h3>
                <p class="product-description-short" id="desc-display-${product.id}">
                    ${product.tipo_producto === 'familia' ? (product.variantes[0].ingredientes || product.descripcion_base) : (product.ingredientes || product.descripcion || '')}
                </p>
                ${variantHtml}
                ${priceHtml}
                ${addBtnHtml}
            </div>
        `;
        fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

// Función que actualiza el precio y descripción cuando cambias la variante en el select
window.updateCardPrice = function(selectElement, productId) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const newPrice = parseFloat(selectedOption.dataset.price);
    const newIng = selectedOption.dataset.ing;
    const product = storeData.productos.find(p => p.id === productId);
    
    let finalPrice = newPrice;
    if (product.descuento > 0) {
        finalPrice = newPrice * (1 - product.descuento / 100);
    }
    
    document.getElementById(`price-display-${productId}`).textContent = formatPrice(finalPrice);
    
    if (newIng) {
        document.getElementById(`desc-display-${productId}`).textContent = newIng;
    }
};

/* === MOTOR DEL CARRITO Y PROMOCIONES AUTOMÁTICAS === */
window.addSimpleToCart = function(productId) {
    const product = storeData.productos.find(p => p.id === productId);
    if (!product) return;
    
    let price = product.precio;
    if (product.descuento > 0) price = price * (1 - product.descuento / 100);

    const cartItem = {
        cartId: `simple_${product.id}`,
        baseId: product.id,
        name: product.nombre,
        price: price,
        image: product.imagen,
        quantity: 1
    };
    
    processAddToCart(cartItem);
};

window.addFamilyToCart = function(productId, btnElement) {
    const product = storeData.productos.find(p => p.id === productId);
    const select = btnElement.parentElement.querySelector('.variant-select');
    const variantId = parseInt(select.value);
    const variant = product.variantes.find(v => v.id === variantId);
    
    let price = variant.precio;
    if (product.descuento > 0) price = price * (1 - product.descuento / 100);

    const cartItem = {
        cartId: `var_${variant.id}`,
        baseId: product.id,
        variantId: variant.id,
        name: `${product.nombre} - ${variant.nombre}`,
        price: price,
        image: product.imagen,
        quantity: 1
    };
    
    processAddToCart(cartItem);
};

function processAddToCart(newItem) {
    const existing = cart.find(item => item.cartId === newItem.cartId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push(newItem);
    }
    
    saveCartLocal();
    updateCartUI();
    showNotification(`¡Agregado al carrito! 🛍️`);
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCartLocal();
    updateCartUI();
}

function saveCartLocal() {
    localStorage.setItem('simple-cart', JSON.stringify(cart));
}

function updateCartUI() {
    if (!domCache.cartItemsContainer) return;
    
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (domCache.cartCount) {
        domCache.cartCount.textContent = totalCount;
        domCache.cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    domCache.cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        domCache.cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío ✨</p>';
        if (domCache.cartTotalElement) domCache.cartTotalElement.textContent = formatPrice(0);
        return;
    }

    // Calcular Subtotal
    let subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Motor de Promociones
    let totalDiscount = 0;
    let appliedPromosText = [];
    const promos = storeData.promociones_automaticas || [];

    promos.forEach(promo => {
        if (!promo.activa) return;
        
        let hasAllRequirements = true;
        let eligibleCartItems = [];

        promo.productos_requeridos.forEach(req => {
            let foundItem;
            if (req.id_especifico) {
                foundItem = cart.find(i => i.baseId === req.id_especifico || i.variantId === req.id_especifico);
            } else if (req.base_id) {
                foundItem = cart.find(i => i.baseId === req.base_id);
            }
            
            if (!foundItem) hasAllRequirements = false;
            else eligibleCartItems.push(foundItem);
        });

        if (hasAllRequirements) {
            // Aplicar descuento a esos items
            let promoBaseValue = eligibleCartItems.reduce((sum, item) => sum + item.price, 0); 
            let discountValue = promoBaseValue * (promo.descuento_porcentaje / 100);
            totalDiscount += discountValue;
            appliedPromosText.push(`${promo.nombre} (-${formatPrice(discountValue)})`);
        }
    });

    const finalTotal = subtotal - totalDiscount;

    // Render Items
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <img src="assets/productos/${item.image}" alt="${item.name}">
            <div class="cart-item-info" style="flex:1;">
                <h4>${item.name}</h4>
                <p>${item.quantity} × ${formatPrice(item.price)}</p>
            </div>
            <i class="fas fa-trash remove-item" style="color:red; cursor:pointer;" onclick="removeFromCart('${item.cartId}')"></i>
        `;
        domCache.cartItemsContainer.appendChild(el);
    });

    // Render Promos
    if (appliedPromosText.length > 0) {
        const promoDiv = document.createElement('div');
        promoDiv.style.padding = '10px';
        promoDiv.style.background = '#e8f5e9';
        promoDiv.style.borderRadius = '8px';
        promoDiv.style.marginTop = '10px';
        promoDiv.innerHTML = `<p style="color:#2e7d32; font-weight:bold; font-size:0.9rem; margin-bottom:5px;">Promociones aplicadas:</p>
                              <ul style="color:#2e7d32; font-size:0.85rem;">
                                ${appliedPromosText.map(t => `<li>✅ ${t}</li>`).join('')}
                              </ul>`;
        domCache.cartItemsContainer.appendChild(promoDiv);
    }

    if (domCache.cartTotalElement) {
        domCache.cartTotalElement.innerHTML = `
            ${totalDiscount > 0 ? `<span style="text-decoration:line-through; font-size:0.9rem; color:#999; display:block;">Subtotal: ${formatPrice(subtotal)}</span>` : ''}
            ${formatPrice(finalTotal)}
        `;
    }
}

/* === CHECKOUT Y WHATSAPP === */
function processWhatsAppOrder(e) {
    e.preventDefault();
    const name = document.getElementById('customer-name')?.value.trim() || 'Cliente';
    const address = document.getElementById('customer-address')?.value.trim() || 'Retiro';
    
    let message = `¡Hola Simple! 👋 Mi nombre es ${name}.\nQuiero realizar el siguiente pedido:\n\n`;
    
    let subtotal = 0;
    cart.forEach(item => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        message += `▪️ ${item.quantity}x *${item.name}* -> ${formatPrice(lineTotal)}\n`;
    });

    // Calcular descuentos igual que en UI
    let totalDiscount = 0;
    const promos = storeData.promociones_automaticas || [];
    promos.forEach(promo => {
        if (!promo.activa) return;
        let hasAllRequirements = true;
        let eligibleCartItems = [];
        promo.productos_requeridos.forEach(req => {
            let foundItem = req.id_especifico ? cart.find(i => i.baseId === req.id_especifico || i.variantId === req.id_especifico) : cart.find(i => i.baseId === req.base_id);
            if (!foundItem) hasAllRequirements = false;
            else eligibleCartItems.push(foundItem);
        });
        if (hasAllRequirements) {
            let promoBaseValue = eligibleCartItems.reduce((sum, item) => sum + item.price, 0); 
            let discountValue = promoBaseValue * (promo.descuento_porcentaje / 100);
            totalDiscount += discountValue;
            message += `\n🎁 *Promo Aplicada:* ${promo.nombre} (-${formatPrice(discountValue)})`;
        }
    });

    const finalTotal = subtotal - totalDiscount;
    message += `\n\n💰 *TOTAL A PAGAR: ${formatPrice(finalTotal)}*`;
    message += `\n📍 Dirección de entrega: ${address}`;

    const phone = storeData.configuracion_tienda?.whatsapp || CONFIG.config.whatsapp || "5493430000000";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    cart = [];
    saveCartLocal();
    updateCartUI();
    document.getElementById('checkout-modal').style.display = 'none';
    window.open(url, '_blank');
}

/* === NOTIFICACIONES === */
function showNotification(msg) {
    if (!domCache.notification) return;
    domCache.notification.textContent = msg;
    domCache.notification.classList.remove('show');
    void domCache.notification.offsetWidth;
    domCache.notification.classList.add('show');
    setTimeout(() => domCache.notification.classList.remove('show'), 3000);
}

/* === INICIALIZACIÓN === */
document.addEventListener('DOMContentLoaded', async () => {
    cacheDOM();
    
    // Recuperar carrito local
    const savedCart = localStorage.getItem('simple-cart');
    if (savedCart) cart = JSON.parse(savedCart);

    await loadStoreData();
    renderOffers();
    renderProducts('todos');
    updateCartUI();

    // Filtros
    domCache.filterBtns?.forEach(btn => {
        btn.addEventListener('click', (e) => {
            domCache.filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            debouncedRender(e.currentTarget.dataset.category);
        });
    });

    // Modales de carrito
    document.getElementById('cart-btn')?.addEventListener('click', () => domCache.cartDropdown?.classList.add('active'));
    document.getElementById('close-cart')?.addEventListener('click', () => domCache.cartDropdown?.classList.remove('active'));
    document.getElementById('checkout-form')?.addEventListener('submit', processWhatsAppOrder);
});
