# طراحی دیتابیس فروشگاه اینترنتی

## 조선‌دهنده پیشنهادی
MySQL 8.0 + TypeORM (استاندارد NestJS)

## ERD (متنی)

categories (1) ----< (N) products
users (1) ----< (N) addresses
users (1) ----< (N) orders
addresses (1) ----< (1) orders (سناشپوت آدرس Zeitpunkt سفارش)
orders (1) ----< (N) order_items
products (1) ----< (N) order_items (سناشپوت نام و قیمت)

## جداول

### categories
دسته‌بندی‌های樹‌ای (هر محصول زیر یک دسته قرار می‌گیرد).
- id (PK, char(36))
- parent_id (FK -> categories.id, nullable): دسته والد؛ null برای دسته ریشه
- name (varchar, unique): نام دسته
- slug (varchar, unique): نامک برای URL
- description (text)
- is_active (boolean, default true)
- created_at, updated_at (timestamp)

### products
- id (PK, char(36))
- category_id (FK -> categories.id, not null)
- name (varchar)
- slug (varchar, unique)
- description (text)
- price (decimal, not null)
- stock (int, default 0)
- sku (varchar, unique)
- image_url (text)
- is_active (boolean, default true)
- created_at, updated_at (timestamp)

### users
- id (PK, char(36))
- email (varchar, unique, not null)
- password (varchar, not null) (هش شده)
- first_name (varchar)
- last_name (varchar)
- phone (varchar)
- avatar_url (text)
- role (varchar, default 'customer') // customer, admin
- is_active (boolean, default true)
- created_at, updated_at (timestamp)

### addresses
آدرس‌های多重 هر کاربر؛ یکی می‌تواند پیش‌فرض باشد.
- id (PK, char(36))
- user_id (FK -> users.id, not null)
- title (varchar) // مثلاً خانه، کار
- recipient_name (varchar)
- phone (varchar)
- address_line (text, not null)
- city (varchar, not null)
- province (varchar, not null)
- postal_code (varchar)
- country (varchar, default 'ایران')
- is_default (boolean, default false)
- created_at, updated_at (timestamp)

### orders
- id (PK, char(36))
- user_id (FK -> users.id, not null)
- address_id (FK -> addresses.id, not null) (سناشپوت آدرس هنگام سفارش)
- status (varchar, default 'pending') // pending, processing, shipped, delivered, cancelled
- payment_status (varchar, default 'unpaid') // unpaid, paid, refunded
- total_amount (decimal, not null)
- created_at, updated_at (timestamp)

### order_items
آیتم‌های هر سفارش با سناشپوت (در صورت تغییر قیمت محصول، تاریخچه حفظ می‌شود).
- id (PK, char(36))
- order_id (FK -> orders.id, not null)
- product_id (FK -> products.id, nullable)
- product_name_snapshot (varchar, not null)
- unit_price (decimal, not null)
- quantity (int, not null, default 1)
- total_price (decimal, not null) // unit_price * quantity
- created_at (timestamp)

## حالت‌های سفارش (status)
pending -> processing -> shipped -> delivered
                                           -> cancelled (در هر مرحله قابل انصراف تا قبل از deliver)

## ایندکس‌های پیشنهادی
- categories(parent_id)
- products(category_id, is_active)
- orders(user_id, status, created_at DESC)
- order_items(order_id)
- addresses(user_id)

## notes MySQL
- استفاده ازutf8mb4 برای پشتیبانی از فارسی
- CHAR(36) به جای UUID برای سازگاری با MySQL
-όγی-row شرطی (partial index) در MySQL پشتیبانی نمی‌شود؛ constrain "یک آدرس پیش‌فرض در هر کاربر" در لایه برنامه (service) بررسی شود.

## مراحل بعدی
1. نصب typeorm + mysql2 + @nestjs/typeorm
2. تنظیم connection در app.module.ts / config
3. ساخت Entities بر اساس این Schema
4. ساخت ماژول‌ها: categories, products, users, addresses, orders