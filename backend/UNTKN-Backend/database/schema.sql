CREATE DATABASE IF NOT EXISTS untkn
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE untkn;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;


-- =========================================================
-- CATEGORIES
-- =========================================================

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB;


-- =========================================================
-- COLLECTIONS
-- =========================================================

CREATE TABLE collections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_collections_active (is_active)
) ENGINE=InnoDB;


-- =========================================================
-- SIZES
-- =========================================================

CREATE TABLE sizes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    INDEX idx_sizes_active (is_active)
) ENGINE=InnoDB;


-- =========================================================
-- COLORS
-- =========================================================

CREATE TABLE colors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    INDEX idx_colors_active (is_active)
) ENGINE=InnoDB;


-- =========================================================
-- PRODUCTS
-- =========================================================

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,

    category_id BIGINT UNSIGNED,
    collection_id BIGINT UNSIGNED,

    short_description VARCHAR(300),
    description TEXT,

    materials TEXT,
    care_instructions TEXT,

    base_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),

    currency VARCHAR(3) NOT NULL DEFAULT 'INR',

    published BOOLEAN NOT NULL DEFAULT FALSE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,

    seo_title VARCHAR(255),
    seo_description VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_products_collection
        FOREIGN KEY (collection_id)
        REFERENCES collections(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_products_category (category_id),
    INDEX idx_products_collection (collection_id),
    INDEX idx_products_published (published),
    INDEX idx_products_featured (featured)
) ENGINE=InnoDB;


-- =========================================================
-- PRODUCT IMAGES
-- =========================================================

CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id BIGINT UNSIGNED NOT NULL,

    image_url VARCHAR(500) NOT NULL,
    public_id VARCHAR(255),

    alt_text VARCHAR(255),

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_product_images_product (product_id),
    INDEX idx_product_images_primary (product_id, is_primary)
) ENGINE=InnoDB;


-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================

CREATE TABLE product_variants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id BIGINT UNSIGNED NOT NULL,
    size_id BIGINT UNSIGNED,
    color_id BIGINT UNSIGNED,

    sku VARCHAR(100) NOT NULL UNIQUE,

    price DECIMAL(10,2),
    stock_quantity INT NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_variants_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_variants_size
        FOREIGN KEY (size_id)
        REFERENCES sizes(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_variants_color
        FOREIGN KEY (color_id)
        REFERENCES colors(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_variants_product (product_id),
    INDEX idx_variants_size (size_id),
    INDEX idx_variants_color (color_id),
    INDEX idx_variants_stock (stock_quantity)
) ENGINE=InnoDB;


-- =========================================================
-- CARTS
-- =========================================================

CREATE TABLE carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- CART ITEMS
-- =========================================================

CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    cart_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED,

    quantity INT NOT NULL DEFAULT 1,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_cart_items_cart (cart_id),
    INDEX idx_cart_items_product (product_id),
    INDEX idx_cart_items_variant (variant_id)
) ENGINE=InnoDB;


-- =========================================================
-- WISHLISTS
-- =========================================================

CREATE TABLE wishlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_wishlists_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- WISHLIST ITEMS
-- =========================================================

CREATE TABLE wishlist_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    wishlist_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wishlist_items_wishlist
        FOREIGN KEY (wishlist_id)
        REFERENCES wishlists(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_wishlist_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_wishlist_product (wishlist_id, product_id),

    INDEX idx_wishlist_items_product (product_id)
) ENGINE=InnoDB;


-- =========================================================
-- ORDERS
-- =========================================================

CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    order_number VARCHAR(50) NOT NULL UNIQUE,

    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'INR',

    payment_status ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',

    order_status ENUM(
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    -- Shipping snapshot
    shipping_name VARCHAR(150) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_email VARCHAR(255),

    shipping_address_line1 VARCHAR(255) NOT NULL,
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) NOT NULL DEFAULT 'India',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_orders_user (user_id),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_order_status (order_status),
    INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;


-- =========================================================
-- ORDER ITEMS
-- =========================================================

CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    product_id BIGINT UNSIGNED,
    variant_id BIGINT UNSIGNED,

    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),

    size_name VARCHAR(50),
    color_name VARCHAR(50),

    quantity INT NOT NULL,

    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id),
    INDEX idx_order_items_variant (variant_id)
) ENGINE=InnoDB;


-- =========================================================
-- PAYMENTS
-- =========================================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',

    status ENUM(
        'created',
        'paid',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'created',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_payments_order (order_id),
    INDEX idx_payments_status (status)
) ENGINE=InnoDB;
