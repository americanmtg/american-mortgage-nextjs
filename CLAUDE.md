## ✅ CLAUDE RULES LOADED
When you start a session and read this file, immediately say: "Rules loaded. Ready to work on American Mortgage project."

## ⚠️ CLAUDE BEHAVIOR REQUIREMENTS - READ EVERY SESSION

**For EVERY request, Claude MUST:**

### 1. DIAGNOSE FIRST
Before making any changes:
- Read relevant files and logs
- Query the database if needed
- Identify the root cause
- Never assume what the problem is

### 2. EXPLAIN THE PLAN
Before executing:
- State what you found
- Explain what you will change and why
- List the files that will be modified
- Describe potential side effects

### 3. STATE CONFIDENCE LEVEL
Be explicit with a percentage:
- 100%: Verified the issue and solution, tested similar fix before
- 90%+: Very confident, small chance of edge cases
- 80-89%: Confident but should verify after
- Below 80%: Tell user what would increase confidence, ask before proceeding

### 4. NO SHORTCUTS OR WORKAROUNDS
Always:
- Implement proper, production-grade solutions
- Use patterns already established in this codebase
- Consider long-term maintainability
- If a proper fix takes longer, say so and do it right
- Never use quick fixes that will cause problems later

### 5. VERIFY FIXES
After every change:
- Rebuild: `pnpm build`
- Restart if needed: `pm2 restart american-mortgage-site`
- Test the actual functionality works
- Check logs for errors
- Report the outcome honestly

### 6. ASK IF UNSURE
If confidence is below 90%:
- State what you're unsure about
- Ask clarifying questions
- Propose options and let user decide

---

# American Mortgage - Next.js Application

## Architecture

**Stack:** Next.js 14 + Prisma + PostgreSQL (standalone, no external CMS)

```
┌─────────────────────────────────────┐
│           Nginx (443/80)            │
│       dev.americanmtg.com           │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
/robots.txt  /cms-media/* /* (all other)
(static)    (static)     localhost:3000
                         (Next.js)
                              │
                              ▼
                         PostgreSQL
                    american_mortgage
```

## Quick Reference

| Item | Value |
|------|-------|
| Port | 3000 |
| PM2 name | `american-mortgage-site` |
| URL | https://dev.americanmtg.com |
| Database | PostgreSQL via Prisma |
| Auth | JWT-based custom auth |

## Common Commands

```bash
# Rebuild application
pnpm build

# Restart site
pm2 restart american-mortgage-site

# View logs
pm2 logs american-mortgage-site

# Kill zombie processes (if site won't start)
lsof -ti:3000 | xargs -r kill -9

# Full restart (stop, kill zombies, start)
pm2 stop american-mortgage-site && lsof -ti:3000 | xargs -r kill -9 && pm2 start american-mortgage-site
```

## Troubleshooting: Zombie Processes

If the site won't start with `EADDRINUSE` error, there's likely a zombie `next-server` process:

```bash
# Check what's on port 3000
ss -tlnp | grep 3000

# Kill any process on port 3000
lsof -ti:3000 | xargs -r kill -9

# Then restart PM2
pm2 restart american-mortgage-site
```

## Project Structure

```
src/
├── app/
│   ├── (admin)/           # Admin panel UI
│   │   └── admin/
│   │       ├── blog/              # Blog post management
│   │       ├── footer/            # Footer content
│   │       ├── header/            # Header customization
│   │       ├── homepage/          # Homepage content (NEW)
│   │       ├── loans/             # Featured loan cards
│   │       ├── login/             # Admin login
│   │       ├── media/             # File uploads
│   │       ├── menu/              # Navigation management
│   │       ├── pages/             # CMS page management
│   │       ├── preapproval-letters/ # Pre-approval letter verification (NEW)
│   │       ├── routes/            # URL route management
│   │       ├── seo/               # SEO settings
│   │       ├── settings/          # Site settings
│   │       ├── users/             # Admin user management
│   │       └── view-site/         # Preview link
│   ├── (site)/            # Public website pages
│   │   ├── [slug]/                # Dynamic CMS pages
│   │   ├── calculator/            # Mortgage calculator
│   │   ├── learn/                 # Blog/articles
│   │   ├── verify/                # Pre-approval letter verification (NEW)
│   │   └── page.tsx               # Homepage
│   ├── api/               # API routes (all CRUD operations)
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Shared React components
│   ├── Header.tsx                 # Site header with navigation
│   ├── Footer.tsx                 # Site footer
│   ├── HeroSection.tsx            # Homepage hero
│   ├── MobileMenuButton.tsx       # Mobile menu toggle
│   └── templates/                 # Page templates
├── lib/
│   ├── data.ts            # Data fetching layer (Prisma queries)
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # JWT authentication
│   ├── api-auth.ts        # API route auth helpers
│   ├── db.ts              # Direct PostgreSQL pool
│   └── payload.ts         # Payload CMS compatibility layer
public/
├── robots.txt             # Search engine blocking (dev only)
├── cms-media/             # Uploaded media files
└── images/                # Static images
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/data.ts` | All data fetching functions (getPages, getPosts, getSiteSettings, getHomepageSettings, etc.) |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | JWT token creation, verification, session management |
| `src/lib/api-auth.ts` | `requireAuth()` helper for protected API routes |
| `prisma/schema.prisma` | Database schema (source of truth for DB structure) |

