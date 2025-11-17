// Глобальна змінна для всіх товарів
let productsData = [];

// Чекаємо завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    // Додаємо обробники для фільтрів і сортування
    document.querySelectorAll('.filter').forEach(f => f.addEventListener('change', applyFilterSort));
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', applyFilterSort);
});

// 1️⃣ Завантаження товарів з API
async function fetchProducts() {
    try {
        const response = await fetch('api/products.php');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        productsData = await response.json(); // Зберігаємо всі товари
        renderProducts(productsData); // Показуємо їх спочатку
    } catch (error) {
        console.error("Failed to fetch products:", error);
        const container = document.querySelector('.products');
        if (container) container.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
    }
}

// 2️⃣ Функція рендерингу товарів
function renderProducts(products) {
    const productsContainer = document.querySelector('.products');
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productCard = `
            <div class="product-card">
                <h3>${product.name} (${product.category_name})</h3>
                <img src="${product.image_url}" alt="${product.name}">
                <p>${product.description}</p>
                <p><strong>Price:</strong> ${product.price}€</p>
                <div class="product-actions">
                    <div class="quantity-selector">
                        <label for="quantity-${product.id}">Qty:</label>
                        <input type="number" id="quantity-${product.id}" class="quantity-input" value="1" min="1">
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `;
        const cardElement = document.createElement('div');
        cardElement.innerHTML = productCard;
        productsContainer.appendChild(cardElement.firstElementChild);
    });

    // Додаємо обробники на кнопки "Add to Cart"
    document.querySelectorAll('.add-to-cart-btn').forEach(button => button.addEventListener('click', handleAddToCart));
}

// 3️⃣ Функція додавання товару в кошик
async function handleAddToCart(event) {
    const button = event.target;
    const productId = button.dataset.productId;
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value, 10);

    if (quantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }

    try {
        const response = await fetch('api/add_to_cart.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });

        const result = await response.json();

        if (response.status === 401) {
            alert('You must be logged in to add items to your cart. Redirecting to login page...');
            window.location.href = 'login.php';
            return;
        }

        if (!response.ok) throw new Error(result.error || 'Failed to add item to cart');

        alert(`Item added to cart! (ID: ${productId}, Qty: ${quantity})`);
    } catch (error) {
        console.error('Add to cart failed:', error);
        alert(error.message);
    }
}

// 4️⃣ Фільтрація та сортування
function applyFilterSort() {
    const selectedCategories = Array.from(document.querySelectorAll('.filter'))
        .filter(f => f.checked)
        .map(f => f.value.toLowerCase()); // приводимо до нижнього регістру

    let filteredProducts = productsData;

    // Фільтр по категорії (також приводимо category_name до нижнього регістру)
    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedCategories.includes(p.category_name.toLowerCase()));
    }

    // Сортування
    const sortValue = document.getElementById('sort-select')?.value || 'default';
    if (sortValue === 'price-asc') filteredProducts.sort((a, b) => a.price - b.price);
    else if (sortValue === 'price-desc') filteredProducts.sort((a, b) => b.price - a.price);
    else if (sortValue === 'name-asc') filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortValue === 'name-desc') filteredProducts.sort((a, b) => b.name.localeCompare(a.name));

    renderProducts(filteredProducts);
}
