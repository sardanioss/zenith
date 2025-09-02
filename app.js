const { ipcRenderer } = require('electron');

class PlannerApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.tasks = [];
        this.currentTaskId = null;
        this.currentView = 'calendar';
        this.initialized = false;
        this.editingTaskId = null;
        
        this.init();
    }

    // Custom confirmation dialog to replace confirm()
    showConfirmation(title, message, onConfirm, confirmText = 'Delete') {
        const modal = document.getElementById('confirmation-modal');
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirmation-confirm');
        const cancelBtn = document.getElementById('confirmation-cancel');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        
        modal.classList.add('open');
        
        // Remove old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new listeners
        newConfirmBtn.onclick = () => {
            modal.classList.remove('open');
            if (onConfirm) onConfirm();
        };
        
        newCancelBtn.onclick = () => {
            modal.classList.remove('open');
        };
    }

    async init() {
        if (this.initialized) return;
        
        try {
            console.log('Starting app initialization...');
            
            // Update loading text
            this.updateLoadingText('Setting up workspace...');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Set up event listeners
            this.setupEventListeners();
            this.updateTodayDate();
            
            // Update loading text
            this.updateLoadingText('Loading your tasks...');
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Load data
            console.log('Loading data...');
            await this.loadTasks();
            
            // Update stats immediately after loading
            this.updateDayStats();
            
            // Update loading text
            this.updateLoadingText('Almost ready...');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Setup calendar
            console.log('Setting up calendar...');
            this.setupCalendar();
            
            this.initialized = true;
            console.log('App initialization complete');
            
            // Small delay before showing app
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.updateLoadingText('Error loading workspace. Please restart the app.');
        }
    }

    updateLoadingText(text) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    hideLoadingScreen() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }

    setupCustomTimePicker() {
        const display = document.getElementById('standalone-deadline-display');
        const selectors = document.getElementById('standalone-time-selectors');
        const hourSelect = document.getElementById('standalone-deadline-hour');
        const minuteSelect = document.getElementById('standalone-deadline-minute');
        const periodBtns = document.querySelectorAll('.period-btn');
        const clearBtn = document.getElementById('standalone-clear-time');
        const hiddenInput = document.getElementById('standalone-task-deadline');
        
        // Toggle selectors on display click
        display.addEventListener('click', () => {
            const isOpen = selectors.style.display !== 'none';
            selectors.style.display = isOpen ? 'none' : 'flex';
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-time-picker')) {
                selectors.style.display = 'none';
            }
        });
        
        // Handle period buttons
        periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                periodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateTimeDisplay();
            });
        });
        
        // Handle select changes
        [hourSelect, minuteSelect].forEach(select => {
            select.addEventListener('change', () => this.updateTimeDisplay());
        });
        
        // Clear button
        clearBtn.addEventListener('click', () => {
            hourSelect.value = '';
            minuteSelect.value = '';
            periodBtns.forEach(b => b.classList.remove('active'));
            display.querySelector('.time-value').textContent = '--:--';
            display.querySelector('.time-period').textContent = '--';
            hiddenInput.value = '';
            selectors.style.display = 'none';
        });
    }
    
    updateTimeDisplay() {
        const hourSelect = document.getElementById('standalone-deadline-hour');
        const minuteSelect = document.getElementById('standalone-deadline-minute');
        const activePeriod = document.querySelector('.period-btn.active');
        const display = document.getElementById('standalone-deadline-display');
        const hiddenInput = document.getElementById('standalone-task-deadline');
        
        if (hourSelect.value && minuteSelect.value && activePeriod) {
            const hour = hourSelect.value;
            const minute = minuteSelect.value;
            const period = activePeriod.dataset.period;
            
            display.querySelector('.time-value').textContent = `${hour}:${minute}`;
            display.querySelector('.time-period').textContent = period;
            
            // Convert to 24-hour format for hidden input
            let hour24 = parseInt(hour);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            
            hiddenInput.value = `${hour24.toString().padStart(2, '0')}:${minute}`;
        }
    }
    
    setupEventListeners() {
        this.setupCustomTimePicker();
        // Window controls
        document.querySelector('.minimize').onclick = () => ipcRenderer.send('window-minimize');
        document.querySelector('.maximize').onclick = () => ipcRenderer.send('window-maximize');
        document.querySelector('.close').onclick = () => ipcRenderer.send('window-close');

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = () => this.switchView(item.dataset.view);
        });

        // Task Pool Add Button
        document.getElementById('add-standalone-task').onclick = () => this.openTaskModal();

        // Calendar navigation
        document.getElementById('prev-month').onclick = () => this.changeMonth(-1);
        document.getElementById('next-month').onclick = () => this.changeMonth(1);

        // Sidebar Add buttons
        document.getElementById('quick-add-task').onclick = () => {
            if (this.selectedDate) {
                this.openTaskModal(this.formatDate(this.selectedDate));
            }
        };

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.remove('open');
            }
        });

        // Task modal save
        document.getElementById('save-standalone-task').onclick = () => this.saveTask();
        document.getElementById('cancel-standalone-task').onclick = () => {
            document.getElementById('standalone-task-modal').classList.remove('open');
        };

        // Day panel close
        document.getElementById('close-panel').onclick = () => this.closeDayPanel();

        // Complete all button
        document.getElementById('complete-all').onclick = () => this.completeAllTasks();

        // Priority selectors
        document.querySelectorAll('.priority-selector').forEach(selector => {
            selector.querySelectorAll('.priority-option').forEach(btn => {
                btn.onclick = () => {
                    selector.querySelectorAll('.priority-option').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });
        });
        
        // Color picker
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.querySelectorAll('.color-option').forEach(btn => {
                btn.onclick = () => {
                    picker.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });
        });

        // Analytics
        document.getElementById('generate-report').onclick = () => this.generateReport();

        // Filter chips
        document.querySelectorAll('.filter-chips .chip').forEach(chip => {
            chip.onclick = () => {
                document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.filterTasks(chip.dataset.filter);
            };
        });

        // Sidebar toggle
        document.getElementById('sidebar-toggle').onclick = () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        };
    }

    openTaskModal(date = null, task = null) {
        const modal = document.getElementById('standalone-task-modal');
        const titleEl = modal.querySelector('h2');
        
        // Reset form
        document.getElementById('standalone-task-title').value = task ? task.title : '';
        document.getElementById('standalone-task-description').value = task ? task.description : '';
        document.getElementById('standalone-task-time').value = task ? task.time_hours : '1';
        
        // Set color
        const color = task ? task.category : '#5B8DEE';
        document.querySelectorAll('#standalone-task-modal .color-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        
        // Set priority
        const priority = task ? task.priority : 'medium';
        document.querySelectorAll('#standalone-task-modal .priority-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === priority);
        });
        
        // Update title and save mode
        if (task) {
            titleEl.textContent = 'Edit Task';
            this.editingTaskId = task.id;
        } else {
            titleEl.textContent = 'Add Task';
            this.editingTaskId = null;
        }
        
        // Store the date for new tasks
        this.currentTaskDate = date;
        
        modal.classList.add('open');
        document.getElementById('standalone-task-title').focus();
    }

    async saveTask() {
        const title = document.getElementById('standalone-task-title').value.trim();
        const description = document.getElementById('standalone-task-description').value.trim();
        const time = parseFloat(document.getElementById('standalone-task-time').value);
        const category = document.querySelector('#standalone-task-modal .color-option.active').dataset.color;
        const priority = document.querySelector('#standalone-task-modal .priority-option.active').dataset.priority;
        const deadlineTime = document.getElementById('standalone-task-deadline').value;
        
        if (!title) return;
        
        // If deadline time is provided, combine with task date
        let deadline = null;
        if (deadlineTime && this.currentTaskDate) {
            const [hours, minutes] = deadlineTime.split(':');
            const deadlineDate = new Date(this.currentTaskDate + 'T00:00:00');
            deadlineDate.setHours(parseInt(hours), parseInt(minutes));
            deadline = deadlineDate.toISOString();
        }
        
        const taskData = {
            title,
            description,
            time_hours: time,
            category,
            priority,
            date: this.currentTaskDate,
            deadline: deadline
        };
        
        try {
            if (this.editingTaskId) {
                // Update existing task
                const response = await fetch(`http://localhost:3001/api/tasks/${this.editingTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                
                if (response.ok) {
                    await this.loadTasks();
                    this.renderCalendar();
                    if (this.selectedDate) {
                        this.loadDayTasks(this.selectedDate);
                    }
                    if (this.currentView === 'tasks') {
                        this.loadAllTasksView();
                    }
                    this.updateDayStats();
                }
            } else {
                // Create new task
                const response = await fetch('http://localhost:3001/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                
                if (response.ok) {
                    await this.loadTasks();
                    this.renderCalendar();
                    this.loadTaskPool();
                    if (this.selectedDate) {
                        this.loadDayTasks(this.selectedDate);
                    }
                    if (this.currentView === 'tasks') {
                        this.loadAllTasksView();
                    }
                    this.updateDayStats();
                }
            }
            
            document.getElementById('standalone-task-modal').classList.remove('open');
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }

    async loadTasks() {
        try {
            const response = await fetch('http://localhost:3001/api/tasks');
            this.tasks = await response.json();
            
            // Load task pool (unscheduled tasks)
            this.loadTaskPool();
            
            // Update stats
            this.updateDayStats();
            
            // Load all tasks view if active
            if (this.currentView === 'tasks') {
                this.loadAllTasksView();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    loadTaskPool() {
        const pool = document.getElementById('task-pool');
        pool.innerHTML = '';
        
        const unscheduledTasks = this.tasks.filter(t => !t.date && !t.completed);
        
        unscheduledTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'pool-task';
            taskEl.draggable = true;
            taskEl.dataset.taskId = task.id;
            
            // Category color bar
            const colorBar = document.createElement('div');
            colorBar.className = 'task-color-bar';
            colorBar.style.background = this.getCategoryColor(task.category);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'task-title';
            titleDiv.textContent = task.title;
            
            // Click to edit
            titleDiv.onclick = () => this.openTaskModal(null, task);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            };
            
            taskEl.appendChild(colorBar);
            taskEl.appendChild(titleDiv);
            taskEl.appendChild(deleteBtn);
            
            // Drag handlers
            taskEl.ondragstart = (e) => {
                e.dataTransfer.setData('taskId', task.id);
                e.dataTransfer.effectAllowed = 'move';
                taskEl.classList.add('dragging');
            };
            
            taskEl.ondragend = () => {
                taskEl.classList.remove('dragging');
            };
            
            pool.appendChild(taskEl);
        });
    }

    getCategoryColor(category) {
        // If it's already a hex color, return it
        if (category && category.startsWith('#')) {
            return category;
        }
        // Legacy support for old category names
        const colors = {
            blue: '#5B8DEE',
            purple: '#9B84EE',
            green: '#52D0A4',
            orange: '#FFB454'
        };
        return colors[category] || '#5B8DEE';
    }

    setupCalendar() {
        this.renderCalendar();
        this.updateMonthDisplay();
        
        // Setup drag and drop after calendar renders
        setTimeout(() => this.setupCalendarDragDrop(), 100);
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        calendar.innerHTML = `
            <div class="weekdays">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                    `<div class="weekday">${day}</div>`
                ).join('')}
            </div>
            <div class="days-grid" id="days-grid"></div>
        `;
        
        const daysGrid = document.getElementById('days-grid');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Show 5 weeks (35 days) instead of 6 weeks
        for (let i = 0; i < 35; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.dataset.date = this.formatDate(date);
            
            if (date.getMonth() !== month) {
                dayEl.classList.add('other-month');
            }
            
            if (date.getTime() === today.getTime()) {
                dayEl.classList.add('today');
            }
            
            // Tasks for this day
            const dayTasks = this.tasks.filter(t => t.date === this.formatDate(date));
            
            // Check for expired deadlines first
            const hasExpiredDeadline = dayTasks.some(task => {
                if (task.deadline && !task.completed) {
                    const deadline = new Date(task.deadline);
                    return deadline < new Date();
                }
                return false;
            });
            
            // Color based on time and task completion
            if (dayTasks.length > 0 || hasExpiredDeadline) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const dateCompare = new Date(date);
                dateCompare.setHours(0, 0, 0, 0);
                
                // If any task has expired deadline, make the day red
                if (hasExpiredDeadline) {
                    dayEl.classList.add('has-incomplete');
                } else if (dateCompare > now) {
                    // Future date - grey
                    dayEl.classList.add('future-date');
                } else if (dateCompare.getTime() === now.getTime()) {
                    // Today - blue
                    dayEl.classList.add('today-date');
                } else {
                    // Past date - check completion
                    const allCompleted = dayTasks.every(t => t.completed);
                    const hasIncomplete = dayTasks.some(t => !t.completed);
                    
                    if (allCompleted) {
                        dayEl.classList.add('all-completed');
                    } else if (hasIncomplete) {
                        dayEl.classList.add('has-incomplete');
                    }
                }
            }
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            dayEl.appendChild(dayNumber);
            
            // Display tasks preview
            if (dayTasks.length > 0) {
                const tasksContainer = document.createElement('div');
                tasksContainer.className = 'day-tasks-preview';
                
                // Show first 5 tasks with truncated titles
                dayTasks.slice(0, 5).forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-preview-item';
                    if (task.completed) taskItem.classList.add('completed');
                    
                    const taskDot = document.createElement('span');
                    taskDot.className = 'task-dot';
                    taskDot.style.background = this.getCategoryColor(task.category);
                    
                    const taskTitle = document.createElement('span');
                    taskTitle.className = 'task-preview-title';
                    taskTitle.textContent = task.title.substring(0, 10) + (task.title.length > 10 ? '...' : '');
                    taskTitle.title = task.title;
                    
                    taskItem.appendChild(taskDot);
                    taskItem.appendChild(taskTitle);
                    tasksContainer.appendChild(taskItem);
                });
                
                if (dayTasks.length > 5) {
                    const more = document.createElement('div');
                    more.className = 'more-tasks';
                    more.textContent = `+${dayTasks.length - 5} more`;
                    tasksContainer.appendChild(more);
                }
                
                dayEl.appendChild(tasksContainer);
            }
            
            // Click handler
            dayEl.onclick = () => this.selectDate(date);
            
            // Drag over handler for tasks
            dayEl.ondragover = (e) => {
                e.preventDefault();
                dayEl.classList.add('drag-over');
            };
            
            dayEl.ondragleave = () => {
                dayEl.classList.remove('drag-over');
            };
            
            dayEl.ondrop = (e) => {
                e.preventDefault();
                dayEl.classList.remove('drag-over');
                const taskId = parseInt(e.dataTransfer.getData('taskId'));
                this.assignTaskToDate(taskId, date);
            };
            
            daysGrid.appendChild(dayEl);
        }
    }

    setupCalendarDragDrop() {
        // Already handled in renderCalendar
    }

    async assignTaskToDate(taskId, date) {
        const dateStr = this.formatDate(date);
        
        try {
            const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr })
            });
            
            if (response.ok) {
                // Update local data
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.date = dateStr;
                }
                
                // Refresh views
                this.loadTaskPool();
                this.renderCalendar();
                
                if (this.selectedDate && this.formatDate(this.selectedDate) === dateStr) {
                    this.loadDayTasks(this.selectedDate);
                }
                
                this.updateDayStats();
            }
        } catch (error) {
            console.error('Error assigning task to date:', error);
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        
        // Update selected state
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.toggle('selected', day.dataset.date === this.formatDate(date));
        });
        
        // Open day panel
        this.openDayPanel(date);
    }

    openDayPanel(date) {
        const panel = document.getElementById('day-panel');
        const content = document.querySelector('.content');
        
        // Update header
        document.getElementById('selected-date').textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Load tasks for this day
        this.loadDayTasks(date);
        
        // Show panel and shrink content
        panel.classList.add('open');
        content.classList.add('panel-active');
    }

    closeDayPanel() {
        document.getElementById('day-panel').classList.remove('open');
        document.querySelector('.content').classList.remove('panel-active');
    }

    loadDayTasks(date) {
        const dateStr = this.formatDate(date);
        const dayTasks = this.tasks.filter(t => t.date === dateStr);
        
        const container = document.getElementById('day-tasks');
        container.innerHTML = '';
        
        // Group by category/color
        const categories = {};
        
        dayTasks.forEach(task => {
            const categoryKey = task.category || '#5B8DEE';
            if (!categories[categoryKey]) {
                categories[categoryKey] = { tasks: [] };
            }
            categories[categoryKey].tasks.push(task);
        });
        
        Object.entries(categories).forEach(([key, category]) => {
            if (category.tasks.length === 0) return;
            
            const section = document.createElement('div');
            section.className = 'task-category-section';
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <span class="category-dot" style="background: ${this.getCategoryColor(key)}"></span>
                <span class="category-count">${category.tasks.length}</span>
            `;
            section.appendChild(header);
            
            category.tasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = 'task-card';
                if (task.completed) taskEl.classList.add('completed');
                taskEl.dataset.taskId = task.id;
                
                const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit'
                }) : '';
                const isExpired = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
                
                taskEl.innerHTML = `
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
                        ${task.completed ? '✓' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        ${task.deadline ? `<div class="task-deadline ${isExpired ? 'expired' : ''}">⏰ ${deadlineStr}</div>` : ''}
                        <div class="task-meta">
                            ${task.time_hours > 0 ? `<span class="task-time">${task.time_hours}h</span>` : ''}
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-delete" data-task-id="${task.id}">×</button>
                    </div>
                `;
                
                // Event handlers
                taskEl.querySelector('.task-checkbox').onclick = (e) => {
                    e.stopPropagation();
                    this.toggleTask(task.id);
                };
                taskEl.querySelector('.task-content').onclick = () => this.openTaskModal(dateStr, task);
                taskEl.querySelector('.task-delete').onclick = (e) => {
                    e.stopPropagation();
                    this.deleteTask(task.id);
                };
                
                section.appendChild(taskEl);
            });
            
            container.appendChild(section);
        });
        
        if (dayTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks for this day</div>';
        }
    }

    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        try {
            const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !task.completed })
            });
            
            if (response.ok) {
                task.completed = !task.completed;
                
                // Update UI - find all elements with this task ID
                const checkboxes = document.querySelectorAll(`.task-checkbox[data-task-id="${taskId}"]`);
                checkboxes.forEach(checkbox => {
                    checkbox.classList.toggle('checked');
                    checkbox.textContent = task.completed ? '✓' : '';
                    // Also update parent task card if it exists
                    const parentCard = checkbox.closest('.task-card');
                    if (parentCard) {
                        parentCard.classList.toggle('completed');
                    }
                })
                
                this.updateDayStats();
                this.renderCalendar();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }

    deleteTask(taskId) {
        this.showConfirmation(
            'Delete Task',
            'Are you sure you want to delete this task?',
            async () => {
                try {
                    const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        // Remove from local array
                        this.tasks = this.tasks.filter(t => t.id !== taskId);
                        
                        // Refresh views
                        this.loadTaskPool();
                        this.renderCalendar();
                        
                        if (this.selectedDate) {
                            this.loadDayTasks(this.selectedDate);
                        }
                        
                        if (this.currentView === 'tasks') {
                            this.loadAllTasksView();
                        }
                        
                        this.updateDayStats();
                    }
                } catch (error) {
                    console.error('Error deleting task:', error);
                }
            }
        );
    }

    async completeAllTasks() {
        if (!this.selectedDate) return;
        
        const dateStr = this.formatDate(this.selectedDate);
        const dayTasks = this.tasks.filter(t => t.date === dateStr && !t.completed);
        
        for (const task of dayTasks) {
            await this.toggleTask(task.id);
        }
        
        // Reload the day panel to ensure UI is fully updated
        this.loadDayTasks(this.selectedDate);
        
        // Update stats after completing all
        this.updateDayStats();
    }

    loadAllTasksView() {
        const container = document.getElementById('all-tasks');
        const filter = document.querySelector('.filter-chips .chip.active').dataset.filter;
        
        let filteredTasks = [...this.tasks];
        
        if (filter === 'open') {
            filteredTasks = filteredTasks.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filteredTasks = filteredTasks.filter(t => t.completed);
        }
        
        // Group by date
        const tasksByDate = {};
        filteredTasks.forEach(task => {
            const date = task.date || 'unscheduled';
            if (!tasksByDate[date]) {
                tasksByDate[date] = [];
            }
            tasksByDate[date].push(task);
        });
        
        container.innerHTML = '';
        
        // Sort dates
        const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
            if (a === 'unscheduled') return -1;
            if (b === 'unscheduled') return 1;
            return new Date(a) - new Date(b);
        });
        
        sortedDates.forEach(date => {
            const section = document.createElement('div');
            section.className = 'date-section';
            
            const header = document.createElement('div');
            header.className = 'date-header';
            
            if (date === 'unscheduled') {
                header.textContent = 'Unscheduled Tasks';
            } else {
                const dateObj = new Date(date);
                header.textContent = dateObj.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            section.appendChild(header);
            
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'date-tasks';
            
            tasksByDate[date].forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = 'task-list-item';
                if (task.completed) taskEl.classList.add('completed');
                
                taskEl.innerHTML = `
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
                        ${task.completed ? '✓' : ''}
                    </div>
                    <div class="task-content" data-task-id="${task.id}">
                        <div class="task-header">
                            <span class="task-title">${task.title}</span>
                        </div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            <span class="task-time">⏱ ${task.time_hours}h</span>
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-delete" data-task-id="${task.id}">×</button>
                    </div>
                `;
                
                // Event handlers
                taskEl.querySelector('.task-checkbox').onclick = () => this.toggleTask(task.id);
                taskEl.querySelector('.task-content').onclick = () => this.openTaskModal(task.date, task);
                taskEl.querySelector('.task-delete').onclick = () => this.deleteTask(task.id);
                
                tasksContainer.appendChild(taskEl);
            });
            
            section.appendChild(tasksContainer);
            container.appendChild(section);
        });
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks found</div>';
        }
    }

    getCategoryName(category) {
        // Map colors to names
        const names = {
            '#5B8DEE': 'Work',
            '#9B84EE': 'Personal', 
            '#52D0A4': 'Health',
            '#FFB454': 'Learning',
            '#FF6B6B': 'Urgent',
            '#6E6E7A': 'Other',
            // Legacy support
            'blue': 'Work',
            'purple': 'Personal',
            'green': 'Health',
            'orange': 'Learning'
        };
        return names[category] || 'Task';
    }

    filterTasks(filter) {
        this.loadAllTasksView();
    }

    async generateReport() {
        const startDate = document.getElementById('report-start').value;
        const endDate = document.getElementById('report-end').value;
        
        if (!startDate || !endDate) {
            // Use last 30 days as default
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            
            document.getElementById('report-start').value = this.formatDate(start);
            document.getElementById('report-end').value = this.formatDate(end);
            return this.generateReport();
        }
        
        try {
            const response = await fetch(`http://localhost:3001/api/reports/${startDate}/${endDate}`);
            const report = await response.json();
            
            // Update stats
            document.getElementById('total-tasks').textContent = report.stats.totalTasks;
            document.getElementById('completed-tasks').textContent = report.stats.completedTasks;
            document.getElementById('completion-rate').textContent = report.stats.completionRate + '%';
            document.getElementById('total-hours').textContent = report.stats.totalHours.toFixed(1) + 'h';
            
            // Show detailed report
            const details = document.getElementById('report-details');
            details.innerHTML = `
                <div class="report-section">
                    <h3>Tasks by Priority</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">High</span>
                            <span class="stat-value">${report.stats.byPriority.high}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Medium</span>
                            <span class="stat-value">${report.stats.byPriority.medium}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Low</span>
                            <span class="stat-value">${report.stats.byPriority.low}</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Tasks by Category</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Work</span>
                            <span class="stat-value">${report.stats.byCategory.blue}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Personal</span>
                            <span class="stat-value">${report.stats.byCategory.purple}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Health</span>
                            <span class="stat-value">${report.stats.byCategory.green}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Learning</span>
                            <span class="stat-value">${report.stats.byCategory.orange}</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h3>Daily Breakdown</h3>
                    <div class="daily-breakdown">
                        ${report.tasksByDate.map(day => `
                            <div class="day-report">
                                <div class="day-report-header">
                                    <span class="day-date">${day.date === 'unscheduled' ? 'Unscheduled' : new Date(day.date).toLocaleDateString()}</span>
                                    <span class="day-stats">${day.completedCount}/${day.tasks.length} completed • ${day.totalHours.toFixed(1)}h</span>
                                </div>
                                <div class="day-tasks-list">
                                    ${day.tasks.map(task => `
                                        <div class="report-task ${task.completed ? 'completed' : ''}">
                                            <span class="task-status">${task.completed ? '✓' : '○'}</span>
                                            <span class="task-name">${task.title}</span>
                                            <span class="task-hours">${task.time_hours}h</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error generating report:', error);
        }
    }

    switchView(view) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}-view`);
        });
        
        this.currentView = view;
        
        // Load view-specific data
        if (view === 'tasks') {
            this.loadAllTasksView();
        } else if (view === 'analytics') {
            // Set default date range for analytics
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            
            document.getElementById('report-start').value = this.formatDate(start);
            document.getElementById('report-end').value = this.formatDate(end);
            
            // Auto-generate report
            this.generateReport();
        }
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.updateMonthDisplay();
        this.renderCalendar();
        setTimeout(() => this.setupCalendarDragDrop(), 100);
    }

    updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    updateTodayDate() {
        const today = new Date();
        document.querySelector('.date-today').textContent = today.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    updateDayStats() {
        const today = this.formatDate(new Date());
        
        // Debug: log all tasks to see their dates
        console.log('All tasks with details:');
        this.tasks.forEach(t => {
            console.log(`  - "${t.title}" | date: "${t.date}" | completed: ${t.completed}`);
        });
        console.log('Today date we are comparing:', today);
        
        const todayTasks = this.tasks.filter(t => t.date === today);
        const openTasks = todayTasks.filter(t => !t.completed);
        const completedTasks = todayTasks.filter(t => t.completed);
        
        const openElement = document.getElementById('tasks-today');
        const doneElement = document.getElementById('completed-today');
        
        if (openElement) {
            openElement.textContent = openTasks.length;
        }
        if (doneElement) {
            doneElement.textContent = completedTasks.length;
        }
        
        // Debug log
        console.log('Today tasks:', todayTasks.length, 'Open:', openTasks.length, 'Done:', completedTasks.length);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PlannerApp();
});