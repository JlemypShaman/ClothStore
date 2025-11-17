<?php
// db.php

// Зчитуємо змінні середовища (з Render)
$host = getenv('DB_HOST');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');
$dbname = getenv('DB_NAME');
$port = getenv('DB_PORT');

if (!$host) {
    // --- ЛОГІКА ДЛЯ ЛОКАЛЬНОГО XAMPP ---
    // Якщо змінні порожні, ми на XAMPP
    $host = "localhost";
    $user = "root";
    $pass = ""; // Ваш пароль від XAMPP
    $dbname = "clothstore";
    $port = 3307;

    // Створюємо звичайне (незахищене) з'єднання
    $conn = new mysqli($host, $user, $pass, $dbname, (int)$port);

} else {
    // --- ЛОГІКА ДЛЯ "ЖИВОГО" RENDER/TIDB (З SSL) ---

    // 1. Ініціалізуємо mysqli (але НЕ підключаємось)
    $conn = mysqli_init();

    // 2. Встановлюємо налаштування SSL
    // Ми використовуємо стандартний шлях до сертифікатів у Docker-образі Render
    $conn->ssl_set(NULL, NULL, "/etc/ssl/certs/ca-certificates.crt", NULL, NULL);

    // 3. Тепер підключаємось ЗАХИЩЕНО через real_connect
    $conn->real_connect($host, $user, $pass, $dbname, (int)$port, NULL, MYSQLI_CLIENT_SSL);
}

// Перевірка підключення (працює для обох методів)
if ($conn->connect_error) {
    die("Błąd połączenia: " . $conn->connect_error);
}
?>