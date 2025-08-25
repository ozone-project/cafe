# CAFE Prototype

Content Access Fair Exchange (CAFE) - A prototype publisher dashboard for managing content distribution channels and revenue metrics.

## 🎯 Overview

This prototype demonstrates the core CAFE concept: a platform where publishers can configure their content channels and monitor daily metrics including users, revenue, human vs bot traffic, and referrals.

Based on the CAFE slide deck, this prototype focuses on:
- **Publisher Dashboard**: Overview of all channel performance
- **Channel Management**: Configure direct and indirect content distribution channels  
- **Metrics Tracking**: Daily analytics for users, revenue, referrals
- **License Configuration**: Set up content access terms and pricing

## 🏗️ Architecture

```
cafe-prototype/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # React + TypeScript + Tailwind dashboard
├── shared/          # Shared types and utilities
└── docs/           # Documentation
```

**Tech Stack:**
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Shared**: Zod validation, shared TypeScript types
- **Database**: PostgreSQL with Prisma migrations
- **Development**: Docker Compose for local database

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Docker & Docker Compose (for database)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Database
```bash
docker-compose up -d
```

### 3. Set up Environment
```bash
cp .env.example .env
# Edit .env with your database connection details
```

### 4. Initialize Database
```bash
cd backend
npm run db:migrate
npm run db:generate
```

### 5. Start Development Servers
```bash
# From project root - starts both frontend and backend
npm run dev

# Or start individually:
npm run dev:backend   # API server on :3001
npm run dev:frontend  # React app on :5173
```

### 6. Open Dashboard
Visit http://localhost:5173 to see the CAFE publisher dashboard.

## 📊 Features Implemented

### Dashboard
- ✅ **Metrics Overview**: Total users, revenue, referrals, human/bot ratio
- ✅ **Channel Performance**: Visual breakdown of direct vs indirect channels  
- ✅ **Daily Trends**: Line charts showing user and revenue trends
- ✅ **Growth Indicators**: Growth percentage calculations vs previous periods

### Data Models
- ✅ **Publishers**: Content creator/owner accounts
- ✅ **Channels**: Direct (App, Web, Newsletter, Podcast) & Indirect (Search, Social, AI, News)
- ✅ **Metrics**: Daily tracking of users, revenue, referrals per channel
- ✅ **Licenses**: Content access terms and pricing structures

### API Endpoints
- ✅ **Dashboard API**: `/api/dashboard/:publisherId` - Aggregated metrics
- ✅ **Publishers API**: Full CRUD for publisher management
- ✅ **Channels API**: Channel configuration and management  
- ✅ **Metrics API**: Daily metrics recording and retrieval
- ✅ **Licenses API**: License terms and pricing management

## 🔮 Next Steps

Based on your feedback, we can implement:

1. **Channel Configuration UI**: Forms to add/edit channels with specific settings
2. **License Management UI**: Visual license builder with pricing tiers
3. **Real-time Data**: WebSocket connections for live metrics updates
4. **Data Collector Interface**: Second dashboard for data consumers
5. **Bot Detection**: ML-based bot vs human classification
6. **API Integration**: Connect to actual content management systems

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/       # API endpoints
│   ├── index.ts      # Server setup
├── prisma/
│   └── schema.prisma # Database schema

frontend/
├── src/
│   ├── pages/        # Route components
│   ├── components/   # Reusable UI components
│   └── App.tsx       # Main app component

shared/
├── src/
│   ├── types.ts      # Shared TypeScript types
│   └── utils.ts      # Utility functions
```

## 🛠️ Development Commands

```bash
# Root level
npm run dev          # Start both frontend & backend
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all packages

# Backend specific
npm run dev:backend  # Start API server
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run database migrations

# Frontend specific  
npm run dev:frontend # Start React dev server
```

Ready to implement specific features based on your requirements!