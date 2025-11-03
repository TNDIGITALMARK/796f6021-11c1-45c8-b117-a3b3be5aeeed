# TrustPositif Bot Manager - Implementation Guide

## Overview

TrustPositif Bot Manager adalah platform monitoring keamanan website yang memantau status pemblokiran domain di Indonesia melalui database TrustPositif Kominfo. Sistem ini mengirim notifikasi otomatis ke grup Telegram setiap 5 menit dengan laporan status lengkap.

## Features Implemented

### 1. Authentication System
- **Login page** dengan username/password authentication
- **Role-based access control** (Admin & User)
- **Session management** dengan localStorage
- **Default admin account**: username: `admin`, password: `admin123`

### 2. Admin Dashboard (`/admin`)
- **User management**: Create, view, and manage user accounts
- **Bot configuration**: Set up Telegram chat IDs for users
- **Statistics dashboard**: View active users, bots, and domains
- **User creation form**: Create new users with bot configurations

### 3. User Dashboard (`/dashboard`)
- **Real-time domain monitoring**: Add and monitor domains
- **Status tracking**: See which domains are "AMAN" (safe) or "DIBLOKIR" (blocked)
- **Domain management**: Add new domains, delete existing ones
- **Telegram integration panel**: Configure bot and view connected groups
- **Auto-refresh**: Domains are checked automatically

### 4. Backend Services

#### TrustPositif Checker (`/lib/trustpositif-checker.ts`)
- Checks domain status on https://trustpositif.komdigi.go.id/
- Validates domain formats
- Parses responses to determine "AMAN" or "DIBLOKIR" status
- API endpoint: `/api/check-domain`

#### Telegram Bot Integration (`/lib/telegram-bot.ts`)
- **Bot Token**: `7760727060:AAGGwhPNVMcmnhHsXttlhNfx-4vAinCshWo`
- **Bot Username**: `@crozxy_ceknawala_bot`
- Sends formatted monitoring reports to Telegram groups
- Sends instant alerts when domain status changes to "DIBLOKIR"
- Report format includes:
  - Total domains
  - Domain status counts (Aman/Diblokir)
  - Individual domain statuses
  - Change indicators

#### Database Service (`/lib/database.ts`)
- **Mock implementation** for MVP (in-memory storage)
- User management (CRUD operations)
- Domain management (CRUD operations)
- Status history tracking
- Ready to replace with Google Sheets API integration

#### Monitoring Service (`/api/monitoring/check-all`)
- Checks all domains for all active users
- Updates domain statuses
- Sends Telegram reports
- Tracks status changes
- Can be called by cron job every 5 minutes

## Tech Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui components
- **Database**: Mock in-memory (ready for Google Sheets API)
- **External APIs**:
  - TrustPositif Kominfo API
  - Telegram Bot API

## Project Structure

```
src/
├── app/
│   ├── admin/page.tsx          # Admin dashboard
│   ├── dashboard/page.tsx      # User dashboard
│   ├── login/page.tsx          # Login page
│   ├── page.tsx                # Root page (redirects based on auth)
│   ├── globals.css             # Global styles with design system
│   └── api/
│       ├── auth/login/         # Login endpoint
│       ├── check-domain/       # TrustPositif checker endpoint
│       ├── domains/            # Domain CRUD endpoints
│       ├── users/              # User CRUD endpoints
│       └── monitoring/check-all/ # Monitoring endpoint
├── lib/
│   ├── auth.ts                 # Authentication utilities
│   ├── database.ts             # Mock database (replace with Sheets)
│   ├── telegram-bot.ts         # Telegram integration
│   ├── trustpositif-checker.ts # Domain status checker
│   └── types.ts                # TypeScript interfaces
└── components/ui/              # Reusable UI components
```

## Design System

### Colors
- **Primary (Dark Blue)**: `#1e3a5f` - Sidebar & header background
- **Secondary (Light Blue)**: `#b8d4e8` - Hover states
- **Success Green**: `#10b981` - "AMAN" status badges
- **Danger Red**: `#ef4444` - "DIBLOKIR" status badges
- **Accent Blue**: `#3b82f6` - Buttons & links
- **Background**: `#e5e7eb` - Page background

### Typography
- **Font Family**: Inter (imported from Google Fonts)
- **Base Size**: 14px
- **Heading Sizes**: 24px (h1), 20px (h2), 16px (h3)

