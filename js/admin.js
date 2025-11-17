// js/admin.js

// Глобальні змінні для форми
const API_URL = 'api/admin.php';
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const productIdInput = document.getElementById('product-id');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

document.addEventListener('DOMContentLoaded', () => {
    adminGuard(); // 1. Перевіряємо, чи адмін
    loadProducts(); // 2. Завантажуємо товари
    // loadCategories(); // 3. Завантажуємо категорії для форми (поки не реалізовано API)

    // Встановимо тимчасові категорії, доки у нас немає API для них
    setupTempCategories();

    // 4. Вішаємо обробник на форму
    productForm.addEventListener('submit', handleSubmitProduct);

    // 5. Обробник для кнопки "Скасувати редагування"
    cancelEditBtn.addEventListener('click', resetForm);
});

/**
 * 1. ОХОРОНЕЦЬ АДМІНКИ
 * Перевіряє, чи залогінений користувач є адміном
 */
async function adminGuard() {
    try {
        const response = await fetch('api/auth_check.php');

        if (!response.ok) {
            // Не залогінений (401) або інша помилка
            window.location.href = 'login.php';
            return;
        }

        const authData = await response.json();

        if (!authData.isLoggedIn || authData.user.role !== 'admin') {
            // Залогінений, але не адмін (403 Forbidden з точки зору логіки)
            alert('Access denied. Admin rights required.');
            window.location.href = 'index.php';
        }
        // Якщо все добре, скрипт продовжує роботу
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'login.php';
    }
}

/**
 * 2. ЗАВАНТАЖЕННЯ ТОВАРІВ (READ)
 * Отримує товари з API і рендерить їх у таблицю
 */
async function loadProducts() {
    try {
        const response = await fetch(API_URL, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch products');

        const products = await response.json();
        const tbody = document.getElementById('products-tbody');
        tbody.innerHTML = ''; // Очищуємо таблицю

        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', product.id);
            tr.innerHTML = `
                <td><img src="${product.image_url || 'img/placeholder.webp'}" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>${product.price}€</td>
                <td>${product.category_name}</td>
                <td class="action-buttons">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Додаємо обробники для нових кнопок
        tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
        tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));

    } catch (error) {
        console.error(error.message);
    }
}

/**
 * 3. ОБРОБКА ФОРМИ (CREATE / UPDATE)
 */
async function handleSubmitProduct(event) {
    event.preventDefault();

    const productId = productIdInput.value;
    const isUpdating = !!productId;

    // 1. Використовуємо FormData замість JSON об'єкта
    // Це автоматично збере всі поля, включаючи файл
    const formData = new FormData(productForm);

    // Додаємо ID вручну, якщо це оновлення
    if (isUpdating) {
        formData.append('id', productId);
    }

    // 2. Визначаємо URL (метод завжди POST для завантаження файлів)
    // Для оновлення ми теж використовуємо POST, бо PHP простіше так обробляє файли
    const url = 'api/admin.php'; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            // ВАЖЛИВО: Не вказуємо Content-Type header!
            // Браузер сам встановить multipart/form-data
            body: formData 
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save product');
        }

        alert(`Product ${isUpdating ? 'updated' : 'created'} successfully!`);
        resetForm();
        loadProducts();

    } catch (error) {
        alert(error.message);
    }
}

/**
 * 4. ОБРОБКА ВИДАЛЕННЯ (DELETE)
 */
async function handleDeleteClick(event) {
    const row = event.target.closest('tr');
    const productId = row.dataset.id;

    if (!confirm(`Are you sure you want to delete product ID ${productId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}?id=${productId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete product');
        }

        alert('Product deleted successfully!');
        loadProducts(); // Оновлюємо список

    } catch (error) {
        alert(error.message);
    }
}

/**
 * 5. ОБРОБКА РЕДАГУВАННЯ (Populate Form)
 * Заповнює форму даними товару, на який клікнули "Edit"
 */
function handleEditClick(event) {
    const row = event.target.closest('tr');
    const productId = row.dataset.id;

    // Знаходимо дані з таблиці
    const name = row.cells[1].textContent;
    const price = parseFloat(row.cells[2].textContent.replace('€', '')); // Прибираємо знак євро
    const category = row.cells[3].textContent;
    
    // Отримуємо поточний URL картинки з тегу <img>
    const imgTag = row.querySelector('img');
    const currentSrc = imgTag ? imgTag.getAttribute('src') : '';

    // Заповнюємо форму
    formTitle.textContent = 'Edit Product';
    productIdInput.value = productId;
    
    productForm.querySelector('#name').value = name;
    productForm.querySelector('#price').value = price;
    
    // ВАЖЛИВО: Записуємо старий шлях у приховане поле
    productForm.querySelector('#existing_image_url').value = currentSrc;
    
    // Очищуємо поле файлу (користувач ще нічого нового не обрав)
    productForm.querySelector('#image_file').value = '';

    // (Опціонально) Тут можна додати логіку для вибору категорії у селекті, 
    // але для цього треба мати ID категорії в рядку таблиці.

    cancelEditBtn.style.display = 'block';
    window.scrollTo(0, 0);
}

/**
 * Скидає форму в початковий стан (для "Add New Product")
 */
function resetForm() {
    formTitle.textContent = 'Add New Product';
    productForm.reset();
    productIdInput.value = '';
    cancelEditBtn.style.display = 'none';
}

/**
 * Тимчасова функція для заповнення категорій
 * (Бо у нас ще немає API, щоб їх отримати)
 */
function setupTempCategories() {
    const categorySelect = document.getElementById('category_id');
    categorySelect.innerHTML = ''; // Очищуємо "Loading..."

    // Дані з вашого .sql файлу
    const categories = [
        { id: 1, name: 't-shirt' },
        { id: 2, name: 'eyewear' },
        { id: 3, name: 'jeans' },
        { id: 4, name: 'hoodie' },
        { id: 5, name: 'zip hoodie' },
        { id: 6, name: 'sweatshirt' },
        { id: 7, name: 'sweatpants' },
        { id: 8, name: 'puffer jacket' },
        { id: 9, name: 'hat' },
        { id: 10, name: 'shoes' }
        // Додайте більше, якщо вони у вас є
    ];

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}