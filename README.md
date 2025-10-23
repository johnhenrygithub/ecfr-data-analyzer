# eCFR Data Analyzer

A full-stack web application that downloads and analyzes U.S. Electronic Code of Federal Regulations (eCFR) data from the official API.

## Features

- **Data Collection**: Fetches eCFR data from the government API (https://www.ecfr.gov/developers/documentation/api/v1)
- **Database Storage**: Stores regulations in PostgreSQL with normalized structure
- **Advanced Analytics**:
  - Word count analysis per agency
  - Regulatory Complexity Index (RCI) - custom metric combining sentence length and vocabulary diversity
  - Data integrity checksums for change detection
- **Interactive Dashboard**: Visualizations with charts showing metrics across agencies
- **Analysis Views**: Tabbed interface for different analysis types
- **Export Functionality**: Export data as CSV or JSON

## API Endpoints

### Data Management
- `POST /api/fetch` - Trigger eCFR data fetch and storage
- `GET /api/metadata` - Get latest fetch metadata (timestamp, status, count)

### Queries
- `GET /api/agencies` - List all unique agencies
- `GET /api/agency/:name` - Get all regulations for a specific agency
- `GET /api/analysis/agencies` - Complete analysis for all agencies
- `GET /api/analysis/wordcount` - Word count metrics per agency
- `GET /api/analysis/checksums` - Data integrity checksums per agency

## Analysis Methods

### Regulatory Complexity Index (RCI)

The RCI is a custom metric that measures the complexity of regulatory text:

```
RCI = Average Sentence Length × Vocabulary Diversity
```

Where:
- **Average Sentence Length** = Total words / Total sentences
- **Vocabulary Diversity** = Unique words / Total words

Higher RCI indicates more complex regulatory language with longer sentences and diverse vocabulary.

### Word Count Analysis

Tracks total and average word counts per agency to identify which agencies have the most extensive regulations.

### Checksum Tracking

Uses SHA-256 hashing to generate checksums for each agency's combined text content, enabling detection of content changes over time.

## Technology Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Recharts for data visualization
- Shadcn UI components
- Tailwind CSS for styling

### Backend
- Node.js with Express
- PostgreSQL (Neon) for data persistence
- Drizzle ORM for database operations
- Native crypto for checksum generation

## Running the Application

1. The application runs automatically on Replit
2. Click "Refresh Data" to fetch eCFR data from the government API
3. View analytics on the Dashboard
4. Explore detailed analysis in the Analysis tab
5. Export data using CSV or JSON buttons

## Database Schema

### Regulations Table
```sql
- id: UUID primary key
- agency: Text (indexed for fast queries)
- title: Text
- chapter: Text
- section: Text  
- text_content: Text (regulation content)
- word_count: Integer
- checksum: Text (SHA-256 hash)
- created_at: Timestamp
```

### Fetch Metadata Table
```sql
- id: UUID primary key
- last_fetch_at: Timestamp
- status: Text (success, error, in_progress)
- total_regulations: Integer
- error_message: Text (nullable)
```

## Development

The application follows a schema-first development approach:
1. Data models defined in `shared/schema.ts`
2. Storage interface in `server/storage.ts`
3. API routes in `server/routes.ts`
4. eCFR service utilities in `server/ecfr-service.ts`
5. React components in `client/src/pages/` and `client/src/components/`

## Notes

- The eCFR API is public and requires no authentication
- Data fetching is performed in the background to avoid blocking
- For performance, the app fetches a sample of 5 titles by default
- Text content is limited to 50,000 characters per regulation to optimize storage
