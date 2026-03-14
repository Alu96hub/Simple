/* ========================================
   SIMPLE - COSMÉTICOS NATURALES
   Script Principal — v2.1 (Refactorizado)
   ======================================== */

/* === CONFIGURACIÓN Y ESTADO === */
const CONFIG = {
    adminPassword: "simple2025", // Cambia esto según prefieras
    cartKey: "simple-cart-v2",
    whatsappNumber: "5493434747844" // Reemplaza con tu número real
};

let catalog = { productos: [], promociones: [] };
let cart = JSON.parse(localStorage.getItem(CONFIG.cartKey)) || [];
let isAdmin = false;

/* === CACHE DE ELEMENTOS DOM === */
const dom = {
    cartDropdown: document.getElementById('cart-dropdown'),
    cartOverlay: document.querySelector('.cart-overlay'),
    cartItemsContainer: document.getElementById('cart-items'),
    cartCount: document.querySelector('.cart-count'),
    cartTotal: document.getElementById('cart-total-value'),
    checkoutForm: document.getElementById('checkout-form-container'),
    adminPanel: document.getElementById('admin-panel'),
    productsContainer: document.getElementById('products-container')
};

/* === 1. LÓGICA DEL CARRITO (SIDEBAR) === */

function openCart() {
    dom.cartDropdown.classList.add('active');
    dom.cartOverlay.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeCart() {
    dom.cartDropdown.classList.remove('active');
    dom.cartOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    // Al cerrar el carrito, reseteamos el formulario de checkout
    hideCheckoutForm();
}

function toggleCheckoutForm() {
    if (cart.length === 0) {
        showNotification("El carrito está vacío");
        return;
    }
    dom.checkoutForm.classList.toggle('active');
}

function hideCheckoutForm() {
    dom.checkoutForm.classList.remove('active');
}

/* === 2. GESTIÓN DE PRODUCTOS Y COMPRAS === */

function addToCart(productId, varianteId = null) {
    const product = catalog.productos.find(p => p.id === productId);
    let itemToAdd = {};

    if (product.tipo_producto === 'familia' && varianteId) {
        const variante = product.variantes.find(v => v.id === varianteId);
        itemToAdd = {
            cartKey: `${productId}-${varianteId}`,
            id: productId,
            varianteId: varianteId,
            nombre: `${product.nombre} (${variante.nombre})`,
            precio: variante.precio,
            quantity: 1
        };
    } else {
        itemToAdd = {
            cartKey: `${productId}`,
            id: productId,
            nombre: product.nombre,
            precio: product.precio,
            quantity: 1
        };
    }

    const existingIndex = cart.findIndex(item => item.cartKey === itemToAdd.cartKey);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(itemToAdd);
    }

    saveCart();
    updateCartUI();
    showNotification("Producto añadido");
}

function removeFromCart(cartKey) {
    cart = cart.filter(item => item.cartKey !== cartKey);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem(CONFIG.cartKey, JSON.stringify(cart));
}

function updateCartUI() {
    // Actualizar Contador
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    dom.cartCount.innerText = totalItems;

    // Renderizar items
    dom.cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        dom.cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío</p>';
    } else {
        cart.forEach(item => {
            subtotal += item.precio * item.quantity;
            dom.cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <p>${item.quantity} x $${item.precio.toLocaleString()}</p>
                    </div>
                    <button class="remove-item" onclick="removeFromCart('${item.cartKey}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    }

    dom.cartTotal.innerText = `$${subtotal.toLocaleString()}`;
}

/* === 3. VALIDACIÓN Y ENVÍO WHATSAPP === */

function validateAndSendWhatsApp() {
    const nombre = document.getElementById('client-name').value.trim();
    const direccion = document.getElementById('client-address').value.trim();
    const notas = document.getElementById('order-notes').value.trim();

    if (!nombre || !direccion) {
        showNotification("⚠️ Nombre y Dirección son obligatorios");
        // Resaltar campos vacíos
        if (!nombre) document.getElementById('client-name').style.borderColor = "red";
        if (!direccion) document.getElementById('client-address').style.borderColor = "red";
        return;
    }

    // Construcción del mensaje
    let mensaje = `*NUEVO PEDIDO - SIMPLE*\n\n`;
    mensaje += `*Cliente:* ${nombre}\n`;
    mensaje += `*Dirección:* ${direccion}\n`;
    if (notas) mensaje += `*Notas:* ${notas}\n`;
    mensaje += `\n*Detalle del pedido:*\n`;

    cart.forEach(item => {
        mensaje += `- ${item.quantity}x ${item.nombre} ($${(item.precio * item.quantity).toLocaleString()})\n`;
    });

    const total = dom.cartTotal.innerText;
    mensaje += `\n*TOTAL:* ${total}`;

    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

/* === 4. PANEL DE ADMINISTRACIÓN === */

function toggleAdmin() {
    if (!isAdmin) {
        const pass = prompt("Acceso Restringido. Ingrese contraseña:");
        if (pass === CONFIG.adminPassword) {
            isAdmin = true;
            dom.adminPanel.style.display = 'block';
            document.body.classList.add('modal-open');
            renderAdminProducts();
        } else {
            alert("Contraseña incorrecta");
        }
    } else {
        dom.adminPanel.style.display = 'none';
        document.body.classList.remove('modal-open');
        isAdmin = false;
    }
}

/* === 5. EVENT LISTENERS Y CARGA INICIAL === */

function setupEventListeners() {
    // Abrir/Cerrar Carrito
    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    dom.cartOverlay.addEventListener('click', closeCart);

    // Finalizar compra (Muestra el formulario dentro del carrito)
    document.getElementById('btn-go-to-checkout').addEventListener('click', toggleCheckoutForm);

    // Enviar WhatsApp
    document.getElementById('btn-send-whatsapp').addEventListener('click', validateAndSendWhatsApp);

    // Admin Access (Puedes poner un icono oculto en el footer para esto)
    document.getElementById('admin-access-btn')?.addEventListener('click', toggleAdmin);
    document.getElementById('logout-admin-btn')?.addEventListener('click', () => {
        isAdmin = false;
        dom.adminPanel.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    // Quitar borde rojo al escribir
    ['client-name', 'client-address'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            e.target.style.borderColor = '';
        });
    });
}

function showNotification(text) {
    const toast = document.createElement('div');
    toast.className = 'notification show';
    toast.innerText = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Carga de catálogo (Simulada para el ejemplo, conectar con tu JSON real)
async function init() {
    try {
        const response = await fetch('data/products.json');
        catalog = await response.json();
        renderProducts(); // Tu función de renderizado de la tienda
        updateCartUI();
        setupEventListeners();
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
    }
}

document.addEventListener('DOMContentLoaded', init);
