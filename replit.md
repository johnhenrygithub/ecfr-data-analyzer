# eCFR Data Analyzer - Project Documentation

## Overview
A full-stack web application that downloads and analyzes U.S. Electronic Code of Federal Regulations (eCFR) data from the official government API.

## Current Status
✅ **Application Fully Functional with Live eCFR Data**
- Successfully fetching and analyzing real U.S. federal regulations
- 5 regulations loaded with over 2 million words analyzed
- All charts and analytics displaying live data
- Professional Material Design data dashboard aesthetic
- Dark mode default

## Project Architecture

### Data Models (shared/schema.ts)
- `regulations` table: Stores eCFR data with agency, title, chapter, section, text content, word count, checksum
- `fetchMetadata` table: Tracks data fetch operations with timestamp, status, error messages
- TypeScript interfaces for AgencyAnalysis, WordCountAnalysis, ChecksumData

### Frontend (client/src/)
**Pages:**
- `dashboard.tsx`: Hero section with refresh button, 4 metric cards (Total Agencies, Total Regulations, Total Words, Avg Complexity), 4 interactive charts (Word Count by Agency, RCI, Distribution, Vocabulary Diversity)
- `analysis.tsx`: Tabbed interface (Overview, Word Count, Complexity, Checksums) with sortable data tables and CSV/JSON export
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
- `ecfr-service.ts`: eCFR API integration, XML parsing, text analysis, RCI calculation, checksum generation

**API Endpoints:**
- `GET /api/metadata` - Latest fetch metadata
- `GET /api/agencies` - List all agencies
- `GET /api/agency/:name` - Regulations for specific agency
- `GET /api/analysis/agencies` - Complete analysis with RCI
- `GET /api/analysis/wordcount` - Word count metrics
- `GET /api/analysis/checksums` - Data integrity checksums
- `POST /api/fetch` - Trigger eCFR data fetch

**eCFR Integration:**
- Base URL: `https://www.ecfr.gov/api/versioner/v1`
- Titles endpoint: `/titles` - Returns list of all CFR titles with metadata
- Full content endpoint: `/full/{date}/title-{number}.xml` - Returns complete regulatory text in XML format
- XML parsing: Extracts plain text from XML structure for analysis

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
- 2025-10-28: Added memory management and error handling improvements
  - Implemented XML size checking (75M character limit) to prevent crashes
  - Added automatic skipping of extremely large titles (Title 40)
  - Improved error handling to maintain accurate metadata even on fetch failures
  - Enhanced garbage collection with explicit memory cleanup
  - Successfully processed Title 26 (73M chars, 12M words) without issues
  - Total of 48 CFR titles analyzed (Title 40 excluded)
  
- 2025-10-27: Implemented complete selective refresh feature for CFR titles
  - Added checkbox UI to select specific titles for refresh
  - Implemented backend deletion of specific agencies using Drizzle's `inArray()`
  - Fixed metadata calculation to show correct total regulation count (not just current fetch)
  - Added comprehensive query invalidation (agencies, wordcount, checksums)
  - Real-time progress tracking with X/N format during selective refresh
  - "Loaded" badges appear for successfully refreshed titles
  - Data persists across all page navigation
  - Dashboard metrics remain accurate after selective refresh
  
- 2025-10-23: Complete implementation and deployment
  - All frontend components built with Material Design data dashboard aesthetic
  - All backend services and API endpoints implemented
  - PostgreSQL database schema created and operational
  - Export functionality (CSV/JSON) implemented
  - Loading states and error handling in place
  - Fixed React nested anchor tag warnings
  - Application running successfully on port 5000

## Next Steps for Users
1. ✅ Click "Refresh Data" button on Dashboard to fetch all CFR titles (Working!)
2. ✅ Use Titles page to selectively refresh specific CFR titles (Working!)
3. ✅ View real-time analytics in charts and metric cards (Working!)
4. ✅ Explore detailed analysis in the Analysis page (Working!)
5. ✅ Export data using CSV or JSON export buttons (Working!)
6. 🚀 Publish the application to make it publicly accessible

## Known Limitations

### Title 40 (Protection of Environment)
- **Size**: Title 40 exceeds 75 million characters in XML format
- **Status**: Automatically skipped to prevent memory crashes
- **Impact**: This title contains EPA environmental regulations and cannot be analyzed with current memory constraints
- **Workaround**: The app will gracefully skip Title 40 with a warning message and continue processing other titles
- **Total CFR Titles**: 48 out of 49 available (Title 40 excluded)

### Minor UI Issues
- Progress indicator may remain visible after selective refresh completes (workaround: refresh page)
