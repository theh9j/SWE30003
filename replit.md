# LC-PMS - Pharmacy Management System

## Overview

LC-PMS is a comprehensive pharmacy management system built with a modern full-stack architecture. The application provides functionality for managing inventory, prescriptions, sales, customers, and reports in a pharmacy setting. It features a React-based frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom pharmacy-themed design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage

### Database Schema
The system uses a comprehensive relational database schema with the following main entities:
- **Users**: Customers, pharmacists, and managers with role-based access
- **Categories**: Medicine categorization system
- **Medicines**: Product catalog with SKU, pricing, and prescription requirements
- **Inventory**: Stock management with batch tracking and expiry dates
- **Prescriptions**: Doctor prescriptions with validation workflow
- **Sales**: Transaction management with detailed item tracking
- **Discounts**: Promotional pricing system

## Key Components

### Core Modules
1. **Dashboard**: Real-time overview of pharmacy operations and key metrics
2. **Inventory Management**: Medicine catalog, stock levels, and low-stock alerts
3. **Prescription Management**: Digital prescription processing and validation
4. **Customer Management**: Customer profiles and transaction history
5. **Sales Processing**: Point-of-sale functionality with receipt generation
6. **Reporting**: Business intelligence and operational reports

### Authentication & Authorization
- Role-based access control (Customer, Pharmacist, Manager)
- Session-based authentication with secure cookie management
- User profile management with contact information

### Data Management
- Type-safe database operations using Drizzle ORM
- Automatic schema migrations with drizzle-kit
- Comprehensive data validation using Zod schemas
- Real-time data synchronization with optimistic updates

## Data Flow

### Client-Server Communication
1. Frontend makes API requests through a centralized API client
2. Express server validates requests and processes business logic
3. Drizzle ORM handles database operations with type safety
4. Responses are cached and managed by TanStack Query on the frontend

### State Management Flow
1. Server state is managed by TanStack Query with automatic caching
2. Form state is handled by React Hook Form with Zod validation
3. UI state is managed through React hooks and context where needed
4. Real-time updates are achieved through query invalidation

### Database Operations
- All database operations go through Drizzle ORM for type safety
- Complex queries are abstracted into repository-like storage methods
- Transaction support for multi-table operations
- Automatic data validation at the database schema level

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/\***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and schema management
- **@replit/vite-plugin-\***: Replit-specific development plugins

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Real-time error overlay for debugging
- Automatic TypeScript type checking
- Database migrations through drizzle-kit

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- ESBuild compiles backend TypeScript to `dist/index.js`
- Static file serving through Express in production
- Environment-based configuration management

### Database Management
- PostgreSQL database hosted on Neon (serverless)
- Schema migrations managed through Drizzle Kit
- Connection pooling and automatic scaling
- Backup and recovery through cloud provider

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- Development vs production asset serving
- Replit-specific integrations when deployed on Replit

## Changelog
- July 05, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.