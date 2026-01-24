# Changelog

## Recent Updates

### UI & Design
- Updated color theme from dark green (#193d34) to near-black (#0C0A09)
- Improved ClassicSplitView with folder tab style and responsive design
- Refactored StepDisplay navigation controls
- Simplified ContextPanel styling and layout
- Improved recipe page spacing and typography
- Updated checkbox styling to filled style
- Improved checkbox checkmark positioning

### Features
- Added keyboard shortcuts (⌘1/2/3) for tab navigation with tooltips
- Added servings reset functionality - click servings value to reset
- Added search functionality to homepage bookmarked recipes
- Added recipe settings menu with copy link and copy plain text
- Updated cuisine pills to toggle behavior (removed "All" option)
- Changed recipe card delete to unsave with confirmation

### Loading & Animation
- Refactored loading animation with 3-step state display and progress bar
- Added cuisine detection and reveal in loading animation
- Added 1.5 second delay before navigation to show final step reveal

### Image Protection
- Added image protection to prevent dragging and right-click
- Added draggable="false" to images throughout the app
- Added html2canvas-pro package for image capture functionality

### Data & API
- Added time and servings data to API route responses
- Pass servings data through all recipe loading components
- Added prep/cook/total time extraction and support

### Ingredients & Steps
- Added step titles to ingredient expanded content
- Improved step title display (only show meaningful titles)
- Removed ingredient animation on check

### Navigation & Layout
- Increased navbar z-index to stay above other elements
- Cleaned up .cursorrules configuration
