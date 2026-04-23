# 📊 Restaurant Accounting System

A full-stack, production-ready accounting system built for small restaurants. This system manages revenues, expenses, inventory, and purchases with automatic financial reporting.

---

## 🚀 Quick Start (Docker)

1. **Clone and Navigate**:
   ```bash
   cd "Account system"
   ```
2. **Launch Containers**:
   ```bash
   docker-compose up --build
   ```
3. **Seed Database**:
   Wait for containers to start, then run:
   ```bash
   docker exec -it accounting-backend npm run seed
   ```
4. **Access**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:3001](http://localhost:3001)

---

## 📡 Example API Responses

### 1. Authentication
**POST `/auth/login`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "email": "admin@accounting.com",
    "role": "ADMIN"
  }
}
```

### 2. Revenues
**GET `/revenues/summary?period=monthly`**
```json
[
  { "period": "2024-04", "total": 12450.75 },
  { "period": "2024-03", "total": 11200.50 }
]
```

### 3. Expenses
**POST `/expenses`**
```json
{
  "id": 45,
  "amount": "250.00",
  "date": "2024-04-21T00:00:00.000Z",
  "description": "Utilities Bill",
  "categoryId": 4
}
```

### 4. Profit & Loss Report
**GET `/reports/profit-loss?from=2024-04-01&to=2024-04-30`**
```json
{
  "period": {
    "from": "2024-04-01T00:00:00.000Z",
    "to": "2024-04-30T23:59:59.000Z"
  },
  "totalRevenue": 15000.00,
  "totalExpenses": 8500.25,
  "netProfit": 6499.75
}
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: NestJS, TypeScript, Passport JWT, Helmet
- **Database**: PostgreSQL with Prisma ORM
- **Export**: pdfmake (PDF), exceljs (Excel)
- **DevOps**: Docker, Docker Compose

---

## 📁 Project Structure

```text
Account system/
├── backend/            # NestJS API
├── frontend/           # Next.js UI
├── prisma/             # Database Schema & Migrations
├── docker-compose.yml  # Orchestration
└── README.md           # Documentation
```

## 🔑 Default Accounts
- **Admin**: `admin@accounting.com` / `admin123`
- **Staff**: `staff@accounting.com` / `staff123`
