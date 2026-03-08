/* ========================================
   SIMPLE - COSMÉTICOS NATURALES
   Versión Mejorada con Familias y Promociones
   ======================================== */

/* === CONFIGURACIÓN === */
const CONFIG = {
    adminPassword: "simple2025",
    storageKey: "simple-products",
    cartKey: "simple-cart",
    github: {
        repo: "Alu96hub/Simple",
        branch: "main",
        productsPath: "data/products.json",
        token: "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"
    }
};

/* === DATOS POR DEFECTO (Backup si no hay JSON) === */
const DEFAULT_DATA = {
    productos: [],
    promociones: []
};

/* === ESTADO GLOBAL === */
let appData = { productos: [], promociones: [] };
let cart = [];
let isAdmin = false;
let currentCategory = 'todos';
let domCache = {};
let currentVariantSelector = null;

/* === CACHE DOM === */
function cacheDOM() {
    domCache = {
        productsContainer: document.getElementById('products-container'),
        promosContainer: document.getElementById('promos-container'),
        cartCount: document.getElementById('cart-count'),
        cartDropdown: document.getElementById('cart-dropdown'),
        cartItemsContainer: document.getElementById('cart-items'),
        cartTotalElement: document.getElementById('cart-total-price'),
        checkoutModal: document.getElementById('checkout-modal'),
        notification: document.getElementById('notification'),
        adminPanel: document.getElementById('admin-panel'),
        adminProductsList: document.getElementById('admin-products-list'),
        filterBtns: document.querySelectorAll('.filter-btn')
    };
}

/* === FORMATO DE PRECIOS === */
function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS',
        minimumFractionDigits: 0 
    }).format(price).replace('ARS', '$');
}

/* === NOTIFICACIONES === */
function showNotification(msg, type = 'success') {
    const notif = domCache.notification;
    if (!notif) return;
    
    notif.textContent = msg;
    notif.className = `notification ${type}`;
    notif.classList.add('show');
    
    setTimeout(() => notif.classList.remove('show'), 3000);
}

/* === CARGAR DATOS === */
async function loadData() {
    try {
        // Intentar cargar desde archivo JSON externo
        const response = await fetch('data/productos.json');
        if (response.ok) {
            appData = await response.json();
        } else {
            // Fallback a localStorage
            const local = localStorage.getItem(CONFIG.storageKey);
            appData = local ? JSON.parse(local) : DEFAULT_DATA;
        }
    } catch (error) {
        console.log('Usando datos por defecto');
        appData = DEFAULT_DATA;
    }
    
    // Cargar carrito
    const savedCart = localStorage.getItem(CONFIG.cartKey);
    cart = savedCart ? JSON.parse(savedCart) : [];
}

/* === GUARDAR DATOS === */
function saveData() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(appData));
}

function saveCart() {
    localStorage.setItem(CONFIG.cartKey, JSON.stringify(cart));
}

/* === OBTENER TODOS LOS PRODUCTOS (incluyendo variantes) === */
function getAllProducts() {
    const allProducts = [];
    
    appData.productos.forEach(producto => {
        if (producto.tipo_producto === 'familia' && producto.activo) {
            producto.variantes.forEach(variante => {
                allProducts.push({
                    id: variante.id,
                    nombre: variante.nombre,
                    precio: variante.precio,
                    imagen: producto.imagen,
                    categoria: producto.categoria,
                    descripcion: producto.descripcion,
                    descuento: producto.descuento || 0,
                    familia_id: producto.id,
                    activo: true
                });
            });
        } else if (producto.activo) {
            allProducts.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                categoria: producto.categoria,
                descripcion: producto.descripcion || '',
                descuento: producto.descuento || 0,
                activo: true
            });
        }
    });
    
    return allProducts;
}

