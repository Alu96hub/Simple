// Datos de productos con URLs de imágenes y categorías
const products = [
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

// Carrito de compras
let cart = [];
let total = 0;
let currentCategory = 'todos';

// DOM elements
const productsContainer = document.getElementById('products-container');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItems = document.getElementById('cart-items');
const cartToggle = document.getElementById('cart-toggle');
const cartDropdown = document.getElementById('cart-dropdown');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');
const formModal = document.getElementById('form-modal');
const closeFormBtn = document.getElementById('close-form');
const cancelFormBtn = document.getElementById('cancel-form');
const checkoutForm = document.getElementById('checkout-form');

// Detectar si es móvil
function isMobile() {
    return window.innerWidth <= 768;
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartDisplay();
    
    // Cargar carrito desde localStorage si existe
    const savedCart = localStorage.getItem('simpleCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
    
    // Configurar toggle del carrito
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCart();
        });
    }
    
    // Cerrar carrito
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }
    
    // Cerrar carrito al hacer clic en overlay
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }
    
    // Menú hamburguesa
    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            navbar.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('active');
            });
        });
    }
    
    // Formulario de checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckoutForm);
    }
    
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeCheckoutForm);
    }
    
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeCheckoutForm);
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', processCheckout);
    }
    
    // Cerrar formulario al hacer clic fuera
    formModal.addEventListener('click', (e) => {
        if (e.target === formModal) {
            closeCheckoutForm();
        }
    });
    
    // Agregar event listeners para filtros de categoría
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            setCategory(category);
        });
    });
    
    // Actualizar carrito cuando cambia el tamaño de ventana
    window.addEventListener('resize', updateCartPosition);
});

// Función para cambiar categoría
function setCategory(category) {
    currentCategory = category;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Renderizar productos filtrados
    renderProducts();
    
    // Scroll suave a los productos
    const productsSection = document.getElementById('productos');
    if (productsSection) {
        window.scrollTo({
            top: productsSection.offsetTop - 80,
            behavior: 'smooth'
        });
    }
}

