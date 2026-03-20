# Next Steps — v4 Roadmap

Practical next upgrades for the Case Study Generator, roughly prioritized.

## High Priority

### Save Favorites (Local Storage)
- Save generated cases to browser localStorage
- "Star" / favorite individual cases from any batch
- Browse and reload saved cases from a simple library view
- Export/import saved cases as JSON for backup

### Case Library with Search
- Full-text search across saved cases by title, diagnosis, topic, or concept
- Filter by discipline, difficulty, date generated
- Tag cases with custom labels (e.g., "used in class", "needs revision")

### Firebase Persistence
- Migrate from localStorage to Firebase/Firestore for durable storage
- User authentication (Google sign-in)
- Sync cases across devices
- Enable sharing case libraries between teachers

## Medium Priority

### Teacher Templates / Presets
- Save form configurations as reusable templates
- "AP Biology — Genetics" preset auto-fills discipline, grade, topics, tunnel
- Share templates via URL or export

### Course-Specific Prompt Presets
- Pre-built topic banks for each discipline
- "Quick start" — pick a topic from a curated list and generate immediately
- Align topics to common standards (NGSS, AP frameworks)

### Google Docs Export
- One-click export to Google Docs format
- Preserve formatting, headings, and structure
- Separate teacher and student versions

### Student Response Collection
- Students submit their differential diagnoses through the shared link
- Teacher dashboard shows aggregated student responses
- No grading — just visibility into student thinking

## Lower Priority

### Spark Learning Integration
- Export cases directly to Spark Learning Inquiry Studio
- Map case stages to Spark's inquiry phases
- Deep link from generated case to Spark activity

### Case Remix / Variation Engine
- "Remix this case" — keep the structure, change the scenario
- Generate seasonal/thematic variants (flu season, sports injury wave)
- Create case series that build on each other across a unit

### Classroom Timer
- Built-in timer for timed reveal phases
- Auto-advance reveal stages after set intervals
- Pause/resume controls

### Multi-Language Support
- Generate cases in Spanish or other languages
- Dual-language output for bilingual classrooms

### Analytics Dashboard
- Track which cases are used most
- See sharing stats (how many times a QR code was scanned)
- Usage patterns to inform prompt improvements
