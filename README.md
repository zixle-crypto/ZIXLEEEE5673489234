# Perception Shift - A Secure React Game with Supabase Backend

A modern web-based puzzle game built with React, TypeScript, and Supabase, featuring advanced security implementations and real-time multiplayer capabilities.

## 🎮 About the Project

Perception Shift is an interactive puzzle game where players navigate through rooms, collect shards, and compete on global leaderboards. The project demonstrates modern web development practices with a focus on security, scalability, and user experience.

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system and semantic tokens
- **Zustand** for efficient state management
- **React Router** for client-side routing
- **Lucide React** for consistent iconography

### Backend Infrastructure
- **Supabase** as the primary backend service
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Edge Functions** for serverless API endpoints
- **Resend** for secure email delivery
- **Real-time subscriptions** for live updates

## 🔐 Security Implementation

This project implements enterprise-grade security measures:

### Database Security
- **Row Level Security (RLS)** on all tables
- **User-specific data isolation** - users can only access their own data
- **Sanitized leaderboard** - no PII exposure (usernames instead of emails)
- **Rate limiting** for verification codes (3 attempts per 5 minutes)
- **Hashed verification codes** stored in database
- **Search path hardening** for all database functions

### API Security
- **CORS restrictions** to project domain only
- **JWT authentication** for protected endpoints
- **Input validation** and sanitization
- **Anti-abuse measures** for game mechanics
- **Secure headers** implementation

### Authentication Flow
- **Email verification** with time-limited codes
- **Passwordless authentication** system
- **Session management** with auto-refresh
- **User enumeration protection**

## 🗃️ Database Schema

### Core Tables
- `profiles` - User profile information
- `user_game_data` - Game statistics and power-ups
- `user_inventory` - Player's collected items
- `leaderboard` - Global rankings (sanitized)
- `verification_codes` - Email verification system
- `verification_attempts` - Rate limiting data

### Security Features
- All tables have RLS policies
- Foreign key constraints for data integrity
- Automated triggers for data consistency
- Indexed columns for performance

## 🚀 Key Features

### Game Mechanics
- **Multi-room progression** with increasing difficulty
- **Shard collection system** with anti-inflation measures
- **Time-based bonuses** for efficient completion
- **Power-up system** with temporary effects
- **Global leaderboards** with ranking system

### User Experience
- **Responsive design** for all screen sizes
- **Dark/light theme support** with system preference detection
- **Real-time updates** for leaderboards and game state
- **Smooth animations** and transitions
- **Accessible UI** with proper ARIA labels

### Administrative Features
- **Comprehensive logging** for debugging
- **Performance monitoring** through analytics
- **Security scanning** with automated reports
- **Database health checks** and optimization

## 🛠️ Development Process

### Initial Setup
1. **Project scaffolding** with Vite + React + TypeScript
2. **Tailwind CSS integration** with custom design system
3. **Supabase project creation** and configuration
4. **Database schema design** with security-first approach

### Security Implementation
1. **Comprehensive security audit** identifying vulnerabilities
2. **RLS policy implementation** for all data access
3. **Edge function hardening** with rate limiting
4. **CORS and authentication** security measures
5. **Anti-abuse systems** for game mechanics

### Feature Development
1. **Core game mechanics** implementation
2. **Authentication system** with email verification
3. **Leaderboard system** with real-time updates
4. **User interface** with responsive design
5. **State management** with Zustand

### Quality Assurance
1. **TypeScript integration** for type safety
2. **ESLint configuration** for code quality
3. **Security linting** with automated checks
4. **Performance optimization** and monitoring
5. **Cross-browser testing** and compatibility

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── game/            # Game-specific components
│   └── auth/            # Authentication components
├── pages/               # Route components
├── stores/              # Zustand stores
├── lib/                 # Utility functions
├── hooks/               # Custom React hooks
└── integrations/        # Third-party integrations
    └── supabase/        # Supabase client and types

supabase/
├── functions/           # Edge functions
│   ├── send-verification-code/
│   ├── verify-code/
│   └── complete-room/
└── migrations/          # Database migrations
```

## 🚀 Deployment

### Environment Setup
The application uses Supabase for backend services with the following configuration:
- **Project ID**: `ihvnriqsrdhayysfcywm`
- **Environment**: Production-ready with security hardening
- **CDN**: Global edge network for optimal performance

### Edge Functions
Three serverless functions handle backend operations:
1. **send-verification-code**: Email delivery with rate limiting
2. **verify-code**: User verification with security measures
3. **complete-room**: Game completion with anti-abuse protection

## 🔧 Local Development

```bash
# Clone the repository
git clone [repository-url]
cd perception-shift

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🧪 Testing

The project includes comprehensive testing strategies:
- **Type checking** with TypeScript
- **Linting** with ESLint
- **Security scanning** with Supabase linter
- **Manual testing** across browsers and devices

## 📊 Performance Considerations

- **Code splitting** for optimal bundle sizes
- **Lazy loading** for non-critical components
- **Database indexing** for query optimization
- **CDN delivery** for static assets
- **Real-time optimizations** for live features

## 🔮 Future Enhancements

- **Mobile app** development with React Native
- **Advanced analytics** and user behavior tracking
- **Social features** like friend systems and chat
- **Tournament system** with scheduled competitions
- **Achievement system** with unlockable rewards

## 🤝 Contributing

This project demonstrates modern web development practices and can serve as a reference for:
- Secure authentication implementations
- Real-time game mechanics
- Supabase integration patterns
- TypeScript best practices
- Security-first development

---

## Original Lovable Project Info

**Lovable Project URL**: https://lovable.dev/projects/8409cf31-86a0-4af3-9f6a-f9e97eeb6792

### Technologies Used
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

### How to Edit
- **Use Lovable**: Visit the project URL and start prompting
- **Use your IDE**: Clone repo and push changes (auto-syncs to Lovable)
- **GitHub Codespaces**: Available for cloud development

### Deployment
Open Lovable and click Share → Publish for instant deployment.

**Built with ❤️ using Lovable, React, and Supabase**