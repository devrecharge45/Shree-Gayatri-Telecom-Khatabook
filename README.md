# Shree Gayatri Telecom - Khatabook Ledger Web Application

A production-grade, offline-capable, server-side rendered (SSR) Ledger Management Web Application inspired by **Khatabook**, built with **Node.js (LTS Stable)**, **TypeScript (Strict Class-Based Architecture, 0 `any` Types)**, **Express**, **EJS**, **Sequelize ORM**, and **PostgreSQL**.

---

## 🌟 Key Features

1. **Company Branding & Config Driven by `.env`**:
   - Company Name, Address, and Phone configured dynamically via `.env`.
   - Global injection into all EJS templates, dynamic PWA Web Manifest, PDF reports, and Excel spreadsheets.
2. **Parties as Main Home Page (No Separate Dashboard)**:
   - Direct redirect to `/parties` after authentication.
   - Comprehensive Party CRUD with mandatory party name, optional phone, and notes.
   - Top summary cards showing real-time **Net Balance**, **Total You Will Get (Receivables)**, and **Total You Will Give (Payables)**.
   - Search by customer name or phone, status filters (`All`, `You Will Get`, `You Will Give`, `Settled`), and server-side pagination.
3. **Party Ledger & Credit/Debit Engine (`/parties/:partyId/ledger`)**:
   - Customer profile card with direct click-to-call and WhatsApp reminder shortcuts.
   - 🔴 **`YOU GAVE ₹ (DEBIT)`**: Records credit given / money lent; increases receivable balance.
   - 🟢 **`YOU GOT ₹ (CREDIT)`**: Records payment received; decreases receivable balance.
   - Atomic database transactions with running balance calculations.
   - Date range filtering, search notes/bill reference, and transaction deletion.
4. **Branded Financial Reporting (PDF & Excel Exports)**:
   - 📄 **PDF Report**: Audit-ready document featuring your local company logo, header metadata, summary statistics, and transaction history.
   - 📊 **Excel (.xlsx) Report**: Formatted spreadsheet with formatted currency numbers (`₹#,##0.00`), company metadata, and Excel `SUM` formulas.
5. **Profile & Secure Password Reset Flow (`/profile`)**:
   - Displays user details, total parties count, transaction count, and configured business metadata.
   - Password reset validates current password, enforces complexity on new password, and verifies confirmation.
   - **Enforced Security Logout**: Automatically terminates the session and redirects to `/login` upon password change.
6. **Mobile PWA & Zero-CDN Architecture**:
   - Dynamic `/manifest.json` using branding from `.env`.
   - Native icon suite (`72x72` to `512x512`) and Service Worker (`sw.js`) for offline shell caching and mobile installation.
   - 100% self-hosted Vanilla CSS design system and inline SVGs with zero external CDN dependencies.
7. **Strict Type Safety & Zero `any` Types**:
   - Complete TypeScript strict mode compliance with 0 `any` types across the entire codebase.
8. **Automated Migrations & Seeders**:
   - Full Sequelize CLI migrations for `users`, `parties`, and `transactions` tables with indexes and foreign keys.
   - Demo seed data ready out-of-the-box.
9. **Code Quality, Formatting & Husky Git Hooks**:
   - Modern ESLint flat config (`eslint.config.mjs`) + Prettier code formatting.
   - Pre-commit git hook enforcing linting and format verification.

---

## 🛠️ Technology Stack

| Layer               | Technology                                                                  |
| :------------------ | :-------------------------------------------------------------------------- |
| **Runtime**         | Node.js v20.x / v22.x LTS                                                   |
| **Language**        | TypeScript 5.x (Strict Mode, 0 `any` types)                                 |
| **Architecture**    | Class-Based MVC + Service Pattern                                           |
| **Web Framework**   | Express 5.x                                                                 |
| **Template Engine** | EJS (Embedded JavaScript)                                                   |
| **ORM**             | Sequelize 6.x                                                               |
| **Database**        | PostgreSQL 15+                                                              |
| **Reports**         | `pdfkit-table` (PDF) & `exceljs` (Excel XLSX)                               |
| **Security**        | `helmet`, `express-rate-limit`, `cookie-parser`, `bcryptjs`, `jsonwebtoken` |
| **Quality**         | ESLint, Prettier, Husky                                                     |

