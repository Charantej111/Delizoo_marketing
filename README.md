# Delizoo Eats – Project & Expense Tracker (Kakinada Operations)

A clean, modern web application built with **React**, **Vite**, and **Tailwind CSS** for **Delizoo Eats** project management and expenditure tracking in Kakinada (KKD).

- **Zero Mock / Fake Data:** Starts completely clean. Every metric, department, category, and contributor is calculated dynamically from your actual entries.
- **Zero AI Gradients:** Clean, human-crafted tactile UI inspired by Delizoo's brand palette (warm cream paper, deep ink typography, golden amber accents, and sharp borders).
- **Local Device Storage:** All records and uploaded payment proofs are stored privately on your device.

---

## 🚀 Key Features

### 1. Complete Expense & Proof of Payment Ledger
- **Amount Spent (INR ₹):** Tabular numeric figures formatted for accounting.
- **When:** Exact date and time recorded for every transaction.
- **Who Gave the Amount (Payer):** Track who funded each expense (*Charan Tej*, *Founders Pool*, *Marketing Petty Cash*, etc.).
- **Proof of Payment:**
  - Direct file upload for receipts, bills, and UPI screenshots (PNG, JPG, WebP, PDF).
  - High-resolution modal with zoom (`+` / `−`), preview, and download.
- **How It Helped (Impact & ROI):** Explicit accountability field capturing business outcomes (e.g. *"Printed 5,000 flyers for JNTU campus, acquiring 320 app installs"*).
- **Payment Method & Reference:** UPI (GPay, PhonePe, Paytm), Cash Voucher, Bank Transfer, Card, with UTR reference numbers.
- **Dynamic Filtering:** Filter by project, contributor, category, payment mode, or search text.

### 2. Project Portfolio (Grid & Table Views)
- Track initiative budgets, department allocation, lead owners, deadlines, and milestone progress.
- Switch between rich cards and high-density tabular view.
- 1-click jump from any project directly into its filtered expenses.

### 3. Kanban Task Workflow
- 4 status columns: *To Do*, *In Progress*, *In Review*, and *Completed*.
- Clickable sub-task checklists and member tags.

### 4. Local Database Management & Export
- **1-Click Full Backup (JSON):** Export your entire database (including images) to a file.
- **1-Click Restore (JSON):** Import a backup file on any device.
- **1-Click CSV Export:** Export clean spreadsheets ready for Excel / Google Sheets accounting.

---

## 💻 How to Run

### Option 1: 1-Click Launcher (Windows)
Double-click [`run.bat`](file:///d:/Devlopments/Delizoo_marketing/run.bat). It will start Vite and automatically open `http://localhost:3000` in your browser.

### Option 2: Terminal
```bash
npm run dev
```

### Option 3: Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
d:/Devlopments/Delizoo_marketing/
├── index.html                   # HTML entry
├── vite.config.js               # Vite configuration (port 3000, auto-open)
├── tailwind.config.js           # Tailwind CSS configuration with Delizoo tokens
├── postcss.config.js            # PostCSS configuration
├── package.json                 # React 18, Vite, Lucide-React, Tailwind CSS
├── run.bat                      # Windows runner
├── src/
│   ├── main.jsx                 # React root mount
│   ├── App.jsx                  # Main application controller & state
│   ├── index.css                # Tailwind directives & brand fonts
│   ├── services/
│   │   └── storage.js           # Local device database & JSON/CSV export
│   └── components/
│       ├── Navbar.jsx           # Brand header, search & tab navigation
│       ├── OverviewTab.jsx      # Executive KPI dashboard & dynamic stats
│       ├── ProjectsTab.jsx      # Projects portfolio (grid & table views)
│       ├── KanbanTab.jsx        # Kanban 4-column workflow
│       ├── ExpensesTab.jsx      # Expense ledger & proof viewer
│       ├── ReportsTab.jsx       # Accounting audit & backup center
│       ├── Modals.jsx           # Forms, receipt zoom & impact modals
│       └── EmptyState.jsx       # Clean first-time user guidance
```
