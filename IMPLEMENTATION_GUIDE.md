# HOTEL POS — TECHNICAL IMPLEMENTATION GUIDE

## 1. System Architecture & Tech Stack

- **Framework**: Next.js (App Router, Server Components + Client Interactivity)
- **Language**: TypeScript with strict mode
- **Database & ORM**: PostgreSQL / SQLite via Prisma ORM
- **Styling**: Tailwind CSS with custom restaurant POS color palettes and touch-friendly targets
- **Security & Auth**: Bcrypt.js (salted password hashing) + Jose (JWT signed session cookies)
- **Icons**: Lucide React

```
├── prisma/
│   ├── schema.prisma         # Normalized database models
│   └── seed.ts               # Default users (Owner/Staff), categories, food & stock
├── src/
│   ├── app/
│   │   ├── api/              # Secure backend REST & transaction API endpoints
│   │   │   ├── auth/         # Login, logout, me, session check
│   │   │   ├── categories/   # Category CRUD
│   │   │   ├── foods/        # Food items, portions & prices
│   │   │   ├── stock/        # Stock levels & restock adjustments
│   │   │   ├── bills/        # Order & bill creation, unpaid bills list
│   │   │   ├── payments/     # Atomic payment confirmation & stock deduction
│   │   │   ├── cancel/       # Bill cancellation with reason
│   │   │   └── reports/      # Day closing, payment history, dashboard metrics
│   │   ├── login/            # Dedicated touch-friendly authentication screen
│   │   ├── pos/              # High-speed cashier billing interface
│   │   ├── bills/            # Unpaid bills and reprint screen
│   │   ├── owner/            # Owner-only administrative portals
│   │   │   ├── dashboard/    # Today's sales, collection & stock alerts
│   │   │   ├── menu/         # Food & portion manager
│   │   │   ├── stock/        # Stock management & threshold configuration
│   │   │   ├── payments/     # Detailed payment history audit
│   │   │   ├── cancelled/    # Cancelled bills audit
│   │   │   └── day-closing/  # End of day settlement & closing report
│   │   ├── layout.tsx        # Root HTML layout with responsive header & navigation
│   │   ├── page.tsx          # Smart router redirecting based on auth & role
│   │   └── globals.css       # Tailwind base styles and print media rules
│   ├── components/           # Reusable UI widgets, thermal print dialogs, badges
│   ├── lib/
│   │   ├── auth.ts           # JWT signer, verifier, password checker, session helper
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── format.ts         # Human-friendly quantity (1/4 Plate, 1 Plate) and Currency formatters
│   └── middleware.ts         # Route guard checking role-based URL access
```

---

## 2. Core Business Rule & Transaction Invariants

### Invariant 1: Stock and Financial Isolation at Bill Creation
When a staff member creates a new bill:
1. A new `Bill` record is created with status `UNPAID`.
2. Associated `BillItem` records are stored.
3. **NO stock levels are reduced**.
4. **NO collected income is recorded**.
5. **NO sales ledger entry is finalized**.

### Invariant 2: Atomic Payment Execution
When a payment is processed:
Prisma's `$transaction` executes the following steps in a single atomic database operation:
1. Verify bill is currently `UNPAID` or `PARTIAL`.
2. Create a `Payment` record with amount, method (`CASH`, `UPI`, `CARD`), and operator ID.
3. Update `Bill.paidAmount`, `Bill.balanceAmount`, and set `Bill.status = 'PAID'`.
4. Deduct inventory in `Stock` for each item ordered according to `quantity * unitMultiplier`.
5. Rollback the entire transaction if any inventory or database constraint fails.

### Invariant 3: Human-Friendly Portions
- Internal Representation: Normalized float multipliers (`0.25` for 1/4 plate, `0.5` for 1/2 plate, `1.0` for 1 plate).
- Display Format: Always rendered as clean strings like `1/4 Plate`, `1/2 Plate`, `1 Plate`, or `1 Plate + 1/4 Plate`.
- Raw confusing numbers like `1.25 Plate` are never exposed to customers or staff.

### Invariant 4: Thermal Receipt Reprinting
- Reprinting fetches the existing finalized `Bill` and `Payment` details.
- It triggers the browser print dialog formatted for 58mm / 80mm thermal printers.
- Reprinting is read-only and will never double-count income or double-deduct stock.

---

## 3. Database Schema Overview

| Table | Purpose |
|---|---|
| `User` | Stores credentials, names, and roles (`OWNER`, `STAFF`) |
| `Category` | Menu categories (Biriyani, Starters, Breads, Beverages, etc.) |
| `FoodItem` | Menu items linked to categories |
| `FoodPortion` | Portions (1/4 Plate, 1/2 Plate, 1 Plate) with separate prices and unit multipliers |
| `Stock` | Inventory balance per food item and low stock trigger threshold |
| `Bill` | Bill header with bill number, order reference (Table/Token/Parcel), totals, and status |
| `BillItem` | Individual ordered items and portions on a bill |
| `Payment` | Immutable payment records (Cash, UPI, Card) |
| `Cancellation` | Audit records for cancelled bills with operator name and reason |
| `DayClosing` | Immutable end-of-day summary snapshot and closing stock |

---

## 4. Environment & Deployment Setup

To switch to PostgreSQL in production:
1. In `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/hotel_pos?schema=public"
   ```
2. In `prisma/schema.prisma`, update provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run `npx prisma db push` and `npm run db:seed`.
