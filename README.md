# CAFE - Content Access Fair Exchange

A complete solution for fair content licensing and distribution, including both the business presentation and a working prototype dashboard.

## 📖 About CAFE

**Content Access Fair Exchange (CAFE)** addresses the fundamental problem of declining referral traffic from search engines and social platforms to content creators. As search referrals have dropped from 90% to 41.5% over 14 years, CAFE provides a new model for fair content access and compensation.

### The Problem
- **Broken Referral Model**: Platforms consume content but provide fewer referrals back
- **Unauthorized Scraping**: Bots extract content without compensation  
- **Revenue Loss**: Publishers lose control over their content distribution
- **Compliance Issues**: Data collectors lack proper licensing frameworks

### The CAFE Solution
- **Anti-Scraping Technology**: Advanced bot detection and prevention
- **Licensing Framework**: Task-specific data use permissions and restrictions  
- **Data API**: Controlled access interface for authorized users
- **Fair Compensation**: Publishers get paid for content usage vs. referrals
- **Security & Compliance**: Built-in data protection and regulatory compliance

## 📊 Presentation Slides

This repository contains a comprehensive slide deck explaining the CAFE concept, market opportunity, and technical architecture.

## Slide Deck Overview

Navigate the presentation slides here: **[Start Presentation →](slide-01-title.md)**

### Core Presentation (Slides 1-9)

1. **[Title Slide](slide-01-title.md)** - Introduction to Content Access Fair Exchange (CAFE)

2. **[Content Distribution and Revenue](slide-02-the-content-value-matrix.md)** - Interactive flow diagram showing how content flows through direct and indirect channels, with declining referrals highlighted in red and growing indirect channels in green

3. **[Direct Traffic in Decline](slide-03-decline-in-referrals.md)** - Data-driven analysis showing:
   - Search referrals dropped from 90% (2010) to 41.5% (2024)
   - Social media referrals declining from 32% to 4%
   - Human vs Bot traffic breakdown by platform

4. **[Opportunities for Publishers by Channel](slide-04-value-exchange-models.md)** - Comprehensive matrix comparing revenue opportunities across direct channels (App, Web, Newsletter) vs indirect channels (Search, Social, AI) including ads, subscriptions, and licensing potential

5. **[Publisher Strategic Choices](slide-05-content-creator-choices.md)** - Visual flowchart of strategic options: strengthen direct business, control indirect channels, new monetization models, and content protection

6. **[CAFE Value Proposition](slide-06-cafe-value-proposition.md)** - Side-by-side benefits breakdown:
   - **Content Creators**: Revenue, measurement, data protection, cost efficiency
   - **Data Collectors**: Real-time access, quality data, cost efficiency, compliance

7. **[Content Licensing Market Landscape](slide-07-market-landscape.md)** - Quadrant analysis positioning CAFE against existing solutions like New York Times-OpenAI deals, showing bespoke, collective, enterprise, and self-service approaches

8. **[Content Access Workflow](slide-08-components-needed-for-content-access.md)** - Technical architecture diagram showing the interaction between Publishers, CAFE platform, and Data Collectors with Content Intelligence Engine and CDN components

9. **[Introducing OZONE.CAFE](slide-09-introducing-ozone-cafe.md)** - Platform introduction and implementation details

### Additional Slides (10-16)
- **High Level Architecture** - Technical implementation details
- **Content Data & Licenses** - Data structures and licensing frameworks  
- **Business Models** - Revenue and pricing strategies
- **Appendix & Research** - Supporting documentation and sources

## 🚀 CAFE Prototype

**[📂 cafe-prototype/](cafe-prototype/)** - Working publisher dashboard prototype

### 📋 Prerequisites
Before running the prototype, ensure you have:
- **Node.js 18+** and **npm 9+** installed
- **Docker & Docker Compose** for the database
- **Git** for cloning the repository

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ozone-project/cafe.git
   cd cafe
   ```

2. **Navigate to prototype directory**
   ```bash
   cd cafe-prototype
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the database**
   ```bash
   docker-compose up -d
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database connection if needed
   ```

6. **Initialize the database**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:generate
   cd ..
   ```

7. **Start the development servers**
   ```bash
   npm run dev
   ```

8. **Open the dashboard**
   
   Visit **http://localhost:5173** to see the CAFE publisher dashboard

   API server runs on **http://localhost:3001**

### ✨ Prototype Features
- 📊 **Publisher Dashboard** with real-time metrics visualization
- 📈 **Channel Management** for direct and indirect content distribution  
- 💰 **Revenue Tracking** across all channels with growth indicators
- 🤖 **Human vs Bot Analytics** showing traffic composition
- 📋 **Channel Performance** breakdown with visual charts
- ⚖️ **License Management** system architecture

### 🛠️ Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + TypeScript + Prisma ORM  
- **Database**: PostgreSQL
- **Development**: Docker Compose, Hot reload, Type safety

### 📚 Additional Commands
```bash
# View database in Prisma Studio
npm run --workspace=backend db:studio

# Run tests
npm run test

# Build for production  
npm run build

# Lint code
npm run lint
```

[→ View Complete Prototype Documentation](cafe-prototype/README.md)

---

## Tools Used

- Mermaid diagrams for technical illustrations
- Markdown for slide content  
- React + TypeScript for prototype implementation
