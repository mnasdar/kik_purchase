# Sistem Manajemen Purchasing

Aplikasi manajemen purchasing berbasis web yang dibangun menggunakan Laravel Framework. Sistem ini dirancang untuk mengelola proses pembelian dari Purchase Request (PR) hingga pembayaran invoice secara komprehensif.

## 📋 Daftar Isi

- [Tentang Aplikasi](#tentang-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi dan Konfigurasi](#instalasi-dan-konfigurasi)
- [Struktur Aplikasi](#struktur-aplikasi)
- [Manfaat](#manfaat)
- [Lisensi](#lisensi)

## 🎯 Tentang Aplikasi

Sistem Manajemen Purchasing adalah solusi terintegrasi untuk mengelola seluruh siklus pengadaan barang dan jasa dalam sebuah organisasi. Aplikasi ini menyediakan fitur lengkap mulai dari pembuatan permintaan pembelian, pembuatan purchase order, hingga pengelolaan invoice dan pembayaran.

## ✨ Fitur Utama

### 1. **Purchase Request (PR)**
- Pembuatan dan pengelolaan permintaan pembelian
- Tracking status PR
- Detail item per PR
- Soft delete dan restore PR

### 2. **Purchase Order (PO)**
- Konversi PR menjadi PO
- Manajemen PO Regular dan PO Onsite
- Detail item per PO
- Bulk operations (edit, delete)
- Analytics PO

### 3. **Invoice Management**
- Penerimaan invoice dari vendor
- Pengajuan invoice ke Finance
- History pengajuan invoice
- Tracking status pembayaran
- Bulk operations untuk efisiensi

### 4. **Payment Management**
- Pencatatan pembayaran oleh Finance
- Tracking status pembayaran
- Laporan pembayaran

### 5. **Master Data Configuration**
- Manajemen Supplier
- Manajemen Lokasi
- Manajemen Klasifikasi Barang

### 6. **Access Management**
- Manajemen User
- Role & Permission menggunakan Spatie Laravel Permission
- Activity Log untuk audit trail

### 7. **Dashboard & Reporting**
- Dashboard dengan analytics
- Export data ke Excel
- Visualisasi data purchasing

## 🛠️ Teknologi yang Digunakan

- **Framework**: Laravel 10.x
- **PHP**: ^8.1
- **Database**: SQLite (default), support MySQL/PostgreSQL
- **Frontend**: 
  - Vite (build tool)
  - TailwindCSS (styling)
  - Ziggy (route helper)
- **Cache**: Redis (optional)
- **Excel Export**: Maatwebsite Excel
- **Permission**: Spatie Laravel Permission
- **Activity Log**: Spatie Laravel Activity Log

## 📦 Persyaratan Sistem

- PHP >= 8.1
- Composer
- Node.js & NPM
- Redis (optional, untuk caching)
- SQLite/MySQL/PostgreSQL

## ⚙️ Instalasi dan Konfigurasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd purchasing
```

### 2. Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 3. Konfigurasi Environment
```bash
# Copy file environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Konfigurasi Database

Edit file `.env` dan sesuaikan konfigurasi database:

**Untuk SQLite (Default):**
```env
DB_CONNECTION=sqlite
```

**Untuk MySQL:**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database
DB_USERNAME=username
DB_PASSWORD=password
```

### 5. Jalankan Migration & Seeder
```bash
# Jalankan migration
php artisan migrate

# Jalankan seeder (jika ada)
php artisan db:seed
```

### 6. Konfigurasi Redis (Optional)
Jika menggunakan Redis untuk caching:
```env
CACHE_DRIVER=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 7. Build Assets
```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Jalankan Aplikasi
```bash
# Menggunakan artisan serve
php artisan serve

# Atau menggunakan batch file (jika tersedia)
purchasing_serve.bat
```

Aplikasi akan berjalan di `http://localhost:8000`

### 9. Setup Permission & Roles
```bash
# Publish config permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Clear cache
php artisan cache:clear
php artisan config:clear
```

## 📁 Struktur Aplikasi

### Struktur Direktori Utama

```
purchasing/
├── app/
│   ├── Console/              # Artisan commands
│   ├── Exceptions/           # Exception handlers
│   ├── Exports/              # Export classes (Excel)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Access/       # User & role management
│   │   │   ├── Auth/         # Authentication
│   │   │   ├── Config/       # Master data (Supplier, Location, Classification)
│   │   │   ├── Invoice/      # Invoice management
│   │   │   ├── Purchase/     # PR & PO management
│   │   │   ├── DashboardController.php
│   │   │   └── ExportController.php
│   │   ├── Middleware/       # Custom middleware
│   │   └── Requests/         # Form requests validation
│   ├── Models/
│   │   ├── Config/           # Models: Supplier, Location, Classification
│   │   ├── Invoice/          # Models: Invoice, Payment
│   │   ├── Purchase/         # Models: PR, PO, Items
│   │   └── User.php
│   └── Providers/            # Service providers
├── bootstrap/                # Bootstrap files
├── config/                   # Configuration files
│   ├── activitylog.php      # Activity log config
│   ├── permission.php       # Permission config
│   ├── excel.php            # Excel export config
│   └── ...
├── database/
│   ├── migrations/          # Database migrations
│   ├── seeders/             # Database seeders
│   └── *.csv                # Import data files
├── public/                   # Public assets
├── resources/
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   ├── scss/                # SCSS files
│   └── views/               # Blade templates
├── routes/
│   ├── web.php              # Web routes
│   ├── api.php              # API routes
│   └── auth.php             # Authentication routes
├── storage/                  # Storage files
├── tests/                    # Unit & feature tests
├── .env.example             # Environment example
├── composer.json            # PHP dependencies
├── package.json             # Node dependencies
├── vite.config.js           # Vite configuration
└── tailwind.config.js       # TailwindCSS configuration
```

### Penjelasan Modul Utama

#### 1. **Purchase Module** (`app/Http/Controllers/Purchase/`)
- `PurchaseRequestController`: Mengelola Purchase Request
- `PurchaseOrderController`: Mengelola Purchase Order
- `PurchaseOrderOnsiteController`: Mengelola PO Onsite

#### 2. **Invoice Module** (`app/Http/Controllers/Invoice/`)
- `DariVendorController`: Penerimaan invoice dari vendor
- `PengajuanController`: Pengajuan invoice ke finance
- `PembayaranController`: Pencatatan pembayaran

#### 3. **Config Module** (`app/Http/Controllers/Config/`)
- `SupplierController`: Manajemen data supplier
- `LocationController`: Manajemen data lokasi
- `ClassificationController`: Manajemen klasifikasi barang

#### 4. **Access Module** (`app/Http/Controllers/Access/`)
- `ManajemenUserController`: Manajemen user
- `RolesController`: Manajemen roles & permissions
- `LogAktivitasController`: Activity log audit trail

## 🎁 Manfaat

### 1. **Efisiensi Operasional**
- Otomasi proses purchasing dari PR hingga pembayaran
- Mengurangi kesalahan manual dan duplikasi data
- Proses approval dan tracking yang terstruktur

### 2. **Transparansi dan Kontrol**
- Tracking real-time status PR dan PO
- Activity log untuk audit trail lengkap
- Dashboard analytics untuk monitoring performa

### 3. **Pengelolaan Data Terpusat**
- Master data supplier, lokasi, dan klasifikasi tersentralisasi
- History lengkap transaksi purchasing
- Data invoice dan pembayaran terintegrasi

### 4. **Peningkatan Akurasi**
- Validasi data otomatis
- Standarisasi proses purchasing
- Mengurangi human error

### 5. **Kemudahan Pelaporan**
- Export data ke Excel dengan mudah
- Dashboard dengan visualisasi data
- Laporan purchasing analytics

### 6. **Keamanan dan Akses**
- Role-based access control
- Permission management granular
- Activity log untuk semua aksi penting

### 7. **Skalabilitas**
- Arsitektur modular yang mudah dikembangkan
- Support multiple database (SQLite, MySQL, PostgreSQL)
- Caching dengan Redis untuk performa optimal

## 🔒 Lisensi

Aplikasi ini dibangun menggunakan Laravel Framework yang berlisensi [MIT license](https://opensource.org/licenses/MIT).