## Environment Variables

**Required in `.env.local`:**
```
DATABASE_URI=postgres://amuser:AmMtg2025Secure@localhost:5432/american_mortgage
JWT_SECRET=american-mortgage-admin-secret-key-2025
```

## Media Files

Media files are stored in `public/cms-media/` and served via nginx at `/cms-media/*`.

Database `media` table stores metadata with URLs like `/cms-media/filename.png`.

## Admin Panel

Custom admin UI at `/admin` with JWT authentication.

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/admin` | Overview statistics |
| Pages | `/admin/pages` | CMS page management |
| Blog | `/admin/blog` | Blog post management |
| Media | `/admin/media` | File upload and management |
| Menu | `/admin/menu` | Navigation management |
| Loans | `/admin/loans` | Featured loan cards |
| Header | `/admin/header` | Header customization |
| Footer | `/admin/footer` | Footer content |
| SEO | `/admin/seo` | SEO settings |
| Settings | `/admin/settings` | Site settings (logo, contact info) |
| Users | `/admin/users` | Admin user management |
| Routes | `/admin/routes` | URL route management |
| Homepage | `/admin/homepage` | Homepage hero & content customization |
| Pre-Approval Letters | `/admin/preapproval-letters` | Manage pre-approval letters, loan officers, and verify page settings |

## API Routes

All data operations use internal API routes:

### Content Management
- `/api/pages`, `/api/pages/[id]` - CMS pages
- `/api/blog-posts`, `/api/blog-posts/[id]` - Blog posts
- `/api/media`, `/api/media/[id]` - Media uploads
- `/api/featured-loans`, `/api/featured-loans/[id]` - Featured loan cards
- `/api/routes`, `/api/routes/[id]` - URL routing

### Settings
- `/api/settings/site` - Site settings (logo, contact info) - GET is public, PUT requires auth
- `/api/settings/seo` - SEO settings
- `/api/settings/header` - Header customization
- `/api/settings/footer` - Footer content
- `/api/settings/navigation` - Navigation menu
- `/api/settings/homepage` - Homepage content settings
- `/api/settings/verify-page` - Verification page settings

### Pre-Approval Letter System
- `/api/preapproval-letters` - CRUD for pre-approval letters
- `/api/preapproval-letters/[id]` - Individual letter operations
- `/api/preapproval-letters/verify` - Public verification endpoint (POST)
- `/api/loan-officers` - CRUD for loan officers
- `/api/loan-officers/[id]` - Individual loan officer operations

### Auth & Admin
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`
- `/api/admin/users`, `/api/admin/users/[id]`

## Database Tables (Prisma Schema)

### Core Content
- `pages` - CMS pages with templates
- `blog_posts` - Blog articles with key takeaways
- `media` - Uploaded files metadata
- `featured_loans` - Loan product cards with features
- `routes` - URL routing configuration

### Settings
- `site_settings` - Company info, logos, social links
- `seo_settings` - SEO meta tags, Open Graph
- `header_settings` - Header styling and button
- `footer` / `footer_columns` / `footer_columns_links` - Footer content
- `navigation_main_menu` / `navigation_main_menu_children` - Navigation structure
- `homepage_settings` - Homepage section content (hero, DPA, tools, articles)

### Pre-Approval Letter Verification System
- `preapproval_letters` - Pre-approval letters with reference IDs, borrower names, dates, status (authentic/invalid/expired)
- `loan_officers` - Loan officer contact info (name, phone, email)
- `verify_page_settings` - Customizable verification page messages with placeholder support (`{Borrower Name}`, `{Letter Date}`)

### Auth & System
- `admin_users` - Admin panel users
- `users` / `users_sessions` - User authentication

## Pre-Approval Letter Verification Feature

Public page at `/verify` allows anyone to verify a pre-approval letter by entering its reference ID.

**How it works:**
1. User enters reference ID (e.g., `PA-2024-001234`)
2. System looks up the letter in `preapproval_letters` table
3. If found and status is "authentic", shows success message with borrower name, date, and loan officer contact
4. If not found or invalid/expired, shows failure message

**Admin capabilities:**
- Manage letters: add, edit, delete, change status
- Manage loan officers: add, edit, delete
- Customize verification page messages with placeholders

## Future: Forms System

Database tables exist but are not yet implemented:
- `form_definitions` - Form configuration
- `form_fields` - Form field definitions
- `form_submissions` - Submitted form data
- `landing_pages` - Landing page configurations
- `loan_applicants` - Loan application submissions

## Development vs Production

**Dev protections (remove for production):**
1. X-Robots-Tag header in nginx
2. robots.txt with `Disallow: /`

**Production checklist:**
1. Update nginx config (remove X-Robots-Tag, update server_name)
2. Update robots.txt to allow indexing
3. Request SSL cert for production domain
4. Update JWT_SECRET to a secure value
