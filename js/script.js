/* ========================================
   SIMPLE - COSMÉTICOS NATURALES
   Script Optimizado + GitHub Backend Ready
   ======================================== */

/* === CONFIGURACIÓN === */
const CONFIG = {
    adminPassword: "simple2025",
    storageKey: "simple-products",
    github: {
        // ⚠️ Reemplazá con tus datos reales después
        repo: "tu-usuario/simple-cosmeticos",
        branch: "main",
        productsPath: "data/products.json",
        token: "" // Se configura después
    },
    cacheDuration: 5 * 60 * 1000 // 5 minutos
};

/* === PRODUCTOS POR DEFECTO (24 items) === */
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Shampoo sólido", price: 1000, image: "shampoo-solido.jpg", categoria: "cabello" },
    { id: 2, name: "Crema corporal y manos", price: 1000, image: "crema-corporal-manos.jpg", categoria: "cuerpo" },
    { id: 3, name: "Crema corporal", price: 1000, image: "crema-corporal.jpg", categoria: "cuerpo" },
    { id: 4, name: "Sales terapéuticas", price: 1000, image: "sales-terapeuticas.jpg", categoria: "cuerpo" },
    { id: 5, name: "Acondicionador", price: 1000, image: "acondicionador.jpg", categoria: "cabello" },
    { id: 6, name: "Tónico facial", price: 1000, image: "tonico-facial.jpg", categoria: "rostro" },
    { id: 7, name: "After shave", price: 1000, image: "after-shave.jpg", categoria: "cuerpo" },
    { id: 8, name: "Protector térmico capilar", price: 1000, image: "protector-termico.jpg", categoria: "cabello" },
    { id: 9, name: "Repelente", price: 1000, image: "repelente.jpg", categoria: "otros" },
    { id: 10, name: "Gel de limpieza", price: 1000, image: "gel-limpieza.jpg", categoria: "rostro" },
    { id: 11, name: "Crema de limpieza facial", price: 1000, image: "crema-limpieza-facial.jpg", categoria: "rostro" },
    { id: 12, name: "Acondicionador para peinar", price: 1000, image: "acondicionador-peinar.jpg", categoria: "cabello" },
    { id: 13, name: "Perfumes", price: 1000, image: "perfumes.jpg", categoria: "otros" },
    { id: 14, name: "Lip gloss", price: 1000, image: "lip-gloss.jpg", categoria: "maquillaje" },
    { id: 15, name: "Serúm facial", price: 1000, image: "serum-facial.jpg", categoria: "rostro" },
    { id: 16, name: "Sombra", price: 1000, image: "sombra.jpg", categoria: "maquillaje" },
    { id: 17, name: "Bálsamo labial", price: 1000, image: "balsamo-labial.jpg", categoria: "rostro" },
    { id: 18, name: "Labial", price: 1000, image: "labial.jpg", categoria: "maquillaje" },
    { id: 19, name: "Jabones saponificados", price: 1000, image: "jabones-saponificados.jpg", categoria: "cuerpo" },
    { id: 20, name: "Agua micelar", price: 1000, image: "agua-micelar.jpg", categoria: "rostro" },
    { id: 21, name: "Gel contorno de ojos", price: 1000, image: "gel-contorno-ojos.jpg", categoria: "rostro" },
    { id: 22, name: "Óleo gel para dolores articulares", price: 1000, image: "oleo-gel-dolores.jpg", categoria: "otros" },
    { id: 23, name: "Crema pañalera", price: 1000, image: "crema-panalera.jpg", categoria: "otros" },
    { id: 24, name: "Crema facial", price: 1000, image: "crema-facial.jpg", categoria: "rostro" }
];

/* === ESTADO GLOBAL OPTIMIZADO === */
let products = [];
let cart = [];
let isAdmin = false;
let currentCategory = 'todos';
let domCache = {};
let renderQueue = [];
let isRendering = false;

/* === UTILIDADES DE PERFORMANCE === */

// Debounce para evitar renders excesivos
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle para eventos de scroll/click frecuentes
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

// Cache de referencias DOM (evita querySelector repetido)
function cacheDOM() {
    domCache = {
        productsContainer: document.getElementById('products-container'),
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

// DocumentFragment para renderizado en lote (menos reflows)
function renderWithFragment(items, renderFn) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const element = renderFn(item);
        if (element) fragment.appendChild(element);
    });
    return fragment;
}

/* === GESTIÓN DE DATOS: LOCALSTORAGE → GITHUB READY === */