/* === RENDERIZAR PROMOCIONES === */
function renderPromociones() {
    const container = domCache.promosContainer;
    if (!container) return;
    
    const promosActivas = appData.promociones.filter(p => p.activa);
    
    if (promosActivas.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const allProducts = getAllProducts();
    
    promosActivas.forEach(promo => {
        // Calcular precio original y final
        let precioOriginal = 0;
        let productosEnPromo = [];
        
        if (promo.tipo === 'descuento_por_kit') {
            productosEnPromo = allProducts.filter(p => promo.productos_requeridos.includes(p.id));
            precioOriginal = productosEnPromo.reduce((sum, p) => sum + p.precio, 0);
        }
        
        const descuento = promo.regla_descuento.valor;
        const precioFinal = precioOriginal * (1 - descuento / 100);
        const ahorro = precioOriginal - precioFinal;
        
        const promoCard = document.createElement('div');
        promoCard.className = 'promo-card';
        
        // Usar imagen del primer producto si hay
        const imagenPromo = productosEnPromo[0]?.imagen || 'promo-default.jpg';
        
        promoCard.innerHTML = `
            <span class="promo-badge">-${descuento}%</span>
            <img src="assets/productos/${imagenPromo}" 
                 alt="${promo.nombre}" 
                 class="promo-image"
                 loading="lazy"
                 onerror="this.src='assets/productos/placeholder.jpg'">
            <div class="promo-info">
                <h3 class="promo-name">${promo.nombre}</h3>
                <p class="promo-desc">${promo.descripcion}</p>
                <div class="promo-price-info">
                    <div class="promo-original-price">${formatPrice(precioOriginal)}</div>
                    <div class="promo-final-price">
                        ${formatPrice(precioFinal)}
                        <small>c/u</small>
                    </div>
                    <div class="promo-savings">Ahorrás ${formatPrice(ahorro)}</div>
                </div>
                <button class="promo-btn" data-promo-id="${promo.id}">
                    <i class="fas fa-gift"></i> Agregar Kit
                </button>
            </div>
        `;
        
        container.appendChild(promoCard);
    });
    
    // Event listeners para botones de promo
    container.querySelectorAll('.promo-btn').forEach(btn => {
        btn.addEventListener('click', () => addPromoToCart(parseInt(btn.dataset.promoId)));
    });
}

/* === AGREGAR PROMO AL CARRITO === */
function addPromoToCart(promoId) {
    const promo = appData.promociones.find(p => p.id === promoId);
    if (!promo) return;
    
    const allProducts = getAllProducts();
    const productosPromo = allProducts.filter(p => promo.productos_requeridos.includes(p.id));
    
    // Verificar que todos los productos existen
    if (productosPromo.length !== promo.productos_requeridos.length) {
        showNotification('Error: No se encontraron todos los productos', 'error');
        return;
    }
    
    // Calcular precio con descuento
    const precioOriginal = productosPromo.reduce((sum, p) => sum + p.precio, 0);
    const descuento = promo.regla_descuento.valor;
    const precioFinal = precioOriginal * (1 - descuento / 100);
    
    // Crear un item especial de kit en el carrito
    const kitItem = {
        id: `kit_${promoId}_${Date.now()}`,
        nombre: promo.nombre,
        descripcion: promo.descripcion,
        precio: precioFinal,
        precioOriginal: precioOriginal,
        cantidad: 1,
        productos: productosPromo.map(p => ({ id: p.id, nombre: p.nombre })),
        esKit: true,
        imagen: productosPromo[0]?.imagen
    };
    
    cart.push(kitItem);
    saveCart();
    updateCartUI();
    showNotification(`✨ ¡${promo.nombre} agregado!`);
}

/* === RENDERIZAR PRODUCTOS === */
function renderProducts(category = 'todos') {
    currentCategory = category;
    const container = domCache.productsContainer;
    if (!container) return;
    
    const allProducts = getAllProducts();
    
    // Filtrar por categoría
    const filtered = category === 'todos' 
        ? allProducts
        : allProducts.filter(p => p.categoria === category);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay productos en esta categoría ✨</p>';
        return;
    }
    
    // Ordenar alfabéticamente
    filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    
    // Colores de categorías
    const categoryColors = {
        'cabello': '#2E8B57',
        'rostro': '#4682B4',
        'cuerpo': '#8B4513',
        'maquillaje': '#DDA0DD',
        'otros': '#666666'
    };
    
    const fragment = document.createDocumentFragment();
    
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        
        const catColor = categoryColors[product.categoria] || '#666';
        
        // Verificar si es parte de una familia
        const esVariante = product.familia_id !== undefined;
        
        card.innerHTML = `
            <div class="product-img">
                <span class="product-category" style="background:${catColor}">
                    ${product.categoria.toUpperCase()}
                </span>
                ${esVariante ? '<span class="product-variant-badge">Variante</span>' : ''}
                <img src="assets/productos/${product.imagen}" 
                     alt="${product.nombre}" 
                     loading="lazy"
                     onerror="this.src='assets/productos/placeholder.jpg'">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.nombre}</h3>
                <p class="product-price">${formatPrice(product.precio)}</p>
                <p class="product-desc-small">${product.descripcion.substring(0, 60)}...</p>
                <button class="btn-add-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            </div>
        `;
        
        fragment.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Event listeners para botones "Agregar"
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const product = allProducts.find(p => p.id === id);
            if (product) addToCart(product);
        });
    });
}

