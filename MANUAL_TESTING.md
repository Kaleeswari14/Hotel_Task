# HOTEL POS — MANUAL TESTING GUIDE (FOR NON-DEVELOPERS)

This guide contains step-by-step instructions to test every feature of the POS application. You do not need any coding knowledge to follow these tests.

---

## Pre-Requisites
1. Application is running at `http://localhost:3000`.
2. Database is seeded with default accounts:
   - **Owner**: `owner` / `admin123`
   - **Staff**: `staff` / `staff123`

---

## Phase 1 Test Cases: Authentication & Role-Based Access Control

### Test Case 1.1: Owner Login Verification
- **Test ID**: `TC-AUTH-01`
- **Purpose**: Verify that the Owner can log in and access administrative controls.
- **Preconditions**: Application is on `/login`.
- **Steps**:
  1. Click **"👑 OWNER (owner / admin123)"**.
  2. Click **"Log In to POS"**.
- **Expected Result**: Redirected to `/owner/dashboard` with gold `OWNER` badge and full navigation.
- **Actual Result**: Pass

### Test Case 1.2: Staff Login Verification
- **Test ID**: `TC-AUTH-02`
- **Purpose**: Verify that Staff can log in and access POS billing.
- **Preconditions**: Application is on `/login`.
- **Steps**:
  1. Click **"👨‍🍳 STAFF (staff / staff123)"**.
  2. Click **"Log In to POS"**.
- **Expected Result**: Redirected to `/pos` with green `STAFF` badge and POS navigation.
- **Actual Result**: Pass

---

## Phase 2 Test Cases: Food & Stock Management

### Test Case 2.1: Multi-Portion Dish Creation
- **Test ID**: `TC-MENU-01`
- **Purpose**: Verify dishes with multiple portions (`1/4 Plate`, `1/2 Plate`, `1 Plate`) can be created with separate prices.
- **Preconditions**: Logged in as `owner`. On `/owner/menu`.
- **Steps**:
  1. Click **"+ Add New Food Item"**.
  2. Enter Food Name `Special Chicken Biriyani`, Category `Biriyani & Rice`.
  3. Click preset **"1/4 + 1/2 + 1 Plate"** (Prices: ₹70, ₹130, ₹240, Stock: 20).
  4. Click **"Create Dish"**.
- **Expected Result**: Dish card created with all 3 portion prices.
- **Actual Result**: Pass

### Test Case 2.2: Stock Restock & Low Stock Warnings
- **Test ID**: `TC-STOCK-01`
- **Purpose**: Verify quick restock buttons and low stock warning triggers.
- **Preconditions**: Logged in as `owner`. On `/owner/stock`.
- **Steps**:
  1. Click **+10** on `Chicken Biriyani` -> Verify stock updates immediately to 30 Plates.
  2. Set `Paneer Butter Masala` to `2` plates -> Verify `LOW STOCK ⚠️` warning appears.
- **Actual Result**: Pass

---

## Phase 3 Test Cases: Fast POS Billing & Unpaid Bills Engine

### Test Case 3.1: Fast Billing with Table & Multi-Portions
- **Test ID**: `TC-POS-01`
- **Purpose**: Verify creating a bill with multiple portions.
- **Preconditions**: On `/pos`.
- **Steps**:
  1. Select **Table 3**.
  2. Add `Chicken Biriyani (1 Plate)` + `Chicken Biriyani (1/4 Plate)` -> Total ₹260.
  3. Click **"Generate Bill (UNPAID)"**.
- **Expected Result**: Bill #1001 created with status `UNPAID`.
- **Actual Result**: Pass

### Test Case 3.2: Critical Invariant: Zero Stock Deduction Before Payment
- **Test ID**: `TC-POS-02`
- **Purpose**: Verify stock does NOT reduce when a bill is created.
- **Preconditions**: Note initial stock of `Chicken Biriyani` (e.g. 30 Plates).
- **Steps**:
  1. Generate bill for `Chicken Biriyani`.
  2. Check `/owner/stock`.
- **Expected Result**: Stock remains **30 Plates** (zero reduction).
- **Actual Result**: Pass

---

## Phase 4 Test Cases: Payment Confirmation, Safe Stock Deduction & Thermal Receipts

### Test Case 4.1: Cash Payment & Change Return Calculation
- **Test ID**: `TC-PAY-01`
- **Purpose**: Verify cash payment processing and change calculation.
- **Preconditions**: At least 1 unpaid bill on `/bills`.
- **Steps**:
  1. On `/bills`, click **"Collect Payment"** on an unpaid bill of ₹260.
  2. Select **💵 CASH**.
  3. Enter Cash Received = `₹300`.
  4. Notice Change to Return displays **₹40**.
  5. Click **"Confirm & Mark PAID"**.
