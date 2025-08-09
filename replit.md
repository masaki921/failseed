# Personal Growth Journal Application

## Overview

This is a full-stack web application designed to help users process negative experiences and turn them into personal growth opportunities. The app uses AI-powered conversations to guide users through a two-step reflection process, providing comfort, asking meaningful questions, and offering actionable insights for personal development. Built with React, Express, and Google's Gemini AI, it features a clean, therapeutic interface with Japanese language support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom color scheme (sage green theme for calming effect)
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Design Pattern**: Component-based architecture with reusable UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured endpoints for the two-step conversation flow
- **Error Handling**: Centralized error handling with safety checks for harmful content
- **Session Management**: Express sessions with PostgreSQL session store
- **Development**: Hot reload setup with Vite middleware integration

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Single `entries` table storing user conversations, AI responses, and growth insights
- **Migration**: Drizzle Kit for database schema management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Authentication and Authorization
- **Current Implementation**: Session-based storage without user authentication
- **Session Management**: Express sessions for tracking conversation state
- **Safety Features**: Content filtering to detect potentially harmful input and provide crisis resources

### AI Integration
- **Provider**: Google Gemini AI (gemini-2.5-flash model)
- **Implementation**: Custom service layer handling two-step conversation flow
- **Safety**: Built-in content moderation to identify concerning input and redirect to mental health resources
- **Response Structure**: JSON-formatted responses with structured comfort messages, questions, and growth insights
- **Prompt Engineering**: Specialized system prompts for empathetic, therapeutic responses

## External Dependencies

### Third-Party Services
- **Google Gemini AI**: Core AI functionality for generating therapeutic responses and growth insights
- **Neon Database**: Serverless PostgreSQL hosting for data persistence

### Key Development Dependencies
- **Radix UI**: Accessible component primitives for the UI
- **Tailwind CSS**: Utility-first styling framework
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Zod**: Runtime type validation and schema definition
- **Wouter**: Lightweight routing library

### Build and Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution for development server