// Abrir carrito (maneja móvil y desktop diferente)
function openCart() {
    cartDropdown.classList.add('active');
    
    if (isMobile()) {
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
}

// Cerrar carrito
function closeCart() {
    cartDropdown.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restaurar scroll
}

// Actualizar posición del carrito según dispositivo
function updateCartPosition() {
    // Esta función asegura que el carrito se comporte correctamente
    // cuando se cambia entre móvil y desktop
    if (!isMobile() && cartOverlay.classList.contains('active')) {
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Renderizar productos
function renderProducts() {
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '';
    
    // Filtrar productos por categoría
    const filteredProducts = currentCategory === 'todos' 
        ? products 
        : products.filter(product => product.categoria === currentCategory);
    
    // Mostrar mensaje si no hay productos en la categoría
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No hay productos en esta categoría</h3>
                <p>Prueba con otra categoría</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Imagen del producto (usa placeholder si no existe)
        const imageUrl = `assets/productos/${product.image}`;
        const fallbackImage = `https://via.placeholder.com/300x200/E8F5E8/2E8B57?text=${encodeURIComponent(product.name)}`;
        
        // Categoría con color según tipo
        const categoria = product.categoria || 'otros';
        const categoriaColors = {
            'cabello': '#2E8B57',
            'rostro': '#4682B4',
            'cuerpo': '#8B4513',
            'maquillaje': '#DDA0DD',
            'otros': '#666666'
        };
        const categoriaColor = categoriaColors[categoria] || '#666666';
        
        productCard.innerHTML = `
            <div class="product-img">
                <span class="product-category" style="background-color: ${categoriaColor}">${categoria.toUpperCase()}</span>
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='${fallbackImage}'">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toLocaleString('es-AR')}</p>
                <button class="btn-add-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-add-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.btn-add-cart').dataset.id);
            addToCart(productId);
        });
    });
}

// Agregar producto al carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    // Actualizar carrito
    updateCartDisplay();
    saveCartToLocalStorage();
    
    // Mostrar notificación
    showNotification(`¡${product.name} agregado al carrito!`);
    
    // Abrir carrito automáticamente en desktop
    if (!isMobile()) {
        openCart();
    }
}

// Actualizar cantidad de producto en carrito
function updateCartItemQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const newQuantity = cart[itemIndex].quantity + change;
        
        if (newQuantity < 1) {
            // Eliminar si la cantidad es menor a 1
            removeFromCart(productId);
        } else {
            cart[itemIndex].quantity = newQuantity;
            updateCartDisplay();
            saveCartToLocalStorage();
        }
    }
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        updateCartDisplay();
        saveCartToLocalStorage();
        
        // Mostrar notificación
        showNotification(`¡${removedItem.name} eliminado del carrito!`);
        
        // Si el carrito queda vacío, cerrar después de un momento
        if (cart.length === 0 && isMobile()) {
            setTimeout(() => {
                closeCart();
            }, 1500);
        }
    }
}

// Mostrar notificación
function showNotification(message) {
    // Eliminar notificación anterior si existe
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Actualizar display del carrito
function updateCartDisplay() {
    // Calcular total
    total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Actualizar contador
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
    if (cartCount) cartCount.textContent = itemCount;
    if (cartTotal) cartTotal.textContent = `$${total.toLocaleString('es-AR')}`;
    
    // Actualizar items del carrito
    updateCartItems();
}

// Actualizar items del carrito en el dropdown
function updateCartItems() {
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        return;
    }
    
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <p class="cart-item-name">${item.name}</p>
                <div class="cart-item-quantity">
                    <span>Cantidad:</span>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
            </div>
            <div class="cart-item-actions">
                <p class="cart-item-total">$${(item.price * item.quantity).toLocaleString('es-AR')}</p>
                <button class="cart-item-remove" data-id="${item.id}" title="Eliminar">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    // Agregar event listeners a botones de control de cantidad
    document.querySelectorAll('.quantity-btn.minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.quantity-btn').dataset.id);
            updateCartItemQuantity(productId, -1);
        });
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.quantity-btn').dataset.id);
            updateCartItemQuantity(productId, 1);
        });
    });
    
    // Agregar event listeners a botones de eliminar
    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.cart-item-remove').dataset.id);
            removeFromCart(productId);
        });
    });
}

// Guardar carrito en localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('simpleCart', JSON.stringify(cart));
}

// Abrir formulario de checkout
function openCheckoutForm() {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
        return;
    }
    
    // Cerrar carrito primero
    closeCart();
    
    // Abrir formulario
    formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Enfocar primer campo
    setTimeout(() => {
        const nameField = document.getElementById('customer-name');
        if (nameField) nameField.focus();
    }, 100);
}

// Cerrar formulario de checkout
function closeCheckoutForm() {
    formModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Limpiar formulario
    if (checkoutForm) {
        checkoutForm.reset();
    }
}

// Procesar checkout y enviar a WhatsApp
function processCheckout(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const name = document.getElementById('customer-name').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const comments = document.getElementById('customer-comments').value.trim();
    
    // Validación básica
    if (!name || !address) {
        showNotification('Por favor completa todos los campos obligatorios (*)');
        return;
    }
    
    // Construir mensaje de WhatsApp
    let message = `¡Hola Simple! Quiero realizar un pedido:\n\n`;
    message += `*PEDIDO DE COSMÉTICOS NATURALES*\n\n`;
    message += `*Productos solicitados:*\n`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${item.quantity} unidad${item.quantity > 1 ? 'es' : ''} - $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
    });
    
    message += `\n*TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
    message += `*Mis datos:*\n`;
    message += `• Nombre: ${name}\n`;
    message += `• Dirección: ${address}\n`;
    
    if (comments) {
        message += `• Comentarios: ${comments}\n`;
    }
    
    message += `• Forma de pago: Efectivo/Transferencia (coordinaremos)\n\n`;
    message += `*Zonas de entrega:* Colonia Avellaneda, Paraná, San Benito, Sauce Montrúl, María Grande\n\n`;
    message += `¡Muchas gracias! Espero tu confirmación.`;
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Redirigir a WhatsApp
    window.open(`https://wa.me/5493435345362?text=${encodedMessage}`, '_blank');
    
    // Vaciar carrito después de enviar
    cart = [];
    updateCartDisplay();
    saveCartToLocalStorage();
    
    // Cerrar formulario
    closeCheckoutForm();
    
    // Mostrar confirmación
    showNotification('¡Pedido enviado a WhatsApp! Revisa tu teléfono.');
}

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if (this.getAttribute('href') === '#') return;
        
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            // Cerrar menú hamburguesa si está abierto
            if (navbar && navbar.classList.contains('active')) {
                navbar.classList.remove('active');
            }
            
            // Scroll suave
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Cerrar menú y carrito al hacer scroll
window.addEventListener('scroll', () => {
    if (navbar && navbar.classList.contains('active')) {
        navbar.classList.remove('active');
    }
    
    // En desktop, cerrar carrito al hacer scroll
    if (!isMobile() && cartDropdown.classList.contains('active')) {
        closeCart();
    }
});