/* === AGREGAR AL CARRITO === */
function addToCart(product) {
    const existing = cart.find(item => 
        !item.esKit && item.id === product.id
    );
    
    if (existing) {
        existing.cantidad++;
    } else {
        cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            imagen: product.imagen,
            cantidad: 1,
            esKit: false
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`✨ ¡${product.nombre} agregado!`);
    
    // Animación en el carrito
    const cartIcon = document.querySelector('.cart-icon-container');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => cartIcon.style.transform = 'scale(1)', 150);
    }
}

/* === ELIMINAR DEL CARRITO === */
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showNotification('Producto eliminado', 'info');
}

/* === ACTUALIZAR UI DEL CARRITO === */
function updateCartUI() {
    const { cartCount, cartItemsContainer, cartTotalElement } = domCache;
    if (!cartCount || !cartItemsContainer || !cartTotalElement) return;
    
    // Actualizar contador
    const totalCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
    cartCount.textContent = totalCount;
    cartCount.style.display = totalCount > 0 ? 'flex' : 'none';
    
    // Renderizar items
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío ✨</p>';
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.precio * item.cantidad;
            total += itemTotal;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            
            if (item.esKit) {
                itemEl.innerHTML = `
                    <div class="cart-item-info kit-item">
                        <h4>🎁 ${item.nombre}</h4>
                        <p class="kit-products">Incluye: ${item.productos.map(p => p.nombre).join(', ')}</p>
                        <p>${item.cantidad} × ${formatPrice(item.precio)} = <strong>${formatPrice(itemTotal)}</strong></p>
                        <p class="original-price">Antes: ${formatPrice(item.precioOriginal)}</p>
                    </div>
                    <i class="fas fa-trash remove-item" data-index="${index}" title="Eliminar"></i>
                `;
            } else {
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <p>${item.cantidad} × ${formatPrice(item.precio)} = <strong>${formatPrice(itemTotal)}</strong></p>
                    </div>
                    <i class="fas fa-trash remove-item" data-index="${index}" title="Eliminar"></i>
                `;
            }
            
            cartItemsContainer.appendChild(itemEl);
        });
        
        // Event listeners para eliminar
        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFromCart(parseInt(btn.dataset.index));
            });
        });
    }
    
    cartTotalElement.textContent = formatPrice(total);
}

/* === PROCESAR PEDIDO POR WHATSAPP === */
function processWhatsAppOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('customer-name')?.value.trim();
    const address = document.getElementById('customer-address')?.value.trim();
    const comments = document.getElementById('customer-comments')?.value.trim();

    if (!name || !address) {
        showNotification('⚠️ Completá nombre y dirección', 'error');
        return;
    }

    let message = `¡Hola Simple! 👋 Quiero realizar un pedido:\n\n`;
    
    cart.forEach(item => {
        if (item.esKit) {
            message += `🎁 *KIT:* ${item.nombre}\n`;
            message += `   Incluye: ${item.productos.map(p => p.nombre).join(', ')}\n`;
            message += `   ${item.cantidad} × ${formatPrice(item.precio)}\n`;
        } else {
            message += `▪️ ${item.cantidad} × ${item.nombre} (${formatPrice(item.precio * item.cantidad)})\n`;
        }
    });

    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    message += `\n💰 *TOTAL: ${formatPrice(total)}*\n\n`;
    message += `👤 *Datos:*\nNombre: ${name}\nDirección: ${address}\n`;
    if (comments) message += `Nota: ${comments}\n`;

    const url = `https://wa.me/5493434747844?text=${encodeURIComponent(message)}`;
    
    // Limpiar carrito
    cart = [];
    saveCart();
    updateCartUI();
    closeModal();
    
    window.open(url, '_blank');
    showNotification('📱 Redirigiendo a WhatsApp...');
}

/* === MODAL === */
function closeModal() {
    if (domCache.checkoutModal) domCache.checkoutModal.style.display = 'none';
    document.getElementById('checkout-form')?.reset();
}

/* === EVENT LISTENERS === */
function setupEventListeners() {
    // Filtros
    domCache.filterBtns?.forEach(btn => {
        btn.addEventListener('click', (e) => {
            domCache.filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderProducts(e.currentTarget.dataset.category);
        });
    });

    // Carrito
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    
    cartBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        domCache.cartDropdown?.classList.toggle('active');
    });
    
    closeCartBtn?.addEventListener('click', () => {
        domCache.cartDropdown?.classList.remove('active');
    });
    
    // Cerrar carrito al hacer click fuera
    document.addEventListener('click', (e) => {
        if (domCache.cartDropdown?.classList.contains('active') && 
            !domCache.cartDropdown.contains(e.target) && 
            !cartBtn?.contains(e.target)) {
            domCache.cartDropdown.classList.remove('active');
        }
    });

    // Menú móvil
    const menuBtn = document.getElementById('menu-btn');
    const navbar = document.querySelector('.navbar');
    
    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', () => {
            navbar.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            icon?.classList.toggle('fa-bars');
            icon?.classList.toggle('fa-times');
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                icon?.classList.add('fa-bars');
                icon?.classList.remove('fa-times');
            });
        });
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn?.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('El carrito está vacío ✨', 'info');
            return;
        }
        domCache.cartDropdown?.classList.remove('active');
        if (domCache.checkoutModal) domCache.checkoutModal.style.display = 'flex';
    });

    // Cerrar modales
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn?.addEventListener('click', closeModal);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === domCache.checkoutModal) closeModal();
    });

    // Formulario WhatsApp
    document.getElementById('checkout-form')?.addEventListener('submit', processWhatsAppOrder);

    // Admin
    setupAdminListeners();
}