// Cargar productos: intenta GitHub primero, fallback a localStorage
async function loadProducts() {
    // 1. Intentar cargar desde GitHub (si está configurado)
    if (CONFIG.github.token && CONFIG.github.repo) {
        try {
            const githubProducts = await fetchFromGitHub();
            if (githubProducts) {
                products = githubProducts;
                saveToLocalStorage(); // Cache local
                return;
            }
        } catch (e) {
            console.log('⚠️ GitHub no disponible, usando localStorage');
        }
    }
    
    // 2. Fallback: localStorage
    const local = localStorage.getItem(CONFIG.storageKey);
    products = local ? JSON.parse(local) : [...DEFAULT_PRODUCTS];
}

// Guardar en localStorage (cache)
function saveToLocalStorage() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(products));
    } catch (e) {
        console.warn('⚠️ No se pudo guardar en localStorage');
    }
}

// Fetch desde GitHub Raw API
async function fetchFromGitHub() {
    const url = `https://raw.githubusercontent.com/${CONFIG.github.repo}/${CONFIG.github.branch}/${CONFIG.github.productsPath}`;
    
    try {
        const response = await fetch(url, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
    } catch (error) {
        console.error('❌ Error fetch GitHub:', error);
        return null;
    }
}

// Commit a GitHub (para admin)
async function commitToGitHub(newProducts) {
    if (!CONFIG.github.token) {
        console.warn('⚠️ Token de GitHub no configurado');
        return false;
    }
    
    const url = `https://api.github.com/repos/${CONFIG.github.repo}/contents/${CONFIG.github.productsPath}`;
    
    // Primero obtener el SHA actual del archivo
    let sha = '';
    try {
        const getResp = await fetch(url, {
            headers: {
                'Authorization': `token ${CONFIG.github.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (getResp.ok) {
            const data = await getResp.json();
            sha = data.sha;
        }
    } catch (e) {
        console.log('ℹ️ Archivo no existe aún en GitHub, se creará');
    }
    
    // Preparar commit
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(newProducts, null, 2))));
    
    const body = {
        message: `🛍️ Update productos - ${new Date().toLocaleString('es-AR')}`,
        content: content,
        branch: CONFIG.github.branch
    };
    
    if (sha) body.sha = sha;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.github.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error en commit');
        }
        
        console.log('✅ Commit exitoso a GitHub');
        return true;
    } catch (error) {
        console.error('❌ Error commit GitHub:', error);
        return false;
    }
}

/* === FUNCIONES DE UTILIDAD === */
function getSortedProducts() {
    return [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS',
        minimumFractionDigits: 0 
    }).format(price).replace('ARS', '$');
}

/* === RENDERIZADO OPTIMIZADO DE PRODUCTOS === */
const debouncedRender = debounce(renderProducts, 100);

async function renderProducts(category) {
    currentCategory = category;
    const container = domCache.productsContainer;
    if (!container) return;
    
    // Filtrar y ordenar
    const filtered = category === 'todos' 
        ? getSortedProducts()
        : getSortedProducts().filter(p => p.categoria === category);

    // Mensaje vacío
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-msg">No se encontraron productos en esta categoría ✨</p>';
        return;
    }

    // Colores de categorías
    const categoryColors = {
        'cabello': '#2E8B57', 'rostro': '#4682B4', 'cuerpo': '#8B4513',
        'maquillaje': '#DDA0DD', 'otros': '#666666'
    };

    const fallbackImg = "https://via.placeholder.com/300x300/f8f8f8/FF69B4?text=Simple";

    // Renderizado con DocumentFragment (mejor performance)
    const fragment = renderWithFragment(filtered, product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        
        const catColor = categoryColors[product.categoria] || '#666';
        const imgPath = `assets/productos/${product.image}`;

        card.innerHTML = `
            <div class="product-img">
                <span class="product-category" style="background:${catColor}">
                    ${product.categoria.toUpperCase()}
                </span>
                <img src="${imgPath}" 
                     alt="${product.name}" 
                     loading="lazy"
                     onerror="this.src='${fallbackImg}'; this.onerror=null;">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">${formatPrice(product.price)}</p>
                <button class="btn-add-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            </div>
        `;
        return card;
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    // Agregar event listeners a botones "Agregar" (delegación sería mejor, pero simple por ahora)
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            addToCart(parseInt(btn.dataset.id));
        };
    });

    // Refresh admin si está activo
    if (isAdmin) renderAdminProductsList();
}

/* === CARRITO OPTIMIZADO === */
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`¡${product.name} agregado! 🛍️`);
    
    // Mini-animación en el ícono del carrito
    const cartIcon = document.querySelector('.cart-icon-container');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => cartIcon.style.transform = 'scale(1)', 150);
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
    showNotification('Producto eliminado del carrito');
}

function saveCart() {
    try {
        localStorage.setItem('simple-cart', JSON.stringify(cart));
    } catch (e) {
        console.warn('⚠️ No se pudo guardar el carrito');
    }
}

function updateCartUI() {
    const { cartCount, cartItemsContainer, cartTotalElement } = domCache;
    if (!cartCount || !cartItemsContainer || !cartTotalElement) return;
    
    // Contador con animación
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCount.textContent != totalCount) {
        cartCount.style.transform = 'scale(1.3)';
        setTimeout(() => cartCount.style.transform = 'scale(1)', 150);
    }
    cartCount.textContent = totalCount;
    cartCount.style.display = totalCount > 0 ? 'flex' : 'none';

    // Lista de items
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío ✨</p>';
    } else {
        const fragment = renderWithFragment(cart, item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} × ${formatPrice(item.price)} = <strong>${formatPrice(itemTotal)}</strong></p>
                </div>
                <i class="fas fa-trash remove-item" data-id="${item.id}" title="Eliminar"></i>
            `;
            return el;
        });
        cartItemsContainer.appendChild(fragment);
        
        // Event listeners para eliminar
        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                removeFromCart(parseInt(btn.dataset.id));
            };
        });
    }

    cartTotalElement.textContent = formatPrice(total);
}

