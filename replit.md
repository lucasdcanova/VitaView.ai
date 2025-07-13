# VitaView AI - Plataforma de Análise Bioquímica com IA

## Overview

VitaView AI é uma plataforma avançada de análise de exames médicos que utiliza inteligência artificial para extrair, analisar e interpretar dados de documentos médicos. O sistema processa PDFs e imagens de exames, fornecendo insights personalizados e acompanhamento de tendências de saúde ao longo do tempo.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with Shadcn/UI components
- **State Management**: React Context API for auth, profiles, and sidebar state
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using bcrypt-style password hashing
- **Session Management**: Express sessions with PostgreSQL store
- **File Processing**: Base64 encoding for document uploads
- **API Design**: RESTful endpoints with consistent error handling

### Database Layer
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL (@neondatabase/serverless)
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Session Storage**: PostgreSQL-backed session store for authentication

## Key Components

### Dual AI Processing Pipeline
The system implements a sophisticated two-stage AI pipeline:

1. **Extraction Stage (Google Gemini)**
   - Processes raw medical documents (PDFs, images)
   - Extracts structured health metrics from unstructured content
   - Optimized for Brazilian Portuguese medical terminology
   - Implements retry mechanism with exponential backoff (5 attempts)

2. **Analysis Stage (OpenAI GPT-4o)**
   - Receives structured data from extraction stage
   - Performs deep medical analysis and interpretation
   - Generates clinical insights and recommendations
   - Provides personalized health scoring

### Fallback Mechanism
- Primary: Gemini API for extraction (cost-effective, fast)
- Fallback: OpenAI API if Gemini fails
- Graceful degradation with default values to maintain user experience

### Multi-Profile Support
- Users can create multiple health profiles (family members, dependents)
- Each profile maintains separate exam history and health metrics
- Profile switching with context preservation

### Health Metrics Normalization
- Standardizes exam names and terminology across different laboratories
- Handles variations in capitalization, abbreviations, and alternative names
- Enables accurate trend analysis and historical comparisons

## Data Flow

```
Document Upload → Base64 Encoding → Gemini Extraction → Data Validation → 
PostgreSQL Storage → OpenAI Analysis → Insights Generation → User Dashboard
```

1. User uploads medical document via React frontend
2. Document converted to base64 and sent to backend
3. Gemini API extracts structured health metrics
4. Extracted data stored in PostgreSQL with exam status "extraction_complete"
5. OpenAI API analyzes extracted data for insights
6. Analysis results stored and exam status updated to "analysis_complete"
7. User receives notification and can view comprehensive results

## External Dependencies

### AI Services
- **Google Gemini 1.5 Pro**: Document extraction and initial processing
- **OpenAI GPT-4o**: Advanced analysis and medical interpretation

### Database & Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **Express Sessions**: Authentication and session management

### File Processing
- **Base64 encoding**: For document transmission and storage
- **Support for**: PDF, JPEG, PNG file formats

### UI Components
- **Shadcn/UI**: Pre-built accessible components
- **Radix UI**: Primitive components for complex interactions
- **Recharts**: Data visualization and charting

## Deployment Strategy

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_API_KEY`: Google Gemini API authentication
- `OPENAI_API_KEY`: OpenAI API authentication
- `SESSION_SECRET`: Session encryption key

### Build Process
- **Development**: `npm run dev` with hot reloading via Vite
- **Production**: `npm run build` → Vite frontend build + esbuild backend bundle
- **Database**: `npm run db:push` for schema synchronization

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Common TypeScript types and schemas
├── attached_assets/ # Static assets and data files
└── migrations/      # Database migration files
```

### Testing Strategy
- `server/test-ai.ts`: End-to-end AI pipeline testing
- `server/test-db.ts`: Database schema compatibility testing
- Manual API testing via routes for individual components

The system is designed for scalability with serverless PostgreSQL, stateless authentication, and efficient AI processing pipeline that optimizes cost while maintaining accuracy through intelligent fallback mechanisms.