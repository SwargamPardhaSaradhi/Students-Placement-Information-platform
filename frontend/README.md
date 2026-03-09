# Placement Portal Dashboard

A comprehensive placement management dashboard built with React, TypeScript, Firebase Firestore, and Tailwind CSS. This application allows placement officers to track, manage, and visualize placement activities across companies, students, and multiple rounds.

## Features

### Dashboard
- Year-wise placement statistics overview
- Real-time metrics for companies, placements, and student participation
- Company-wise placement breakdown
- Interactive year selection

### Companies
- Complete list of all placement drives
- Filter by status (Running/Completed) and year
- Search functionality
- Detailed company cards with placement statistics
- Success rate calculations

### Company Details
- Individual company overview with key metrics
- Round-by-round tracking with dynamic columns
- Display of round data with student status (Qualified/Not Qualified/Pending)
- Final placements view
- Support for custom columns based on Excel data structure

### Students
- Comprehensive student listing with search and filters
- Student placement status tracking
- Individual student details with company-wise progress
- Round progress for each company
- Multiple offer tracking

### Analytics
- Year-wise placement trends (Line charts)
- Student placement status distribution (Pie charts)
- Company status distribution
- Offers distribution analysis
- Top 10 companies by placements (Bar charts)
- Detailed year-wise statistics table
- Interactive and responsive charts using Recharts

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Routing**: React Router DOM
- **Database**: Firebase Firestore
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/
│   └── Layout.tsx              # Main layout with navigation
├── pages/
│   ├── Dashboard.tsx           # Dashboard with year-wise analytics
│   ├── Companies.tsx           # Companies listing page
│   ├── CompanyDetails.tsx      # Individual company details
│   ├── Students.tsx            # Students listing and tracking
│   └── Analytics.tsx           # Comprehensive analytics page
├── lib/
│   └── firebase.ts             # Firebase configuration
├── types/
│   └── index.ts                # TypeScript type definitions
├── App.tsx                     # Main app component with routing
├── main.tsx                    # Application entry point
└── index.css                   # Global styles and animations

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Firebase project with Firestore enabled
- npm or yarn package manager

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your Firebase configuration to the `.env` file:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Firebase Firestore Structure

The application expects the following Firestore structure:

### Collections

#### `companies`
- Document ID: `companyYearId` (e.g., "Google2024")
- Fields: companyName, year, status, currentRound, finalRound, totalRounds, totalPlaced, totalApplied, timestamps
- Subcollections:
  - `rounds/`: Contains round data with dynamic columns
    - `data/`: Row-level data for each round
  - `placements/`: Final placement records

#### `students`
- Document ID: `studentId`
- Fields: name, rollNumber, email, companyStatus, selectedCompanies, currentStatus, totalOffers, updatedAt

#### `years`
- Document ID: year (e.g., "2024")
- Fields: totalCompanies, completedCompanies, runningCompanies, totalPlaced, totalStudentsParticipated, companyWise

## Features Highlights

### Dynamic Column Support
The application supports dynamic Excel-like columns in rounds, allowing you to:
- Upload data with any column structure
- Display all columns in an organized table format
- Track student progress through each round

### Dark Mode Theme
- Beautiful dark theme optimized for extended viewing
- Smooth animations and transitions
- Glassmorphism effects with backdrop blur
- Custom scrollbar styling

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly navigation

### Interactive Visualizations
- Multiple chart types for different data perspectives
- Color-coded status indicators
- Hover effects and tooltips
- Responsive chart containers

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is created for educational and institutional use.
