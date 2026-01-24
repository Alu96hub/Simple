// Datos de productos con URLs de imágenes de placeholder (reemplazar con tus imágenes)
const products = [
    { id: 1, name: "Shampoo sólido", price: 1000, image: "shampoo-solido.jpg" },
    { id: 2, name: "Crema corporal y manos", price: 1000, image: "crema-corporal-manos.jpg" },
    { id: 3, name: "Crema corporal", price: 1000, image: "crema-corporal.jpg" },
    { id: 4, name: "Sales terapéuticas", price: 1000, image: "sales-terapeuticas.jpg" },
    { id: 5, name: "Acondicionador", price: 1000, image: "acondicionador.jpg" },
    { id: 6, name: "Tónico facial", price: 1000, image: "tonico-facial.jpg" },
    { id: 7, name: "After shave", price: 1000, image: "after-shave.jpg" },
    { id: 8, name: "Protector térmico capilar", price: 1000, image: "protector-termico.jpg" },
    { id: 9, name: "Repelente", price: 1000, image: "repelente.jpg" },
    { id: 10, name: "Gel de limpieza", price: 1000, image: "gel-limpieza.jpg" },
    { id: 11, name: "Crema de limpieza facial", price: 1000, image: "crema-limpieza-facial.jpg" },
    { id: 12, name: "Acondicionador para peinar", price: 1000, image: "acondicionador-peinar.jpg" },
    { id: 13, name: "Perfumes", price: 1000, image: "perfumes.jpg" },
    { id: 14, name: "Lip gloss", price: 1000, image: "lip-gloss.jpg" },
    { id: 15, name: "Serúm facial", price: 1000, image: "serum-facial.jpg" },
    { id: 16, name: "Sombra", price: 1000, image: "sombra.jpg" },
    { id: 17, name: "Bálsamo labial", price: 1000, image: "balsamo-labial.jpg" },
    { id: 18, name: "Labial", price: 1000, image: "labial.jpg" },
    { id: 19, name: "Jabones saponificados", price: 1000, image: "jabones-saponificados.jpg" },
    { id: 20, name: "Agua micelar", price: 1000, image: "agua-micelar.jpg" },
    { id: 21, name: "Gel contorno de ojos", price: 1000, image: "gel-contorno-ojos.jpg" },
    { id: 22, name: "Óleo gel para dolores articulares", price: 1000, image: "oleo-gel-dolores.jpg" },
    { id: 23, name: "Crema pañalera", price: 1000, image: "crema-panalera.jpg" },
    { id: 24, name: "Crema facial", price: 1000, image: "crema-facial.jpg" }
];

// Carrito de compras
let cart = [];
let total = 0;

// DOM elements
const productsContainer = document.getElementById('products-container');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItems = document.getElementById('cart-items');
const cartToggle = document.getElementById('cart-toggle');
const cartDropdown = document.getElementById('cart-dropdown');
const checkoutBtn = document.getElementById('checkout-btn');

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
    cartToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cartDropdown.classList.toggle('active');
    });
    
    // Cerrar carrito al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!cartDropdown.contains(e.target) && !cartToggle.contains(e.target)) {
            cartDropdown.classList.remove('active');
        }
    });
});

// Renderizar productos
function renderProducts() {
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Imagen del producto (usa placeholder si no existe)
        const imageUrl = `img/${product.image}`;
        const fallbackImage = `https://via.placeholder.com/300x200/E8F5E8/2E8B57?text=${encodeURIComponent(product.name)}`;
        
        productCard.innerHTML = `
            <div class="product-img">
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
    
    // Abrir dropdown del carrito
    cartDropdown.classList.add('active');
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
    cartCount.textContent = itemCount;
    cartTotal.textContent = `$${total.toLocaleString('es-AR')}`;
    
    // Actualizar items del carrito
    updateCartItems();
}

// Actualizar items del carrito en el dropdown
function updateCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        return;
    }
    
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <p class="cart-item-name">${item.name}</p>
                <p class="cart-item-quantity">${item.quantity} x $${item.price.toLocaleString('es-AR')}</p>
            </div>
            <div>
                <p class="cart-item-total">$${(item.price * item.quantity).toLocaleString('es-AR')}</p>
                <button class="cart-item-remove" data-id="${item.id}" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    // Agregar event listeners a botones de eliminar
    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.cart-item-remove').dataset.id);
            removeFromCart(productId);
        });
    });
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
        
        // Si el carrito queda vacío, cerrar dropdown después de un momento
        if (cart.length === 0) {
            setTimeout(() => {
                cartDropdown.classList.remove('active');
            }, 2000);
        }
    }
}

// Guardar carrito en localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('simpleCart', JSON.stringify(cart));
}

// Finalizar compra (redirigir a WhatsApp)
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
        return;
    }
    
    // Construir mensaje de WhatsApp
    let message = `¡Hola Simple! Quiero realizar un pedido:\n\n`;
    message += `*Pedido de Cosméticos Naturales*\n\n`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${item.quantity} unidad${item.quantity > 1 ? 'es' : ''} - $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
    });
    
    message += `\n*TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
    message += `Mis datos:\n`;
    message += `• Nombre: \n`;
    message += `• Dirección: \n`;
    message += `• Teléfono: \n`;
    message += `• Forma de pago: Efectivo/Transferencia\n\n`;
    message += `¡Muchas gracias!`;
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Redirigir a WhatsApp
    window.open(`https://wa.me/5493435345362?text=${encodedMessage}`, '_blank');
    
    // Vaciar carrito después de enviar
    cart = [];
    updateCartDisplay();
    saveCartToLocalStorage();
    cartDropdown.classList.remove('active');
    
    // Mostrar confirmación
    showNotification('¡Pedido enviado! Serás redirigido a WhatsApp.');
});

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        if (this.getAttribute('href') === '#') return;
        
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            // Cerrar dropdown del carrito si está abierto
            cartDropdown.classList.remove('active');
            
            // Scroll suave
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Cerrar dropdown del carrito al hacer scroll
window.addEventListener('scroll', () => {
    if (cartDropdown.classList.contains('active')) {
        cartDropdown.classList.remove('active');
    }
});