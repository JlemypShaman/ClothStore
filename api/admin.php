<?php
// api/admin.php
    use Cloudinary\Configuration\Configuration;
    use Cloudinary\Api\Upload\UploadApi;
session_start();

// --- НАЛАШТУВАННЯ CLOUDINARY ---
// Перевіряємо, чи існує автозавантажувач (це буде працювати на Render після composer install)
$autoloadPath = __DIR__ . '/../vendor/autoload.php';

if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
    


    // Налаштовуємо Cloudinary, використовуючи змінні середовища з Render
    // Якщо змінних немає (локально), конфігурація буде порожньою, але код не впаде одразу
    if (getenv('CLOUDINARY_CLOUD_NAME')) {
        Configuration::instance([
            'cloud' => [
                'cloud_name' => getenv('CLOUDINARY_CLOUD_NAME'),
                'api_key'    => getenv('CLOUDINARY_API_KEY'),
                'api_secret' => getenv('CLOUDINARY_API_SECRET')],
            'url' => [
                'secure' => true]]);
    }
}

// --- ЗАГОЛОВКИ ---
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 1. АДМІН-ОХОРОНЕЦЬ ---
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Admin rights required.']);
    exit;
}

// 2. Підключаємо БД
require_once '../db.php'; 

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // ОТРИМАТИ ВСІ ТОВАРИ
        $sql = "SELECT p.*, c.name AS category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.id DESC"; // Нові товари зверху
        $result = $conn->query($sql);
        $products = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($products);
        break;

    case 'POST':
        // СТВОРЕННЯ АБО ОНОВЛЕННЯ ТОВАРУ (З ФОТО)
        
        // Отримуємо дані з $_POST (бо ми відправляємо FormData)
        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        $price = $_POST['price'] ?? 0;
        $category_id = $_POST['category_id'] ?? null;
        
        // ID товару (якщо є - це редагування)
        $id = $_POST['product_id_update'] ?? null; 
        // Старе фото (з прихованого поля)
        $existing_image = $_POST['image_url_hidden'] ?? '';

        // Валідація
        if (empty($name) || empty($price) || empty($category_id)) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, price, and category are required']);
            exit;
        }

        // --- ЛОГІКА ЗАВАНТАЖЕННЯ ФОТО (CLOUDINARY) ---
        $final_image_path = $existing_image; // За замовчуванням залишаємо старе

        // Перевіряємо, чи завантажено НОВИЙ файл
        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            // Перевіряємо, чи підключена бібліотека Cloudinary
            if (class_exists('Cloudinary\Api\Upload\UploadApi') && getenv('CLOUDINARY_CLOUD_NAME')) {
                try {
                    // Завантажуємо в хмару
                    $upload = (new UploadApi())->upload($_FILES['image_file']['tmp_name']);
                    $final_image_path = $upload['secure_url']; // Отримуємо https посилання
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Cloudinary Error: ' . $e->getMessage()]);
                    exit;
                }
            } else {
                // ФОЛБЕК ДЛЯ ЛОКАЛЬНОГО XAMPP (якщо немає Cloudinary)
                // Просто зберігаємо в папку img/
                $target_dir = "../img/";
                $filename = time() . '_' . basename($_FILES["image_file"]["name"]);
                if (move_uploaded_file($_FILES["image_file"]["tmp_name"], $target_dir . $filename)) {
                    $final_image_path = 'img/' . $filename;
                }
            }
        }

        if ($id) {
            // --- UPDATE (ОНОВЛЕННЯ) ---
            // Типи: s (string), s, d (double - ЦІНА), s, i (integer), i (id)
            $stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, image_url=?, category_id=? WHERE id=?");
            $stmt->bind_param('sdsdii', $name, $description, $price, $final_image_path, $category_id, $id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Update failed: ' . $stmt->error]);
            }
            $stmt->close();

        } else {
            // --- CREATE (СТВОРЕННЯ) ---
            // Типи: s, s, d (double), s, i
            $stmt = $conn->prepare("INSERT INTO products (name, description, price, image_url, category_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param('sdsdi', $name, $description, $price, $final_image_path, $category_id);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(['success' => true, 'product_id' => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Insert failed: ' . $stmt->error]);
            }
            $stmt->close();
        }
        break;

    case 'DELETE':
        // ВИДАЛЕННЯ
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Product deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Delete failed']);
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

$conn->close();
?>