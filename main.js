const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const Database = require('./database');

let mainWindow;
let server;
// Use userData directory for database in packaged app
const dbPath = app.isPackaged 
  ? path.join(app.getPath('userData'), 'planner.db')
  : path.join(__dirname, 'planner.db');
const db = new Database(dbPath);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1600,
    minHeight: 900,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false,
    backgroundColor: '#0A0A0B',
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function startServer() {
  const expressApp = express();
  
  expressApp.use(express.json());
  
  // Tasks API
  expressApp.get('/api/tasks', async (req, res) => {
    try {
      const tasks = await db.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  expressApp.post('/api/tasks', async (req, res) => {
    try {
      const task = await db.createTask(req.body);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  expressApp.put('/api/tasks/:id', async (req, res) => {
    try {
      const task = await db.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  expressApp.delete('/api/tasks/:id', async (req, res) => {
    try {
      await db.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reports API
  expressApp.get('/api/reports/:startDate/:endDate', async (req, res) => {
    try {
      const report = await db.generateReport(req.params.startDate, req.params.endDate);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  server = expressApp.listen(3001, () => {
    console.log('Server running on port 3001');
  });
}

app.whenReady().then(() => {
  startServer();
  // Give server time to start before opening window
  setTimeout(() => {
    createWindow();
  }, 600);
});

// IPC handler for DevTools toggle fix
ipcMain.on('toggle-devtools-fix', (event) => {
  if (mainWindow && mainWindow.webContents) {
    // Quick toggle of DevTools to restore focus
    const isOpen = mainWindow.webContents.isDevToolsOpened();
    if (!isOpen) {
      mainWindow.webContents.openDevTools();
      setTimeout(() => {
        mainWindow.webContents.closeDevTools();
      }, 1);
    }
  }
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window controls
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});