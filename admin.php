<?php session_start(); ?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - ClothStore</title>
    <link rel="stylesheet" href="./css/index.css">
    <link rel="stylesheet" href="./css/admin.css">
    <link rel="stylesheet" href="./css/navbar.css">
</head>
<body>
    <?php include 'header.php'; ?>

    <div class="admin-container">

        <aside class="admin-form-container">
            <form id="product-form">
                <h3 id="form-title">Add New Product</h3>
                <input type="hidden" id="product-id" name="product_id">

                <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" required>
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description"></textarea>
                </div>

                <div class="form-group">
                    <label for="price">Price (€)</label>
                    <input type="number" id="price" name="price" step="0.01" required>
                </div>

                <div class="form-group">
                    <label for="image_file">Product Image</label>
                    <input type="file" id="image_file" name="image_file" accept="image/*">
                </div>

                <input type="hidden" id="existing_image_url" name="existing_image_url">

                <div class="form-group">
                    <label for="category_id">Category</label>
                    <select id="category_id" name="category_id" required>
                        <option value="">Loading categories...</option>
                    </select>
                </div>

                <button type="submit" class="form-button">Save Product</button>
                <button type="button" id="cancel-edit-btn" class="form-button">Cancel Edit</button>
            </form>
        </aside>

        <main class="admin-products-list">
            <h2>Manage Products</h2>
            <table id="products-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="products-tbody">
                    </tbody>
            </table>
        </main>

    </div>

    <script src="js/admin.js" defer></script>
</body>
<?php include 'footer.php'; ?>
</html>