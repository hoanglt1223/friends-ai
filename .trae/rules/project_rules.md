# Friends AI - Project Rules & Workspace Documentation

## 🚨 Development Rules (CRITICAL - ALWAYS FOLLOW)

DO NOT USE MOCK API/INTEGRATE
All commands need support by Windows 10, PowerShell (don't use &&, replace with ; . Don't use curl, use Invoke-RestMethod)
JUST IMPLEMENT AVOID RUN TEST
DO NOT DELAY TOO LONG IN WAIT TOOL CALL
Implement AS SIMPLE AS POSIBLE, DO NOT ADD MANY NEW CODES, NEW LAYERS, TRY FIX/UPDATE
FOR FIX BUGS TASK, PLEASE MADE SMALLEST CHANGES
DO NOT REMOVE GPT-5-nano
AVOID CREATE NEW ENDPOINT OR DYNAMIC ENDPOINT, MAXIMUM ENDPOINT IS 12, USE METHODS AND PARAMS INSTEAD CREATE NEW ENDPOINT
.js in import in api folder is workaround to avoid import error in vercel

---

## 🎯 Project Overview

**Friends AI** is an innovative AI-powered advisory platform that creates personalized AI board members to provide guidance, support, and diverse perspectives on personal and professional decisions. Users can interact with multiple AI personalities through a modern chat interface, each offering unique viewpoints based on their configured personality traits.

### Key Features

- 🤖 **AI Board Members**: Create and customize AI advisors with distinct personalities
- 💬 **Real-time Chat**: WebSocket-powered chat interface with typing indicators
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- 💳 **Subscription Management**: Integrated payment processing with Checkout.vn
- 📊 **Admin Dashboard**: Analytics and system management tools
- 🌐 **Serverless Architecture**: Deployed on Vercel with serverless functions

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express.js, Serverless Functions (Vercel)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT models
- **Real-time**: WebSockets (ws library)
- **Authentication**: Replit Auth integration
- **Payments**: Checkout.vn integration
- **Deployment**: Vercel

### Project Structure

```
friends-ai/
├── 📁 api/                    # Serverless API endpoints
│   ├── 📁 _shared/           # Shared utilities and services
│   ├── 📁 admin/             # Admin-specific endpoints
│   ├── 📁 board-members/     # Board member management
│   ├── 📁 chat/              # Chat functionality
│   ├── 📁 conversations/     # Conversation management
│   ├── 📁 subscription/      # Payment and subscription
│   ├── auth.ts               # Authentication endpoint
│   └── translate.ts          # Translation services
├── 📁 client/                # Frontend React application
│   ├── 📁 src/
│   │   ├── 📁 components/    # React components
│   │   ├── 📁 hooks/         # Custom React hooks
│   │   ├── 📁 lib/           # Utility libraries
│   │   ├── 📁 pages/         # Page components
│   │   └── App.tsx           # Main application component
│   └── index.html            # HTML entry point
├── 📁 server/                # Development server (legacy)
├── 📁 shared/                # Shared code between client/server
├── 📁 docs/                  # Documentation
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
├── vercel.json               # Vercel deployment config
└── vite.config.ts            # Vite configuration
```

## 🔌 API Endpoints

### Authentication

- `GET /api/auth` - Get current user information
- `POST /api/auth` - User authentication

### Board Members

- `GET /api/board-members` - List user's board members
- `POST /api/board-members` - Create new board member
- `PUT /api/board-members/[id]` - Update board member
- `DELETE /api/board-members/[id]` - Delete board member
- `POST /api/board-members/initialize` - Initialize default board members

### Conversations

- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get conversation messages

### Chat

- `POST /api/chat/send` - Send chat message (WebSocket alternative)

### Subscription

- `POST /api/subscription/get-or-create` - Get or create subscription
- `GET /api/subscription/status` - Check subscription status
- `POST /api/subscription/webhook` - Payment webhook handler

### Admin

- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings/[key]` - Update system setting

### Translation

- `POST /api/translate` - Translate text using DeepL

## 🗄️ Database Schema

### Core Tables

#### Users

```sql
users (
  id: varchar (UUID, Primary Key)
  email: varchar (Unique)
  firstName: varchar
  lastName: varchar
  profileImageUrl: varchar
  subscriptionPlan: varchar (premium, pro)
  subscriptionStatus: varchar (none, pending, active, expired, cancelled)
  subscriptionTier: varchar (free, premium) -- Legacy Stripe
  createdAt: timestamp
  updatedAt: timestamp
)
```

#### Board Members

```sql
board_members (
  id: varchar (UUID, Primary Key)
  userId: varchar (Foreign Key → users.id)
  name: varchar
  personality: varchar (supportive, practical, creative, wise, energetic)
  description: text
  avatarUrl: varchar
  systemPrompt: text
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
)
```

#### Conversations

```sql
conversations (
  id: varchar (UUID, Primary Key)
  userId: varchar (Foreign Key → users.id)
  title: varchar
  lastMessageAt: timestamp
  createdAt: timestamp
)
```

#### Messages

```sql
messages (
  id: varchar (UUID, Primary Key)
  conversationId: varchar (Foreign Key → conversations.id)
  senderId: varchar (Board Member ID or null for user)
  senderType: varchar (user, ai)
  content: text
  messageType: varchar (text, image, audio)
  metadata: jsonb
  createdAt: timestamp
)
```

## 🎨 Frontend Components

### Pages

- **Landing** (`/`) - Authentication and onboarding
- **Home** (`/`) - Main chat interface (authenticated)
- **Admin** (`/admin`) - System administration
- **Subscribe** (`/subscribe`) - Subscription management
- **Not Found** (`/404`) - Error page

### Key Components

- **ChatInterface** - Main chat UI with message history
- **BoardMemberCard** - Display and manage AI board members
- **SubscriptionPlans** - Payment and plan selection
- **MessageBubble** - Individual chat message display
- **TypingIndicator** - Real-time typing status

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- OpenAI API key
- Checkout.vn account (for payments)

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI
OPENAI_API_KEY=sk-...

# Authentication (Replit)
REPLIT_DB_URL=...

# Payments (Checkout.vn)
CHECKOUT_VN_API_KEY=...
CHECKOUT_VN_SECRET_KEY=...

# Session
SESSION_SECRET=your-secret-key

# Development
NODE_ENV=development
PORT=5000
```

### Installation & Running

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:push

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check
```

## 🚀 Deployment

### Vercel Configuration

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/client/$1"
    }
  ]
}
```

## 🔐 Security & Best Practices

### Authentication

- Replit Auth integration for user management
- Session-based authentication with secure cookies
- Protected API routes with middleware

### Data Protection

- Input validation using Zod schemas
- SQL injection prevention with Drizzle ORM
- CORS configuration for API security
- Environment variable protection

## 📊 Monitoring & Analytics

### Admin Dashboard Features

- User registration metrics
- Message volume tracking
- Subscription conversion rates
- System health monitoring

---

## 🤝 Contributing

When contributing to this project:

1. Follow the established architecture patterns
2. Maintain TypeScript type safety
3. Add appropriate error handling
4. Update documentation for new features
5. Test thoroughly before submitting PRs
6. **ALWAYS FOLLOW THE DEVELOPMENT RULES AT THE TOP OF THIS FILE**

---

*This workspace documentation provides a comprehensive overview of the Friends AI project. Keep it updated as the project evolves.*