/* === ADMIN === */
function setupAdminListeners() {
    const adminAccessBtn = document.getElementById('admin-access-btn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const closeAdminLogin = document.getElementById('close-admin-login');
    
    adminAccessBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (adminLoginModal) adminLoginModal.style.display = 'flex';
    });
    
    closeAdminLogin?.addEventListener('click', () => {
        if (adminLoginModal) adminLoginModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) {
            adminLoginModal.style.display = 'none';
        }
    });

    // Login
    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password')?.value;
        
        if (password === CONFIG.adminPassword) {
            isAdmin = true;
            if (adminLoginModal) adminLoginModal.style.display = 'none';
            
            if (domCache.adminPanel) domCache.adminPanel.style.display = 'block';
            if (domCache.productsContainer) domCache.productsContainer.style.display = 'none';
            document.querySelector('.categories-filter')?.style.setProperty('display', 'none', 'important');
            
            renderAdminProductsList();
            showNotification('🔓 Sesión de admin iniciada');
            document.getElementById('admin-password').value = '';
        } else {
            alert('❌ Contraseña incorrecta');
        }
    });

    // Logout
    document.getElementById('logout-admin-btn')?.addEventListener('click', () => {
        isAdmin = false;
        if (domCache.adminPanel) domCache.adminPanel.style.display = 'none';
        if (domCache.productsContainer) domCache.productsContainer.style.display = '';
        document.querySelector('.categories-filter')?.style.removeProperty('display');
        
        renderProducts(currentCategory);
        showNotification('🔒 Sesión cerrada');
    });
}

/* === RENDER LISTA DE PRODUCTOS PARA ADMIN === */
function renderAdminProductsList() {
    const container = domCache.adminProductsList;
    if (!container) return;
    
    container.innerHTML = '<h4 style="margin-bottom:15px;">📦 Productos y Familias</h4>';
    
    appData.productos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        
        if (producto.tipo_producto === 'familia') {
            // Mostrar familia con sus variantes
            productCard.innerHTML = `
                <div class="admin-familia-header">
                    <img src="assets/productos/${producto.imagen}" 
                         alt="${producto.nombre}"
                         onerror="this.src='assets/productos/placeholder.jpg'">
                    <div class="admin-familia-info">
                        <h4>🏷️ ${producto.nombre} (Familia)</h4>
                        <p class="product-desc">${producto.descripcion}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria}</p>
                        <p><small>Activo: ${producto.activo ? '✅' : '❌'}</small></p>
                    </div>
                </div>
                <div class="admin-variantes">
                    <h5>Variantes:</h5>
                    ${producto.variantes.map(v => `
                        <div class="admin-variante-item">
                            <span>${v.nombre}</span>
                            <span>${formatPrice(v.precio)}</span>
                            <span>ID: ${v.id}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Producto simple
            productCard.innerHTML = `
                <div class="admin-product-simple">
                    <img src="assets/productos/${producto.imagen}" 
                         alt="${producto.nombre}"
                         onerror="this.src='assets/productos/placeholder.jpg'">
                    <div class="admin-product-info">
                        <h4>${producto.nombre}</h4>
                        <p class="product-desc">${producto.descripcion || ''}</p>
                        <p><strong>Precio:</strong> ${formatPrice(producto.precio)}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria}</p>
                        <p><small>Activo: ${producto.activo ? '✅' : '❌'} | ID: ${producto.id}</small></p>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(productCard);
    });
}

/* === INICIALIZACIÓN === */
document.addEventListener('DOMContentLoaded', async () => {
    // Cachear elementos DOM
    cacheDOM();
    
    // Cargar datos
    await loadData();
    
    // Renderizar todo
    renderPromociones();
    renderProducts('todos');
    updateCartUI();
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log('✅ Simple Cosméticos cargado');
    console.log('📦 Productos:', getAllProducts().length);
    console.log('🎁 Promociones:', appData.promociones.filter(p => p.activa).length);
});
