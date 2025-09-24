# Hướng Dẫn Chuyển Đổi Dự Án từ Replit sang Vercel Serverless

## Tổng Quan

Hướng dẫn này sẽ giúp bạn chuyển đổi dự án từ cấu trúc **client/server** truyền thống trên Replit sang cấu trúc **api/client** với serverless functions để deploy trên Vercel.

## Cấu Trúc Trước và Sau Chuyển Đổi

### Trước (Replit - Client/Server):
```
project/
├── client/          # Frontend React/Vite
│   ├── src/
│   ├── public/
│   └── index.html
├── server/          # Backend Express.js
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   └── index.js
├── shared/          # Code dùng chung
└── package.json
```

### Sau (Vercel - API/Client):
```
project/
├── client/          # Frontend React/Vite (giữ nguyên)
│   ├── src/
│   ├── public/
│   └── index.html
├── api/             # Serverless API endpoints
│   ├── _shared/     # Utilities và services dùng chung
│   ├── auth.ts      # Authentication endpoint
│   ├── users.ts     # User management endpoint
│   └── *.ts         # Các API endpoints khác
├── shared/          # Code dùng chung (giữ nguyên)
├── vercel.json      # Cấu hình Vercel
└── package.json     # Cập nhật scripts và dependencies
```

## Bước 1: Chuẩn Bị Dự Án

### 1.1 Backup và Clone
```bash
# Backup dự án hiện tại
git clone <your-replit-repo> project-backup

# Tạo branch mới cho migration
git checkout -b migrate-to-vercel
```

### 1.2 Cài Đặt Dependencies Cần Thiết
```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Cài đặt dependencies cho serverless
pnpm add @vercel/node
pnpm add -D @types/node
```

## Bước 2: Chuyển Đổi Server thành API

### 2.1 Tạo Thư Mục API
```bash
mkdir api
mkdir api/_shared
```

### 2.2 Di Chuyển Server Logic

#### Chuyển đổi Express Routes thành Vercel Functions

**Trước (server/routes/auth.js):**
```javascript
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  // Logic xử lý login
  res.json({ success: true });
});

module.exports = router;
```

**Sau (api/auth.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Logic xử lý login
    return res.json({ success: true });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
```

### 2.3 Tạo Shared Services

**api/_shared/database.ts:**
```typescript
// Database connection và utilities
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };
```

**api/_shared/cors.ts:**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export function enableCors(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
```

## Bước 3: Cấu Hình Vercel

### 3.1 Tạo vercel.json
```json
{
  "version": 2,
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 300
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*\\.(js|mjs|css|ico|svg|png|jpg|jpeg|gif|woff|woff2|ttf|eot))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm run build:vercel",
  "outputDirectory": "dist/public"
}
```

### 3.2 Cập Nhật package.json
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:vercel": "vite build",
    "start": "vite preview",
    "vercel:dev": "vercel dev"
  },
  "dependencies": {
    "@vercel/node": "^3.2.29"
  }
}
```

## Bước 4: Cấu Hình Vite

### 4.1 Cập Nhật vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

## Bước 5: Cập Nhật Frontend

### 5.1 Thay Đổi API Calls
```typescript
// Trước
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
});

// Sau (giữ nguyên, Vercel sẽ tự động route)
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
});
```

## Bước 6: Environment Variables

### 6.1 Tạo .env.example
```env
# Database
DATABASE_URL=your_database_url_here

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
DEEPL_API_KEY=your_deepl_api_key_here

# Redis (nếu sử dụng)
REDIS_URL=your_redis_url_here

# Session Secret
SESSION_SECRET=your_session_secret_here
```

### 6.2 Cấu Hình trên Vercel
```bash
# Thêm environment variables
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
# ... các biến khác
```

## Bước 7: Testing và Deployment

### 7.1 Test Local
```bash
# Chạy development server
pnpm dev

# Test với Vercel CLI
vercel dev
```

### 7.2 Deploy lên Vercel
```bash
# Deploy
vercel --prod

# Hoặc setup auto-deploy từ GitHub
vercel --prod --github
```

## Bước 8: Các Lưu Ý Quan Trọng

### 8.1 Serverless Limitations
- **Cold Start**: Functions có thể mất thời gian khởi động
- **Timeout**: Mặc định 10s, tối đa 300s cho Pro plan
- **Memory**: Giới hạn memory cho functions
- **Stateless**: Không lưu trữ state giữa các requests

### 8.2 Database Connections
```typescript
// Sử dụng connection pooling
import { neon } from '@neondatabase/serverless';

// Tránh tạo nhiều connections
const sql = neon(process.env.DATABASE_URL!);
```

### 8.3 File Uploads
```typescript
// Sử dụng external storage (S3, Cloudinary)
// Không lưu files trực tiếp trên serverless
```

## Bước 9: Optimization

### 9.1 Code Splitting cho API
```typescript
// api/_shared/utils.ts
export const commonUtils = {
  // Utilities dùng chung
};

// Import chỉ khi cần
import { commonUtils } from './_shared/utils';
```

### 9.2 Caching
```typescript
// Sử dụng Vercel Edge Caching
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  // ...
}
```

## Troubleshooting

### Lỗi Thường Gặp

1. **Module not found**: Kiểm tra import paths và dependencies
2. **CORS errors**: Đảm bảo cấu hình CORS đúng
3. **Environment variables**: Kiểm tra biến môi trường trên Vercel
4. **Build errors**: Kiểm tra TypeScript types và dependencies

### Debug Tips
```bash
# Xem logs
vercel logs <deployment-url>

# Debug local
vercel dev --debug
```

## Kết Luận

Sau khi hoàn thành migration, bạn sẽ có:
- ✅ Serverless API endpoints thay vì Express server
- ✅ Auto-scaling và better performance
- ✅ Easier deployment và maintenance
- ✅ Cost-effective cho traffic thấp đến trung bình

Dự án sẽ sẵn sàng để deploy trên Vercel với khả năng scale tự động và performance tối ưu.