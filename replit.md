# eCFR Data Analyzer - Project Documentation

## Overview
A full-stack web application that downloads and analyzes U.S. Electronic Code of Federal Regulations (eCFR) data from the official government API.

## Current Status
✅ **Application Fully Functional and Running on Port 5000**
- All frontend components working with professional Material Design aesthetic
- All backend API endpoints operational
- PostgreSQL database connected and ready
- Navigation, routing, and UI interactions verified through end-to-end tests
- Dark mode default with professional data dashboard design

## Project Architecture

### Data Models (shared/schema.ts)
- `regulations` table: Stores eCFR data with agency, title, chapter, section, text content, word count, checksum
- `fetchMetadata` table: Tracks data fetch operations with timestamp, status, error messages
- TypeScript interfaces for AgencyAnalysis, WordCountAnalysis, ChecksumData

### Frontend (client/src/)
**Pages:**
- `dashboard.tsx`: Hero section with refresh button, 4 metric cards, 4 interactive charts (word count, RCI, distribution, vocabulary)
- `analysis.tsx`: Tabbed interface (Overview, Word Count, Complexity, Checksums) with sortable data tables and export buttons
- `navigation.tsx`: Top nav bar with active route highlighting

**Components:**
- `metric-card.tsx`: Reusable metric display with icon, value, optional trend
- `chart-card.tsx`: Wrapper for charts with title, description, icon
- `data-table.tsx`: Sortable table with column headers, empty states
- `export-buttons.tsx`: CSV and JSON export controls
- `loading-skeleton.tsx`: Loading states for metrics, charts, tables

### Backend (server/)
**Files:**
- `db.ts`: PostgreSQL connection using Neon with Drizzle ORM
- `storage.ts`: DatabaseStorage implementation with IStorage interface
- `routes.ts`: Express API routes for all endpoints
- `ecfr-service.ts`: eCFR API integration, text analysis, RCI calculation, checksum generation

**API Endpoints:**
- `GET /api/metadata` - Latest fetch metadata
- `GET /api/agencies` - List all agencies
- `GET /api/agency/:name` - Regulations for specific agency
- `GET /api/analysis/agencies` - Complete analysis with RCI
- `GET /api/analysis/wordcount` - Word count metrics
- `GET /api/analysis/checksums` - Data integrity checksums
- `POST /api/fetch` - Trigger eCFR data fetch

### Analysis Methods
**Regulatory Complexity Index (RCI):**
- Formula: Average Sentence Length × Vocabulary Diversity
- Measures regulatory text complexity
- Higher values indicate more complex language

**Text Analysis:**
- Word counting and sentence parsing
- Unique word identification for vocabulary diversity
- SHA-256 checksum generation for change detection

## Database Schema
Created via execute_sql_tool:
```sql
regulations (id, agency, title, chapter, section, text_content, word_count, checksum, created_at)
fetch_metadata (id, last_fetch_at, status, total_regulations, error_message)
```

## User Preferences
- App name: "eCFR Data Analyzer" (displayed in navigation and page titles)

## Recent Changes
- 2025-10-23: Complete implementation and successful deployment
  - All frontend components built with Material Design data dashboard aesthetic
  - All backend services and API endpoints implemented
  - PostgreSQL database schema created and operational
  - Export functionality (CSV/JSON) implemented
  - Loading states and error handling in place
  - Fixed React nested anchor tag warnings
  - Verified all functionality through end-to-end Playwright tests
  - Application running successfully on port 5000

## Next Steps for Users
1. Click "Refresh Data" button on Dashboard to fetch eCFR data from government API
2. Explore analytics in the Analysis page
3. Export data using CSV or JSON export buttons
4. Publish the application to make it publicly accessible
