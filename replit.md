# FailSeed - Personal Growth Journal Application

## Overview

FailSeed is a full-stack web application designed to help HSP (Highly Sensitive Person) and perfectionist users transform negative experiences into personal growth opportunities. The app uses AI-powered unlimited conversations with "FailSeed君" to guide users through natural dialogue, providing empathy, asking meaningful questions, and eventually extracting actionable learning insights. Built with React, Express, and Google's Gemini AI, it features a gentle, therapeutic interface optimized for sensitive users with Japanese language support.

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
- **API Design**: RESTful API with conversation-based endpoints supporting unlimited dialogue flow
- **Conversation Flow**: Three-phase system (start, continue, finalize) with user-controlled finalization button
- **Error Handling**: Centralized error handling with safety checks for harmful content
- **Session Management**: Express sessions with PostgreSQL session store
- **Development**: Hot reload setup with Vite middleware integration

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting (switched from in-memory to database storage on 2025-08-09)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Enhanced `entries` table with session-based isolation storing conversation history as JSON, growth insights, and learning status
- **Privacy Protection**: Session ID-based data isolation implemented (2025-08-09) - each user can only access their own records
- **Conversation Storage**: Full dialogue history preserved to enable learning extraction from complete context
- **Migration**: Drizzle Kit for database schema management (schema pushed successfully)
- **Session Storage**: Express session management with session ID tracking for data privacy
- **Storage Implementation**: DatabaseStorage class using Drizzle ORM queries with session-based filtering

### Authentication and Authorization
- **Current Implementation**: Session-based storage without user authentication
- **Session Management**: Express sessions for tracking conversation state
- **Safety Features**: Content filtering to detect potentially harmful input and provide crisis resources

### AI Integration
- **Provider**: Google Gemini AI (gemini-2.5-flash model)
- **Implementation**: "FailSeed君" persona - a gentle, empathetic AI counselor that leads natural conversations
- **Conversation Management**: AI decides when sufficient information has been gathered to extract meaningful learning
- **Safety**: Built-in content moderation to identify concerning input and redirect to mental health resources
- **Response Structure**: Natural conversational responses with user-initiated learning conversion
- **Prompt Engineering**: Natural conversation system focusing on acceptance, empathy, and gentle exploration of root causes without formal phases
- **User Control**: Always-available "学びに変換する" (Convert to Learning) button during conversations

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