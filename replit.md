# eCFR Data Analyzer - Project Documentation

## Overview
A full-stack web application that downloads and analyzes U.S. Electronic Code of Federal Regulations (eCFR) data from the official government API.

## Current Status
✅ **Schema & Frontend Complete**: All data models defined, all React components built with professional design
✅ **Backend Complete**: All API endpoints, eCFR service, text analysis, database integration implemented
✅ **Integration Complete**: React Query connections, export functionality, loading states all in place
⚠️ **Deployment Issue**: Workflow startup blocked by tsx not found in PATH (Replit environment issue)

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
None specified yet.

## Known Issues
1. **tsx not in PATH**: The workflow cannot start because `tsx` command is not available. This is a Replit environment/package installation issue, not a code issue. All packages are listed as installed in the View section but tsx is not in the system PATH.

## Recent Changes
- 2025-10-23: Complete implementation of eCFR Data Analyzer MVP
  - All frontend components built with Material Design data dashboard aesthetic
  - All backend services and API endpoints implemented
  - PostgreSQL database schema created and ready
  - Export functionality (CSV/JSON) implemented
  - Loading states and error handling in place

## Next Steps
1. Resolve tsx PATH issue to start the workflow
2. Test data fetch from eCFR API
3. Verify all analytics calculations
4. Run end-to-end tests of user journeys
