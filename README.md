# Zenith - Simple Task Planner

A minimalist desktop task management application built with Electron, designed for simplicity and efficiency.

![Zenith Task Planner](https://raw.githubusercontent.com/sardanioss/images/refs/heads/master/Screenshot%202025-09-02%20135715.png)

## Overview

Zenith is a straightforward task planner that strips away complexity to focus on what matters - managing your daily tasks. Built with simplicity at its core, it provides a clean calendar interface for organizing tasks without the overhead of complicated project management features.

## Screenshots

### Calendar View
![Calendar View](https://raw.githubusercontent.com/sardanioss/images/refs/heads/master/Screenshot%202025-09-02%20172245.png)
*Monthly calendar with color-coded tasks and visual progress indicators*

### All Tasks View
![All Tasks View](https://raw.githubusercontent.com/sardanioss/images/refs/heads/master/Screenshot%202025-09-02%20172141.png)
*Comprehensive task list grouped by dates with priority and time indicators*

## Features

### Core Functionality
- **Calendar View**: Visual monthly calendar for daily task organization
- **Task Management**: Create, edit, delete, and complete tasks with a single click
- **Drag & Drop**: Intuitive task rescheduling by dragging between dates
- **Task Pool**: Unscheduled tasks storage for future planning
- **Priority System**: Three-level priority system (High, Medium, Low)
- **Custom Color System**: Visual task organization with customizable colors
- **Time Estimation**: Optional task duration estimates (30 min to 8 hours)
- **Deadline Management**: Set time-based deadlines for tasks with visual alerts
- **Progress Analytics**: Comprehensive statistics and charts for productivity tracking
- **Mark All Complete**: One-click completion for all daily tasks

### User Interface
- **Clean Dark Theme**: Professional dark interface optimized for extended use
- **Smart Calendar Colors**: 
  - Grey gradient for future dates
  - Blue gradient for today
  - Green gradient for past dates with all tasks completed
  - Red gradient for past dates with incomplete tasks or expired deadlines
- **Custom Time Picker**: Elegant time selection interface matching the dark theme
- **Real-time Updates**: Instant UI updates without page refreshes
- **Custom Confirmation Dialogs**: Windows-optimized modals to prevent focus issues
- **Visual Task Indicators**: Color dots and priority badges for quick task identification
- **Responsive Day Panel**: Side panel with organized task view by color groups

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
- `description`: Task details (optional)
- `date`: Scheduled date (YYYY-MM-DD)
- `completed`: Completion status
- `time_hours`: Estimated duration (optional, default 0)
- `priority`: High/Medium/Low (default Medium)
- `category`: Color hex code for visual organization
- `deadline`: Task deadline time (optional)
- `position`: Task order within a day
- `created_at`: Creation timestamp
- `completed_at`: Completion timestamp

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
git clone https://github.com/sardanioss/zenith.git
cd simple_planner

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

### Adding Tasks

#### Quick Add to Date
![Add Task to Date](https://raw.githubusercontent.com/sardanioss/images/refs/heads/master/zenith_gif.gif)
*Click any calendar date to instantly add a task for that day*

1. Click the "+" button in the Tasks Pool for unscheduled tasks
2. Click any date on the calendar to add a task for that specific day
3. Fill in task details:
   - Title (required)
   - Estimated duration (optional)
   - Deadline time (optional - same day)
   - Description (optional)
   - Color category (6 color options)
   - Priority level (High/Medium/Low)

### Managing Tasks

#### Drag & Drop Scheduling
![Drag and Drop](https://github.com/sardanioss/images/blob/master/zenith_gif_2.gif?raw=true)
*Drag tasks from the pool to any calendar date for instant scheduling*

- **Complete**: Click the checkbox to mark done (turns green)
- **Mark All Complete**: Click button at bottom of day panel to complete all tasks at once
- **Edit**: Click on a task to modify its details
- **Delete**: Click the × button with custom confirmation dialog
- **Reschedule**: Drag tasks from the pool to calendar dates or between dates

### Time Management
- **Task Duration**: Set estimated time for planning purposes
- **Deadlines**: Set specific times for task completion
- **Visual Alerts**: Tasks with expired deadlines turn the calendar day red
- **Time Display**: Shows remaining time or deadline status on task cards

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

#### Windows Executable
```bash
npm run build
```
This creates a standalone `.exe` installer in the `dist` folder that can be distributed without requiring Node.js installation.

### Database Management
- **Development**: Database stored as `planner.db` in project directory
- **Production**: Database stored in user's AppData folder
- **Backup**: Copy the `.db` file to preserve your tasks

## Key Improvements in v2.0

### Enhanced UI/UX
- **Custom Time Picker**: Replaced native HTML time input with elegant dark-themed picker
- **Improved Dropdowns**: Custom-styled select elements with single arrow indicator
- **Better Visual Feedback**: Green checkboxes, gradient calendar tiles, color-coded priorities
- **Simplified Categories**: Removed text labels, using only color indicators for cleaner look

### Bug Fixes
- **Windows Focus Issue**: Resolved Electron input focus bug with custom confirmation dialogs
- **Database Path**: Fixed executable database path for packaged applications
- **UI State Updates**: Improved real-time updates for task completion and deletion
- **Drag & Drop**: Enhanced reliability of task dragging between dates

### Performance
- **Lightweight SQLite**: Fast database operations with minimal overhead
- **Optimized Rendering**: Efficient DOM updates for smooth interactions
- **Quick Startup**: Minimal dependencies and streamlined initialization
- **Native Module Support**: Properly rebuilt SQLite for Electron compatibility

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
