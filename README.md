# eCFR Data Analyzer

A full-stack web application that downloads, analyzes, and visualizes U.S. Electronic Code of Federal Regulations (eCFR) data from the official government API.

## Author

**Created by Dr. Mathias**

## Overview

eCFR Data Analyzer provides comprehensive analysis of federal regulations with custom metrics, interactive visualizations, and historical trend analysis. The application processes all 49 CFR titles from the official ecfr.gov API, handling over 2 million words of regulatory text.

## Key Features

### Data Analysis
- **Regulatory Complexity Index (RCI)** - Custom metric measuring regulatory text complexity (Average Sentence Length × Vocabulary Diversity)
- **Comprehensive Text Analysis** - Word counting, sentence parsing, and vocabulary diversity metrics
- **Data Integrity** - SHA-256 checksums for detecting content changes
- **100% CFR Coverage** - Successfully processes all 49 CFR titles, including Title 40 (156M characters, 16.8M words)

### Visualization & Reporting
- **Interactive Dashboard** - Real-time metrics with 4 data visualization charts
- **Analysis Tables** - Sortable data tables with CSV/JSON export functionality
- **Historical Trends** - View annual changes over the last 5 years
- **Material Design UI** - Professional data dashboard aesthetic with dark mode

### Data Management
- **Selective Refresh** - Choose specific CFR titles to update
- **PostgreSQL Database** - Persistent storage with Drizzle ORM
- **Progress Tracking** - Real-time progress indicators during data fetch operations
- **Efficient Processing** - True incremental processing with optimized memory usage

## Technology Stack

### Frontend
- **React** with TypeScript
- **Wouter** for routing
- **TanStack Query** (React Query) for data fetching
- **Recharts** for data visualization
- **shadcn/ui** components with Tailwind CSS
- **Radix UI** primitives

### Backend
- **Express.js** server
- **PostgreSQL** database (Neon-backed)
- **Drizzle ORM** for database operations
- **SAX Parser** for efficient XML processing
- **Crypto** for SHA-256 checksum generation

### APIs & Services
- **eCFR API** (ecfr.gov) - Official U.S. government regulations API
- **Replit Database** - PostgreSQL with automatic backups

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── pages/       # Dashboard, Analysis, Historical Trends, Titles
│   │   ├── components/  # Reusable UI components
│   │   └── lib/         # Query client and utilities
├── server/              # Backend Express application
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database storage interface
│   ├── ecfr-service.ts  # eCFR API integration & text analysis
│   └── db.ts            # Database connection
├── shared/              # Shared TypeScript types
│   └── schema.ts        # Database schema & types
└── package.json         # Dependencies
```

## Database Schema

### Regulations Table
- `id` - Auto-incrementing primary key
- `agency` - CFR title name
- `title` - Title number
- `chapter` - Chapter identifier
- `section` - Section identifier
- `text_content` - Full regulatory text
- `word_count` - Total words in regulation
- `checksum` - SHA-256 checksum for integrity
- `created_at` - Timestamp of data insertion

### Fetch Metadata Table
- `id` - Auto-incrementing primary key
- `last_fetch_at` - Timestamp of last fetch operation
- `status` - Current status (success, error, in_progress)
- `total_regulations` - Total number of regulations fetched
- `error_message` - Error details if fetch failed
- `progress_current` - Current progress counter
- `progress_total` - Total items to process
- `current_title` - Currently processing title

## API Endpoints

### Data Retrieval
- `GET /api/metadata` - Latest fetch metadata
- `GET /api/agencies` - List all agencies
- `GET /api/agency/:name` - Regulations for specific agency
- `GET /api/analysis/agencies` - Complete analysis with RCI
- `GET /api/analysis/wordcount` - Word count metrics
- `GET /api/analysis/checksums` - Data integrity checksums
- `GET /api/historical/title/:number` - Historical trend data (last 5 years)

### Data Management
- `POST /api/fetch` - Trigger eCFR data fetch
  - Optional body: `{ "titleNumbers": [1, 7, 40] }` for selective refresh

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database (or use Replit's built-in database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johnhenrygithub/ecfr-data-analyzer.git
   cd ecfr-data-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. **Initialize the database**
   The database schema will be automatically created on first run.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser to `http://localhost:5000`

### First-Time Setup

1. Navigate to the **Dashboard** page
2. Click **"Refresh Data"** to fetch all 49 CFR titles (takes 5-10 minutes)
3. Alternatively, use the **Titles** page to selectively refresh specific titles

## Usage Guide

### Dashboard
- View real-time metrics: Total Agencies, Total Regulations, Total Words, Average RCI
- Interactive charts: Word Count by Agency, Regulatory Complexity Index, Distribution, Vocabulary Diversity
- Click **"Refresh Data"** to update all CFR titles

### Analysis
- Browse detailed analysis tables with sortable columns
- Switch between tabs: Overview, Word Count, Complexity, Checksums
- Export data in CSV or JSON format

### Historical Trends
- Select a CFR title from the dropdown
- Click **"Load Trends"** to fetch annual snapshots (last 5 years)
- View charts: Word Count Evolution, RCI Trends, Sentence Count, Annual Growth Rate
- Note: Processing time varies (5-15 seconds for small titles, 1-2 minutes for Title 40)

### Titles
- View all 49 CFR titles with loaded status badges
- Select specific titles using checkboxes
- Click **"Refresh Selected"** to update only chosen titles
- Progress indicator shows real-time fetch status

## Key Algorithms

### Regulatory Complexity Index (RCI)
```
RCI = Average Sentence Length × Vocabulary Diversity

Where:
- Average Sentence Length = Total Words / Total Sentences
- Vocabulary Diversity = Unique Words / Total Words
```

Higher RCI values indicate more complex regulatory language.

### Incremental Text Processing
- Processes XML in 50KB chunks during SAX parsing
- Incremental SHA-256 checksum calculation (never builds full text in memory)
- Periodic garbage collection every 100K words
- Successfully processes Title 40 (156M chars) in ~17 seconds with 2GB RAM

## Known Limitations

### Historical Trends API
- **Status**: Feature implemented, but may experience issues
- **Issue**: eCFR API's historical/point-in-time data access is unreliable (Gateway timeouts)
- **Mitigation**: Circuit breaker stops after 3 consecutive failures, toast notifications inform users
- **Current Data**: Latest/current eCFR data fetches perfectly (all 49 titles work)

## Performance

- **Title 40 Processing**: 156M chars XML → 16.8M words → 1.16M sentences in ~17 seconds
- **Memory Usage**: Works within 2GB RAM limit (development tested)
- **Total Coverage**: All 49 CFR titles successfully analyzed (100%)
- **Database Storage**: PostgreSQL with optimized queries and indexes

## Deployment

This application is designed to run on Replit and can be published with one click:

1. Ensure all data is loaded and tested
2. Click **"Publish"** in Replit
3. Your app will be live at `https://your-repl-name.replit.app`

For other platforms, standard Node.js deployment applies (Heroku, Vercel, AWS, etc.).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **eCFR.gov** - Official U.S. government API for federal regulations
- **Replit** - Development and hosting platform
- **shadcn/ui** - Beautiful component library
- **Neon** - PostgreSQL database hosting

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Created by Dr. Mathias**