/* === NOTIFICACIONES === */
function showNotification(msg) {
    const notif = domCache.notification;
    if (!notif) return;
    
    notif.textContent = msg;
    notif.classList.remove('show');
    // Forzar reflow para reiniciar animación
    void notif.offsetWidth;
    notif.classList.add('show');
    
    setTimeout(() => notif.classList.remove('show'), 3000);
}

/* === FUNCIONES ADMIN === */

function addProduct(name, price, image, categoria) {
    const newId = products.length > 0 
        ? Math.max(...products.map(p => p.id)) + 1 
        : 1;
    
    products.push({ 
        id: newId, 
        name: name.trim(), 
        price: parseFloat(price), 
        image: image.trim() || 'placeholder.jpg', 
        categoria,
        updatedAt: new Date().toISOString()
    });
    
    // Guardar local + intentar GitHub
    saveToLocalStorage();
    commitToGitHub(products); // Fire-and-forget
    
    debouncedRender(currentCategory);
    showNotification("✅ Producto agregado");
}

function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    
    products = products.filter(p => p.id !== id);
    saveToLocalStorage();
    commitToGitHub(products);
    
    debouncedRender(currentCategory);
    showNotification("🗑️ Producto eliminado");
}

function updateProduct(id, updates) {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return;
    
    products[idx] = { 
        ...products[idx], 
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    saveToLocalStorage();
    commitToGitHub(products);
    
    debouncedRender(currentCategory);
    showNotification("✏️ Producto actualizado");
}

function renderAdminProductsList() {
    const container = domCache.adminProductsList;
    if (!container) return;
    
    const sorted = getSortedProducts();
    
    if (sorted.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay productos registrados</p>';
        return;
    }
    
    const fragment = renderWithFragment(sorted, product => {
        const el = document.createElement('div');
        el.className = 'admin-product-item';
        el.innerHTML = `
            <img src="assets/productos/${product.image}" 
                 alt="${product.name}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/80?text=IMG'">
            <div class="admin-product-info">
                <h4>${product.name}</h4>
                <p><strong>Precio:</strong> ${formatPrice(product.price)}</p>
                <p><strong>Categoría:</strong> ${product.categoria}</p>
                <p><small>ID: #${product.id}</small></p>
            </div>
            <div class="admin-product-actions">
                <button class="btn-edit" data-id="${product.id}">✏️ Editar</button>
                <button class="btn-delete" data-id="${product.id}">🗑️ Eliminar</button>
            </div>
        `;
        return el;
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Event listeners
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.onclick = () => editProduct(parseInt(btn.dataset.id));
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = () => deleteProduct(parseInt(btn.dataset.id));
    });
}

function showAddProductForm() {
    const container = domCache.adminProductsList;
    if (!container) return;
    
    document.getElementById('new-product-form')?.remove();
    
    const form = document.createElement('div');
    form.className = 'admin-form active';
    form.id = 'new-product-form';
    form.innerHTML = `
        <h4 style="margin-bottom:15px; color:var(--rosa-principal)">+ Nuevo Producto</h4>
        <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="new-name" required placeholder="Ej: Crema hidratante">
        </div>
        <div class="form-group">
            <label>Precio *</label>
            <input type="number" id="new-price" min="0" step="100" required placeholder="1500">
        </div>
        <div class="form-group">
            <label>Imagen (archivo en assets/productos/)</label>
            <input type="text" id="new-image" placeholder="crema-hidratante.jpg">
            <small style="color:var(--texto-claro); display:block; margin-top:5px;">
                📁 Subí la imagen manualmente a la carpeta <code>assets/productos/</code>
            </small>
        </div>
        <div class="form-group">
            <label>Categoría *</label>
            <select id="new-category" required>
                <option value="cabello">Cabello</option>
                <option value="rostro">Rostro</option>
                <option value="cuerpo">Cuerpo</option>
                <option value="maquillaje">Maquillaje</option>
                <option value="otros">Otros</option>
            </select>
        </div>
        <div style="display:flex; gap:10px; margin-top:15px;">
            <button type="button" class="btn-primary" id="submit-new-product">Guardar</button>
            <button type="button" class="btn-secondary" onclick="cancelAdminForm()">Cancelar</button>
        </div>
    `;
    
    container.insertBefore(form, container.firstChild);
    
    // Event listener para guardar
    document.getElementById('submit-new-product').onclick = submitNewProduct;
}

function submitNewProduct() {
    const name = document.getElementById('new-name')?.value;
    const price = document.getElementById('new-price')?.value;
    const image = document.getElementById('new-image')?.value;
    const categoria = document.getElementById('new-category')?.value;
    
    if (name && price) {
        addProduct(name, parseFloat(price), image || 'placeholder.jpg', categoria);
        cancelAdminForm();
    } else {
        alert("⚠️ Completá nombre y precio");
    }
}

function cancelAdminForm() {
    document.getElementById('new-product-form')?.remove();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newPrice = prompt(`Nuevo precio para "${product.name}":`, product.price);
    if (newPrice && !isNaN(newPrice) && parseFloat(newPrice) >= 0) {
        updateProduct(id, { price: parseFloat(newPrice) });
    } else if (newPrice !== null) {
        alert("⚠️ Ingresa un precio válido");
    }
}

/* === EVENT LISTENERS OPTIMIZADOS === */
function setupEventListeners() {
    // Filtros con debounce
    domCache.filterBtns?.forEach(btn => {
        btn.addEventListener('click', throttle((e) => {
            domCache.filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            debouncedRender(e.currentTarget.dataset.category);
        }, 200));
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
    
    // Cerrar al click fuera
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

    // Checkout modal
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn?.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('El carrito está vacío ✨');
            return;
        }
        domCache.cartDropdown?.classList.remove('active');
        if (domCache.checkoutModal) domCache.checkoutModal.style.display = 'flex';
    });

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

function closeModal() {
    if (domCache.checkoutModal) domCache.checkoutModal.style.display = 'none';
    document.getElementById('checkout-form')?.reset();
}

function processWhatsAppOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('customer-name')?.value.trim();
    const address = document.getElementById('customer-address')?.value.trim();
    const comments = document.getElementById('customer-comments')?.value.trim();

    if (!name || !address) {
        showNotification('⚠️ Completá nombre y dirección');
        return;
    }

    let message = `¡Hola Simple! 👋 Quiero realizar un pedido:\n\n`;
    
    cart.forEach(item => {
        message += `▪️ ${item.quantity} × ${item.name} (${formatPrice(item.price * item.quantity)})\n`;
    });

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    message += `\n💰 *TOTAL: ${formatPrice(total)}*\n\n`;
    message += `👤 *Datos:*\nNombre: ${name}\nDirección: ${address}\n`;
    if (comments) message += `Nota: ${comments}\n`;
    message += `\n📍 *Zona:* Consultar disponibilidad`;

    const url = `https://wa.me/5493434747844?text=${encodeURIComponent(message)}`;
    
    // Limpiar y redirigir
    cart = [];
    saveCart();
    updateCartUI();
    closeModal();
    
    window.open(url, '_blank');
    showNotification('📱 Redirigiendo a WhatsApp...');
}

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
            showNotification("🔓 Sesión de admin iniciada");
            document.getElementById('admin-password').value = '';
        } else {
            alert("❌ Contraseña incorrecta");
        }
    });

    // Logout
    document.getElementById('logout-admin-btn')?.addEventListener('click', () => {
        isAdmin = false;
        if (domCache.adminPanel) domCache.adminPanel.style.display = 'none';
        if (domCache.productsContainer) domCache.productsContainer.style.display = '';
        document.querySelector('.categories-filter')?.style.removeProperty('display');
        
        debouncedRender(currentCategory);
        showNotification("🔒 Sesión cerrada");
    });

    // Agregar producto
    document.getElementById('add-product-btn')?.addEventListener('click', showAddProductForm);
}

/* === INICIALIZACIÓN === */
document.addEventListener('DOMContentLoaded', async () => {
    // Cache DOM
    cacheDOM();
    
    // Cargar productos (async para GitHub)
    await loadProducts();
    
    // Render inicial
    renderProducts('todos');
    updateCartUI();
    
    // Event listeners
    setupEventListeners();
    
    // Log de carga
    console.log('✅ Simple Cosméticos cargado | Productos:', products.length);
    
    // Preload de imágenes críticas (hero + primeros productos)
    if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[loading="eager"]').forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    }
});

/* === FUNCIONES GLOBALES PARA ONCLICK === */
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.cancelAdminForm = cancelAdminForm;