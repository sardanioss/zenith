const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath = null) {
    // If no path provided, use default
    if (!dbPath) {
      dbPath = path.join(__dirname, 'planner.db');
    }
    console.log('Database path:', dbPath);
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Tasks table - simplified without events
      this.db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT,
          completed BOOLEAN DEFAULT FALSE,
          time_hours REAL DEFAULT 0,
          priority TEXT DEFAULT 'medium',
          category TEXT DEFAULT 'blue',
          position INTEGER DEFAULT 0,
          deadline DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME
        )
      `);
      
      // Add deadline column to existing tables
      this.db.run(`ALTER TABLE tasks ADD COLUMN deadline DATETIME`, (err) => {
        // Ignore error if column already exists
      });
      
      // Drop old events table if it exists
      this.db.run(`DROP TABLE IF EXISTS events`);
    });
  }

  // Task methods

  getAllTasks() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM tasks ORDER BY date, position, created_at',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  createTask(taskData) {
    return new Promise((resolve, reject) => {
      const { date, title, description, time_hours, priority, category, deadline } = taskData;
      this.db.run(
        'INSERT INTO tasks (date, title, description, time_hours, priority, category, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [date || null, title, description || '', time_hours || 0, priority || 'medium', category || 'blue', deadline || null],
        function(err) {
          if (err) reject(err);
          else {
            resolve({ 
              id: this.lastID, 
              ...taskData,
              completed: false
            });
          }
        }
      );
    });
  }

  updateTask(id, taskData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      if (taskData.title !== undefined) {
        fields.push('title = ?');
        values.push(taskData.title);
      }
      if (taskData.description !== undefined) {
        fields.push('description = ?');
        values.push(taskData.description);
      }
      if (taskData.completed !== undefined) {
        fields.push('completed = ?');
        values.push(taskData.completed ? 1 : 0);
        if (taskData.completed) {
          fields.push('completed_at = CURRENT_TIMESTAMP');
        }
      }
      if (taskData.time_hours !== undefined) {
        fields.push('time_hours = ?');
        values.push(taskData.time_hours);
      }
      if (taskData.priority !== undefined) {
        fields.push('priority = ?');
        values.push(taskData.priority);
      }
      if (taskData.category !== undefined) {
        fields.push('category = ?');
        values.push(taskData.category);
      }
      if (taskData.position !== undefined) {
        fields.push('position = ?');
        values.push(taskData.position);
      }
      if (taskData.date !== undefined) {
        fields.push('date = ?');
        values.push(taskData.date);
      }
      if (taskData.deadline !== undefined) {
        fields.push('deadline = ?');
        values.push(taskData.deadline);
      }
      
      values.push(id);
      
      this.db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...taskData });
        }
      );
    });
  }

  deleteTask(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Reports
  generateReport(startDate, endDate) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          date,
          title,
          description,
          category,
          completed,
          time_hours,
          priority,
          completed_at
        FROM tasks
        WHERE date BETWEEN ? AND ?
        ORDER BY date, position, created_at
      `, [startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else {
          const report = this.processReportData(rows);
          resolve(report);
        }
      });
    });
  }

  processReportData(rows) {
    const stats = {
      totalTasks: 0,
      completedTasks: 0,
      totalHours: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      byCategory: { blue: 0, purple: 0, green: 0, orange: 0 },
      byDate: {}
    };

    const tasksByDate = {};

    rows.forEach(row => {
      stats.totalTasks++;
      if (row.completed) stats.completedTasks++;
      stats.totalHours += row.time_hours || 0;
      stats.byPriority[row.priority || 'medium']++;
      stats.byCategory[row.category || 'blue']++;

      const date = row.date || 'unscheduled';
      if (!tasksByDate[date]) {
        tasksByDate[date] = {
          date: date,
          tasks: [],
          totalHours: 0,
          completedCount: 0
        };
      }

      tasksByDate[date].tasks.push({
        title: row.title,
        description: row.description,
        completed: row.completed,
        time_hours: row.time_hours,
        priority: row.priority,
        category: row.category
      });
      
      tasksByDate[date].totalHours += row.time_hours || 0;
      if (row.completed) tasksByDate[date].completedCount++;
    });

    return {
      stats: {
        ...stats,
        completionRate: stats.totalTasks > 0 
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
          : 0
      },
      tasksByDate: Object.values(tasksByDate)
    };
  }
}

module.exports = Database;