# Zenith - Simple Task Planner

A minimalist desktop task management application built with Electron, designed for simplicity and efficiency.

## Overview

Zenith is a straightforward task planner that strips away complexity to focus on what matters - managing your daily tasks. Built with simplicity at its core, it provides a clean calendar interface for organizing tasks without the overhead of complicated project management features.

## Features

### Core Functionality
- **Calendar View**: Visual monthly calendar for task organization
- **Task Management**: Create, edit, delete, and complete tasks
- **Drag & Drop**: Intuitive task rescheduling by dragging between dates
- **Task Pool**: Unscheduled tasks storage for future planning
- **Priority System**: Three-level priority system (High, Medium, Low)
- **Color Categories**: Visual task categorization with color coding
- **Time Tracking**: Track hours spent on each task
- **Progress Analytics**: Comprehensive statistics and charts for productivity tracking

### User Interface
- **Clean Design**: Minimalist interface focused on usability
- **Dark Theme**: Easy on the eyes for extended use
- **Smart Calendar Colors**: 
  - Grey for future dates
  - Blue for today
  - Green for past dates with all tasks completed
  - Red for past dates with incomplete tasks
- **Real-time Updates**: Instant UI updates without page refreshes
- **Custom Modals**: Native-looking dialogs that avoid focus issues

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Express.js server
- **Database**: SQLite (lightweight, file-based)
- **Desktop Framework**: Electron
- **Charts**: Chart.js for analytics visualization

### Project Structure
```
simple_planner/
├── main.js           # Electron main process
├── app.js            # Frontend application logic
├── index.html        # Main application UI
├── styles.css        # Application styling
├── database.js       # SQLite database operations
├── server.js         # Express API server
├── analytics.html    # Analytics dashboard
├── analytics.js      # Analytics logic
└── package.json      # Dependencies and scripts
```

### Database Schema
Single `tasks` table with straightforward structure:
- `id`: Primary key
- `title`: Task name
- `description`: Task details
- `date`: Scheduled date (YYYY-MM-DD)
- `completed`: Completion status
- `time_hours`: Time spent
- `priority`: High/Medium/Low
- `category`: Color category
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### API Endpoints
Simple RESTful API:
- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats` - Get task statistics

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/simple_planner.git
cd simple_planner

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

### Adding Tasks
1. Click the "+" button in the Tasks Pool for unscheduled tasks
2. Click any date on the calendar to add a task for that specific day
3. Fill in task details including title, description, priority, and color

### Managing Tasks
- **Complete**: Click the checkbox next to any task
- **Edit**: Click on a task to modify its details
- **Delete**: Click the delete button with confirmation
- **Reschedule**: Drag tasks from the pool to calendar dates or between dates

### Viewing Analytics
Navigate to the Analytics page from the sidebar to view:
- Task completion rates
- Time tracking statistics
- Priority distribution
- Category breakdown
- Weekly/monthly trends

## Design Philosophy

Zenith was built with the principle that task management should be simple. We intentionally avoided:
- Complex project hierarchies
- Team collaboration features
- Unnecessary integrations
- Feature bloat

Instead, we focused on:
- **Speed**: Quick task entry and management
- **Clarity**: Clear visual representation of your schedule
- **Reliability**: Stable, bug-free operation
- **Simplicity**: Intuitive interface that doesn't require a manual

## Development

### Running in Development
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Database Management
The SQLite database file (`tasks.db`) is created automatically on first run. Back up this file to preserve your tasks.

## Technical Notes

### Windows-Specific Considerations
The application uses custom modal dialogs instead of native `alert()` and `confirm()` to avoid Electron input focus issues on Windows.

### Performance
- Lightweight SQLite database for fast operations
- Minimal dependencies for quick startup
- Efficient DOM manipulation for smooth UI updates

## Contributing

This project values simplicity. When contributing:
1. Maintain the minimalist approach
2. Avoid adding unnecessary dependencies
3. Keep the codebase readable and straightforward
4. Test thoroughly on Windows, macOS, and Linux

## License

MIT License - feel free to use and modify for your needs.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

*Built for those who believe task management should be simple, not complicated.*