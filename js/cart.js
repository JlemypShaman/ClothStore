// js/cart.js

// Чекаємо, поки вся HTML-сторінка завантажиться
document.addEventListener('DOMContentLoaded', () => {
    loadCart();

    // Знаходимо кнопку "Оформити замовлення" і вішаємо обробник події
    const checkoutButton = document.getElementById('checkout-button');
    checkoutButton.addEventListener('click', handleCheckout);
});

// Функція завантаження кошика
async function loadCart() {
    // Знаходимо елементи на сторінці
    const itemsContainer = document.getElementById('cart-items-container');
    const emptyMsg = document.getElementById('cart-empty-msg');
    const totalElement = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');

    try {
        // 1. Робимо запит до нашого API, яке ми створили на Кроці 8.2
        // Ми не передаємо user_id, тому що PHP сам знає його з сесії
        const response = await fetch('api/get_cart.php');

        if (!response.ok) {
            // 401 Unauthorized (користувач не залогінений)
            if (response.status === 401) {
                // Перенаправляємо на сторінку входу
                window.location.href = 'login.php';
                return; // Зупиняємо виконання скрипта
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 2. Отримуємо дані у форматі JSON
        const cartData = await response.json();

        // Очищуємо контейнер (видаляємо заглушку "Your cart is empty")
        itemsContainer.innerHTML = '';

        if (cartData.items.length === 0) {
            // Якщо кошик порожній
            emptyMsg.style.display = 'block'; // Показуємо повідомлення
            checkoutButton.disabled = true; // Вимикаємо кнопку
        } else {
            // Якщо в кошику є товари
            emptyMsg.style.display = 'none'; // Ховаємо повідомлення
            checkoutButton.disabled = false; // Вмикаємо кнопку

            // 3. Перебираємо кожен товар і створюємо для нього HTML
            cartData.items.forEach(item => {
                const itemTotalPrice = (item.price * item.quantity).toFixed(2);

                const cartItemHTML = `
                    <div class="cart-item">
                        <img src="${item.image_url}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>Price: ${item.price}€</p>
                        </div>
                        <div class="cart-item-quantity">x${item.quantity}</div>
                        <div class="cart-item-price">${itemTotalPrice}€</div>
                    </div>
                `;
                itemsContainer.innerHTML += cartItemHTML;
            });
        }

        // 4. Оновлюємо загальну суму
        totalElement.textContent = `Total: ${cartData.totalPrice.toFixed(2)}€`;

    } catch (error) {
        console.error("Failed to load cart:", error);
        itemsContainer.innerHTML = '<p class="error">Failed to load your cart. Please try again later.</p>';
    }
}

// Функція оформлення замовлення
async function handleCheckout() {
    const checkoutButton = document.getElementById('checkout-button');
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Processing...';

    try {
        // 1. Робимо запит до нашого API (Крок 8.3)
        const response = await fetch('api/checkout.php', {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // 2. Якщо все успішно
        if (result.success) {
            alert(`Order placed successfully! Your Order ID is: ${result.order_id}`);
            // Оновлюємо кошик (він тепер має бути порожній)
            loadCart(); 
        }

    } catch (error) {
        console.error("Failed to checkout:", error);
        alert('Failed to place order. Please try again.');
    } finally {
        // Повертаємо кнопку в нормальний стан
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Proceed to Checkout';
    }
}
