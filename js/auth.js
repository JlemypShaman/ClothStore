// js/auth.js

// Чекаємо, поки DOM завантажиться
document.addEventListener('DOMContentLoaded', () => {
    // --- Визначаємо, на якій ми сторінці ---

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const profileContainer = document.querySelector('.profile-container');
    
    // --- ПЕРЕВІРКА КНОПКИ В ХЕДЕРІ ---
    // Шукаємо кнопку Logout у хедері, яка є на ВСІХ сторінках
    const logoutNavButton = document.getElementById('logout-nav-btn');

    // 1. Якщо ми на сторінці РЕЄСТРАЦІЇ
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // 2. Якщо ми на сторінці ЛОГІНУ
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 3. Якщо ми на сторінці ПРОФІЛЮ
    if (profileContainer) {
        loadProfile(); 
        
        // Обробник для кнопки Logout на самій сторінці профілю
        const logoutButton = document.getElementById('logout-button');
        logoutButton.addEventListener('click', handleLogout); 
    }

    // --- ОБРОБНИК ДЛЯ КНОПКИ В ХЕДЕРІ ---
    // 4. Якщо на сторінці є кнопка Logout у навігації
    if (logoutNavButton) {
        logoutNavButton.addEventListener('click', handleLogout);

        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handleChangePassword);
        }
    }
});

/**
 * Обробляє відправку форми реєстрації
 */
async function handleRegister(event) {
    event.preventDefault(); // Зупиняємо стандартну відправку форми

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const errorMessageEl = document.getElementById('error-message');

    try {
        // Робимо запит до нашого api/register.php
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            // Якщо сервер повернув помилку (4xx, 5xx)
            throw new Error(result.error || 'Registration failed');
        }

        // Якщо все добре (201 Created)
        alert('Registration successful! Please login.');
        window.location.href = 'login.php'; // Перекидаємо на логін

    } catch (error) {
        errorMessageEl.textContent = error.message;
        errorMessageEl.style.display = 'block';
    }
}

/**
 * Обробляє відправку форми логіну
 */
async function handleLogin(event) {
    event.preventDefault(); 

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const errorMessageEl = document.getElementById('error-message');

    try {
        // Робимо запит до нашого api/login.php
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Login failed');
        }

        // Якщо все добре (200 OK)
        // Cесія (cookie) вже встановлена сервером!
        alert('Login successful! Redirecting to your profile.');
        window.location.href = 'profile.php'; // Перекидаємо на профіль

    } catch (error) {
        errorMessageEl.textContent = error.message;
        errorMessageEl.style.display = 'block';
    }
}

/**
 * Завантажує дані для сторінки профілю
 */
async function loadProfile() {
    try {
        // Робимо запит до api/auth_check.php (Крок 6)
        const response = await fetch('api/auth_check.php');

        if (response.status === 401) {
            // Якщо 401 Unauthorized (не залогінений)
            // Це наш "JS-Охоронець"
            alert('You are not logged in. Redirecting to login page.');
            window.location.href = 'login.php';
            return;
        }

        const result = await response.json();

        if (!result.isLoggedIn) {
            // Додаткова перевірка
            window.location.href = 'login.php';
            return;
        }

        // 4. Наповнюємо сторінку даними
        document.getElementById('profile-username').textContent = result.user.username;
        document.getElementById('profile-email').textContent = result.user.email;
        document.getElementById('profile-role').textContent = result.user.role;

        // 5. Показуємо кнопку "Admin Panel", якщо це адмін
        if (result.user.role === 'admin') {
            document.getElementById('admin-button').style.display = 'block';
        }

    } catch (error) {
        console.error('Failed to load profile:', error);
        // Можливо, сервер впав
    }
}

/**
 * Обробляє натискання кнопки "Logout"
 */
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }

    try {
        // Робимо запит до нашого api/logout.php
        const response = await fetch('api/logout.php', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            alert('You have been logged out.');
            window.location.href = 'index.php'; // Повертаємо на головну
        }

    } catch (error) {
        console.error('Logout failed:', error);
    }
}
async function handleChangePassword(event) {
    event.preventDefault(); // Зупиняємо відправку

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const msgEl = document.getElementById('password-message');
    msgEl.style.display = 'none'; // Ховаємо старе повідомлення

    // Клієнтська валідація
    if (data.new_password.length < 8) {
        msgEl.textContent = 'New password must be at least 8 characters long';
        msgEl.className = 'error';
        msgEl.style.display = 'block';
        return;
    }
    if (data.new_password !== data.confirm_password) {
        msgEl.textContent = 'New passwords do not match';
        msgEl.className = 'error';
        msgEl.style.display = 'block';
        return;
    }

    try {
        // Робимо запит до нашого нового api/change_password.php
        const response = await fetch('api/change_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            // Якщо сервер повернув помилку (400, 401, 500)
            throw new Error(result.error || 'Failed to update password');
        }

        // Якщо все добре (200 OK)
        msgEl.textContent = 'Password updated successfully!';
        msgEl.className = 'success';
        msgEl.style.display = 'block';
        form.reset(); // Очищуємо форму

    } catch (error) {
        msgEl.textContent = error.message;
        msgEl.className = 'error';
        msgEl.style.display = 'block';
    }
}