- **Expected Result**: Bill is marked **`PAID`**, success toast appears, and Thermal Receipt opens automatically.
- **Actual Result**: Pass

### Test Case 4.2: Automatic Stock Deduction (THE MOST IMPORTANT BUSINESS RULE)
- **Test ID**: `TC-PAY-02`
- **Purpose**: Verify that payment confirmation accurately reduces stock in normalized human-friendly form.
- **Preconditions**: Initial stock of `Chicken Biriyani` is 30 Plates.
- **Steps**:
  1. Customer orders: `Chicken Biriyani — 1 Plate` + `Chicken Biriyani — 1/4 Plate` (Total: 1.25 plates).
  2. Bill created (Status: `UNPAID`). Stock is STILL 30 Plates.
  3. Payment of ₹260 is confirmed (Status: `PAID`).
  4. Navigate to `/owner/stock`.
- **Expected Result**: Stock of `Chicken Biriyani` is now **`28 ¾ Plates`** (30 - 1.25 = 28.75 plates displayed cleanly as fractions).
- **Actual Result**: Pass

### Test Case 4.3: Thermal Receipt Printing & Reprint Invariance
- **Test ID**: `TC-PAY-03`
- **Purpose**: Verify 58mm & 80mm thermal receipt printing and that reprinting NEVER deducts stock or money again.
- **Preconditions**: A paid bill exists.
- **Steps**:
  1. On `/bills`, under "Paid Bills", click **"Reprint Thermal Receipt"**.
  2. Click **"Print Thermal Receipt"** -> Browser print preview opens.
  3. Close modal and check stock at `/owner/stock`.
- **Expected Result**: Stock and financial totals remain completely unchanged.
- **Actual Result**: Pass

---

## Phase 5 Test Cases: Owner Dashboard, Payment History & Day Closing Settlement

### Test Case 5.1: Owner Dashboard Live Reconciliation
- **Test ID**: `TC-DASH-01`
- **Purpose**: Verify dashboard displays separate values for Completed Sales, Collected Income, Outstanding Unpaid, and Low Stock count.
- **Preconditions**: Logged in as `owner`. On `/owner/dashboard`.
- **Steps**:
  1. Navigate to `/owner/dashboard`.
  2. Check the 4 metric cards:
     - **Total Sales (Paid)**
     - **Collected Income**
     - **Outstanding Unpaid**
     - **Low Stock Items**
  3. Check the **Payment Channel Summary** (Cash vs UPI vs Card) and **Top Selling Dishes** list.
- **Expected Result**: All financial ledgers match actual paid vs unpaid bills in real time.
- **Actual Result**: Pass

### Test Case 5.2: Payment History Audit & Method Filter
- **Test ID**: `TC-PAYHIST-01`
- **Purpose**: Verify owner can audit all payment transactions and filter by payment type.
- **Preconditions**: Logged in as `owner`. On `/owner/payments`.
- **Steps**:
  1. Navigate to `/owner/payments`.
  2. Click **"💵 Cash"** filter -> Only cash transactions appear.
  3. Click **"📱 UPI / QR"** filter -> Only UPI transactions appear.
  4. Click **"Receipt"** on any transaction.
- **Expected Result**: Thermal receipt opens immediately for review.
- **Actual Result**: Pass

### Test Case 5.3: End-of-Day Settlement & Duplicate Closing Protection
- **Test ID**: `TC-DAYCLOSE-01`
- **Purpose**: Verify owner can review today's closing summary, lock the day, and that duplicate closing is prevented.
- **Preconditions**: Logged in as `owner`. On `/owner/day-closing`.
- **Steps**:
  1. Navigate to `/owner/day-closing`.
  2. Review today's Total Sales, Cash in drawer, UPI in bank, and Closing Stock Snapshot.
  3. Enter closing notes: `"Evening settlement verified with cash register."`
  4. Click **"Finalize & Close Day"**.
  5. Confirm the dialog prompt.
- **Expected Result 1**: Status badge turns green: **`TODAY IS CLOSED & SETTLED`**.
- **Expected Result 2**: The closing form is disabled to prevent duplicate closures.
- **Expected Result 3**: Today's settlement is saved to the **Past Day Closings History** table with the full closing stock snapshot.
- **Actual Result**: Pass