---

## 📁 Directory Structure

```text
khatabook-app/
├── .husky/
│   └── pre-commit              # Git pre-commit hook (lint + format:check)
├── database/
│   ├── config.js               # Sequelize CLI database config
│   ├── migrations/             # Timestamped database migrations
│   │   ├── 20261004000001-create-users.js
│   │   ├── 20261004000002-create-parties.js
│   │   └── 20261004000003-create-transactions.js
│   └── seeders/                # Demo data seeders
│       └── 20261004000001-demo-khatabook-data.js
├── public/
│   ├── css/                    # Pure Vanilla CSS (Zero CDN)
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── pages/ (auth, parties, ledger, profile)
│   ├── js/                     # Client-side scripts
│   │   ├── app.js
│   │   └── pwa-installer.js
│   ├── icons/                  # PWA application icons (72x72 to 512x512)
│   ├── images/                 # Logo, favicon, apple-touch-icon
│   └── sw.js                   # Service Worker for offline shell caching
├── src/
│   ├── @types/                 # Extended Express types
│   ├── config/                 # Environment & Database singletons
│   ├── constants/              # Transaction & Filter enums
│   ├── controllers/            # Class-Based Controllers
│   ├── middlewares/            # Auth, Locals, Validator, Rate-limiter, Error handlers
│   ├── models/                 # Sequelize Class-Based Models & Associations
│   ├── routes/                 # Express Router modules
│   ├── services/               # Reusable business logic, PDF & Excel export services
│   ├── utils/                  # AppError, Logger, Formatters
│   └── server.ts               # Application bootstrap class
├── views/                      # Server-side rendered EJS templates
│   ├── layouts/ (header, footer, flash)
│   └── pages/ (auth, parties, ledger, profile, errors)
├── .env.example                # Environment configuration template
├── .eslintrc.json / eslint.config.mjs
├── .prettierrc
├── .sequelizerc                # Sequelize CLI path mappings
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Server Configuration
PORT=
NODE_ENV=
APP_NAME=""
APP_SHORT_NAME=""
APP_URL=

# Company Branding & Details (Appears on header, footer, PDF & Excel reports)
COMPANY_NAME=""
COMPANY_PHONE=""
COMPANY_ADDRESS=""

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YourPostgresPassword
DB_NAME=khatabook_db

# Security & JWT Configuration
JWT_SECRET=super_secure_jwt_signing_key_change_in_production_2026
JWT_EXPIRES_IN=15d
COOKIE_SECRET=super_secure_cookie_secret_key_change_me
SESSION_SECRET=super_secure_session_secret_key_change_me
```

---

## 🚀 Database Migrations & Seeders

### Migration Commands

```bash
# Check migration status
npm run migrate:status

# Execute all pending migrations
npm run migrate

# Rollback the last migration
npm run migrate:undo

# Rollback all migrations
npm run migrate:undo:all
```

### Seeder Commands

```bash
# Run all seeders (populates demo user, parties, and transactions)
npm run seed

# Rollback the last seeder
npm run seed:undo

# Rollback all seeders
npm run seed:undo:all
```

### Seeded Demo Credentials

- **Email**: `admin@shreegayatritelecom.com`
- **Password**: `Password@123`

---

## 💻 Running the Application

### 1. Development Mode (with hot-reload via nodemon)

```bash
npm run dev
```

### 2. Production Build & Start

```bash
npm run build
npm start
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🔍 Code Quality & Formatting

```bash
# Run ESLint check
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Verify formatting without modifying files
npm run format:check
```

---

## 🔒 Security Best Practices Implemented

- **Helmet**: Hardened HTTP response headers with a tailored Content Security Policy.
- **Rate Limiting**: Protects `/login` and `/register` against brute-force attacks.
- **Cookie Security**: Auth JWT stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
- **SQL Injection Prevention**: All database queries strictly parameterized via Sequelize ORM.
- **IDOR Protection**: All party and ledger operations strictly scoped to the authenticated `user_id`.
- **Centralized Error Interceptor**: Catches and translates database constraints into friendly user messages.
- **Input Sanitization**: All incoming form bodies validated and XSS-sanitized via `express-validator`.
