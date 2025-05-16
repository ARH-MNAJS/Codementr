# Codementr - AI-powered Project Builder

> AI that guides, Skill that strides

Codementr is a full-stack AI project builder with GitHub authentication. It provides a platform for developers to create, manage, and collaborate on coding projects with AI assistance.

## Features

- GitHub OAuth authentication
- Admin/User role-based access control
- Project creation and management
- Modern UI with animated gradients and micro-interactions
- Responsive design for all devices
- Dark mode by default

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with JIT mode
- **Components**: shadcn component library
- **Authentication**: GitHub OAuth via NextAuth.js
- **Animations**: Framer Motion
- **UI**: Fluid and modern animated gradient theme

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- GitHub account and OAuth credentials

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd codementr
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
NEXTAUTH_SECRET=your-random-secret-key
ADMIN_GITHUB_USERNAME=your-github-username
NEXTAUTH_URL=http://localhost:3000
```

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "New OAuth App"
3. Fill in the application details:
   - **Application name**: Codementr (or your preferred name)
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/api/auth/callback/github
4. Click "Register application"
5. Copy the Client ID and generate a new Client Secret
6. Add these credentials to your `.env.local` file

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app` - Next.js App Router components and pages
  - `/api` - API routes including auth endpoints
  - `/components` - Reusable UI components
  - `/dashboard` - User dashboard
  - `/admin` - Admin dashboard
- `/lib` - Utility functions and helpers
- `/hooks` - Custom React hooks
- `/public` - Static assets

## License

[MIT](LICENSE)
