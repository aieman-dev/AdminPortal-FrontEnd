# Theme Park Portal

A production-ready, enterprise-grade web portal with authentication, protected routes, and a modern dashboard interface.

## Features

- **Secure Authentication System**
  - Mock authentication with local storage
  - Ready for backend API integration
  - Protected routes with middleware
  - Session management

- **Modern UI/UX**
  - Responsive sidebar navigation
  - Dark/light theme support
  - Clean, minimalist design
  - Mobile-friendly layout

- **Enterprise Architecture**
  - TypeScript for type safety
  - Modular component structure
  - Reusable utilities and hooks
  - Security best practices

- **Developer-Friendly**
  - Well-documented code
  - Extensible page templates
  - API client ready for integration
  - Comprehensive error handling

## Getting Started

### Demo Credentials

- **Admin Account**
  - Email: `admin@company.com`
  - Password: `admin123`

- **User Account**
  - Email: `user@company.com`
  - Password: `user123`

### Project Structure

\`\`\`
├── app/
│   ├── login/              # Login page
│   ├── portal/             # Protected portal pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── page-1/         # Blank page 1
│   │   ├── page-2/         # Blank page 2
│   │   ├── page-3/         # Blank page 3
│   │   ├── page-4/         # Blank page 4
│   │   └── your-page/      # New page added
│   │       └── page.tsx    # New page content
│   └── layout.tsx          # Root layout
├── components/
│   ├── auth/               # Authentication components
│   ├── portal/             # Portal-specific components
│   │   └── sidebar.tsx     # Updated with new navigation link
│   └── ui/                 # Reusable UI components
├── hooks/
│   └── use-auth.ts         # Authentication hook
├── lib/
│   ├── auth.ts             # Authentication logic
│   ├── api-client.ts       # API client for backend
│   ├── security.ts         # Security utilities
│   ├── constants.ts        # App constants
│   └── logger.ts           # Logging utility
└── middleware.ts           # Route protection middleware
\`\`\`

## Backend Integration Guide

### 1. Authentication API

Replace the mock authentication in `lib/auth.ts` with real API calls:

\`\`\`typescript
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  }
  
  return { success: false, error: data.error };
}
\`\`\`

### 2. API Client Usage

Use the `apiClient` for all backend requests:

\`\`\`typescript
import { apiClient } from '@/lib/api-client';

// GET request
const response = await apiClient.get('/users');

// POST request
const response = await apiClient.post('/users', { name: 'John' });

// PUT request
const response = await apiClient.put('/users/1', { name: 'Jane' });

// DELETE request
const response = await apiClient.delete('/users/1');
\`\`\`

### 3. Environment Variables

Add these to your `.env.local` file:

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.yourcompany.com
NEXT_PUBLIC_APP_ENV=production
\`\`\`

### 4. Middleware Enhancement

Update `middleware.ts` to validate tokens with your backend:

\`\`\`typescript
const response = await fetch(`${process.env.API_URL}/auth/verify`, {
  headers: { 'Authorization': `Bearer ${authToken}` }
});

if (!response.ok) {
  return NextResponse.redirect(new URL('/login', request.url));
}
\`\`\`

## Security Features

- **Input Sanitization**: All user inputs are sanitized
- **CSRF Protection**: Token-based CSRF protection utilities
- **Rate Limiting**: Client-side rate limiting for login attempts
- **Password Validation**: Strong password requirements
- **Secure Token Generation**: Cryptographically secure tokens
- **Protected Routes**: Middleware-based route protection

## Extending the Portal

### Adding a New Page

1. Create a new folder in `app/portal/your-page/`
2. Add a `page.tsx` file:

\`\`\`typescript
import { PageHeader } from "@/components/portal/page-header"
import { Card } from "@/components/ui/card"

export default function YourPage() {
  return (
    <div>
      <PageHeader 
        title="Your Page" 
        description="Description of your page"
      />
      <Card className="p-6">
        {/* Your content here */}
      </Card>
    </div>
  )
}
\`\`\`

3. Add navigation link in `components/portal/sidebar.tsx`

### Adding API Endpoints

Create route handlers in `app/api/`:

\`\`\`typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Your logic here
  return NextResponse.json({ users: [] });
}
\`\`\`

## Best Practices

1. **Always validate user input** on both client and server
2. **Use TypeScript types** for all data structures
3. **Handle errors gracefully** with try-catch blocks
4. **Log important events** using the logger utility
5. **Test authentication flows** before deploying
6. **Keep secrets in environment variables**, never in code
7. **Use the API client** for consistent error handling

## Production Checklist

- [ ] Replace mock authentication with real backend
- [ ] Set up proper environment variables
- [ ] Configure CORS policies
- [ ] Implement server-side rate limiting
- [ ] Add error tracking (e.g., Sentry)
- [ ] Set up logging service
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Add monitoring and analytics
- [ ] Test all authentication flows
- [ ] Review security configurations

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks + Local Storage

## Support

For questions or issues, please refer to the documentation or contact your development team.

---

Built with ❤️ for enterprise teams