### Components
- **Status Badges**: Rounded full pills with uppercase text
- **Cards**: White background, 8px border radius, subtle shadow
- **Tables**: Alternating rows, bordered cells
- **Buttons**: Solid colors, rounded corners, hover effects

## How to Use

### For Admin:
1. Login with admin credentials (`admin` / `admin123`)
2. Navigate to Admin Dashboard (`/admin`)
3. Create new user accounts with:
   - Username & password
   - Telegram Chat ID (for the group)
   - Bot activation status
4. View user statistics and bot statuses

### For Users:
1. Login with credentials provided by admin
2. Navigate to User Dashboard (`/dashboard`)
3. Add domains to monitor:
   - Enter domain without `https://` (e.g., `example.com`)
   - Click "Add" to start monitoring
4. View domain statuses in the table:
   - Green badge = "AMAN" (safe)
   - Red badge = "DIBLOKIR" (blocked)
5. Configure Telegram bot to receive reports

### Setting Up Telegram Bot:
1. Add bot `@crozxy_ceknawala_bot` to your Telegram group
2. Get the group Chat ID (use @userinfobot or similar)
3. Enter Chat ID in admin dashboard when creating user
4. Bot will send reports every 5 minutes automatically

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
  - Body: `{ username, password }`
  - Returns: `{ success, data: { user, token } }`

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
  - Body: `{ username, password, botConfig }`

### Domains
- `GET /api/domains?userId={id}` - Get user's domains
- `POST /api/domains` - Add new domain
  - Body: `{ userId, domain }`
- `DELETE /api/domains?id={id}` - Delete domain

### Monitoring
- `POST /api/check-domain` - Check single domain status
  - Body: `{ domain }`
- `POST /api/monitoring/check-all` - Check all domains and send reports

## Scheduled Monitoring

To enable 5-minute automated checking, set up a cron job that calls:
```bash
curl -X POST http://your-server.com/api/monitoring/check-all
```

Schedule: `*/5 * * * *` (every 5 minutes)

For Vercel deployment, use Vercel Cron Jobs or external services like:
- cron-job.org
- EasyCron
- Vercel Cron (add to vercel.json)

Example vercel.json:
```json
{
  "crons": [
    {
      "path": "/api/monitoring/check-all",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Upgrading to Production

### 1. Replace Mock Database with Google Sheets
- Install Google Sheets API credentials
- Update `/lib/database.ts` to use googleapis
- Create two spreadsheets:
  - `database_admin` (users)
  - `database_user` (domains)

### 2. Secure Authentication
- Replace `btoa()` password hashing with bcrypt
- Implement JWT with proper signing
- Add token expiration & refresh logic

### 3. Error Handling
- Add comprehensive error logging
- Implement retry logic for API calls
- Add user-friendly error messages

### 4. Performance Optimization
- Add caching for domain checks
- Implement rate limiting
- Optimize database queries

## Default Credentials

**Admin Account**:
- Username: `admin`
- Password: `admin123`

**Change this immediately in production!**

## Environment Variables

Currently using hardcoded values for MVP. For production, add to `.env.local`:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=7760727060:AAGGwhPNVMcmnhHsXttlhNfx-4vAinCshWo
TELEGRAM_BOT_USERNAME=@crozxy_ceknawala_bot

# Google Sheets (when implementing)
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=your-private-key
SPREADSHEET_ID_ADMIN=your-admin-spreadsheet-id
SPREADSHEET_ID_USER=your-user-spreadsheet-id

# Security
JWT_SECRET=your-secret-key
```

## Next Steps

1. **Deploy to VPS Indonesia** - Deploy ke server Indonesia untuk performa optimal
2. **Set up cron job** - Enable 5-minute automated checking
3. **Google Sheets Integration** - Replace mock database
4. **Secure authentication** - Implement proper JWT & bcrypt
5. **Add Reports Page** - Analytics dashboard with charts
6. **Email notifications** - Alternative to Telegram
7. **Mobile responsive** - Optimize for mobile devices
8. **Multi-language support** - English & Indonesian

## Support

For questions or issues:
- Check TrustPositif API: https://trustpositif.komdigi.go.id/
- Telegram Bot API: https://core.telegram.org/bots/api
- Next.js Documentation: https://nextjs.org/docs

---

**Created with ❤️ for monitoring Indonesian website accessibility**
