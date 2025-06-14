document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterAllBtn = document.getElementById('filterAll');
    const filterCompletedBtn = document.getElementById('filterCompleted');
    const filterPendingBtn = document.getElementById('filterPending');
    const noTasksMessage = document.getElementById('noTasksMessage'); // New element for empty list message

    let tasks = JSON.parse(localStorage.getItem('tasks')) || []; // Retrieve from local storage or empty array

    // --- Core Functions ---

    // Loads and displays tasks from the 'tasks' array
    function renderTasks(filter = getActiveFilter()) { // Default filter to active one
        taskList.innerHTML = ''; // Clear existing task list
        const filteredTasks = tasks.filter(task => {
            if (filter === 'completed') {
                return task.completed;
            } else if (filter === 'pending') {
                return !task.completed;
            }
            return true; // 'all' filter
        });

        // Sort tasks: pending tasks on top, then by due date, then by text
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Uncompleted tasks on top
            }
            // Sort by due date if available
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate && !b.dueDate) return -1; // Tasks with a date come first
            if (!a.dueDate && b.dueDate) return 1;
            // If no date, sort by text
            return a.text.localeCompare(b.text);
        });

        if (filteredTasks.length === 0) {
            noTasksMessage.style.display = 'block'; // Show message if no tasks
        } else {
            noTasksMessage.style.display = 'none'; // Hide message if tasks exist
            filteredTasks.forEach(task => {
                const listItem = createNewTaskElement(task);
                taskList.appendChild(listItem);
            });
        }
    }

    // Creates a new task DOM element
    function createNewTaskElement(task) {
        const listItem = document.createElement('li');
        listItem.dataset.id = task.id; // Store task ID in DOM element

        // Add 'completed' class if task is completed
        if (task.completed) {
            listItem.classList.add('completed');
        }

        const taskContent = document.createElement('div');
        taskContent.classList.add('task-content');

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));

        // Task Text
        const taskTextSpan = document.createElement('span');
        taskTextSpan.classList.add('task-text');
        taskTextSpan.textContent = task.text;

        // Due Date (if any)
        const dueDateSpan = document.createElement('span');
        dueDateSpan.classList.add('due-date');
        if (task.dueDate) {
            // Format date for readability
            const date = new Date(task.dueDate + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
            dueDateSpan.textContent = `Due: ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
            // Add 'overdue' class if date is past and not completed
            if (!task.completed && date < new Date().setHours(0,0,0,0)) { // Compare with today's date without time
                dueDateSpan.classList.add('overdue');
            }
        } else {
            dueDateSpan.textContent = 'No Due Date'; // Changed text
            dueDateSpan.classList.add('no-date');
        }

        taskContent.appendChild(checkbox);
        taskContent.appendChild(taskTextSpan);
        taskContent.appendChild(dueDateSpan);

        // Delete Button
        const taskActions = document.createElement('div');
        taskActions.classList.add('task-actions');

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Trash icon
        deleteBtn.addEventListener('click', () => deleteTask(task.id, listItem));

        taskActions.appendChild(deleteBtn);

        listItem.appendChild(taskContent);
        listItem.appendChild(taskActions);

        return listItem;
    }

    // --- Event Listeners ---

    // Add new task
    addTaskBtn.addEventListener('click', addNewTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTask();
        }
    });
    dueDateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTask();
        }
    });

    // Filter tasks
    filterAllBtn.addEventListener('click', () => setActiveFilter('all'));
    filterCompletedBtn.addEventListener('click', () => setActiveFilter('completed'));
    filterPendingBtn.addEventListener('click', () => setActiveFilter('pending'));

    function setActiveFilter(filter) {
        // Remove 'active' class from all buttons
        filterAllBtn.classList.remove('active');
        filterCompletedBtn.classList.remove('active');
        filterPendingBtn.classList.remove('active');

        // Set 'active' class for the clicked button
        filterAllBtn.setAttribute('aria-pressed', 'false');
        filterCompletedBtn.setAttribute('aria-pressed', 'false');
        filterPendingBtn.setAttribute('aria-pressed', 'false');

        if (filter === 'all') {
            filterAllBtn.classList.add('active');
            filterAllBtn.setAttribute('aria-pressed', 'true');
        } else if (filter === 'completed') {
            filterCompletedBtn.classList.add('active');
            filterCompletedBtn.setAttribute('aria-pressed', 'true');
        } else if (filter === 'pending') {
            filterPendingBtn.classList.add('active');
            filterPendingBtn.setAttribute('aria-pressed', 'true');
        }

        renderTasks(filter);
    }

    // --- Data Manipulation Functions ---

    function addNewTask() {
        const taskText = taskInput.value.trim();
        const dueDate = dueDateInput.value; // Format YYYY-MM-DD

        if (taskText === "") {
            alert("Task cannot be empty!");
            return;
        }

        const newTask = {
            id: Date.now(), // Unique ID based on timestamp
            text: taskText,
            completed: false,
            dueDate: dueDate // Store date
        };

        tasks.push(newTask);
        saveTasks(); // Save to Local Storage

        // Add 'adding' class for animation
        const newListItem = createNewTaskElement(newTask);
        taskList.appendChild(newListItem);
        newListItem.classList.add('adding');

        // Remove 'adding' class after animation completes
        newListItem.addEventListener('animationend', () => {
            newListItem.classList.remove('adding');
        }, { once: true });

        taskInput.value = ''; // Clear input
        dueDateInput.value = ''; // Clear date input
        renderTasks(getActiveFilter()); // Re-render with active filter
    }

    function toggleTaskCompleted(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks(getActiveFilter()); // Re-render to update display
        }
    }

    function deleteTask(id, listItemElement) {
        // Add 'removing' class for animation
        listItemElement.classList.add('removing');

        // Remove element from DOM after animation completes
        listItemElement.addEventListener('animationend', () => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            listItemElement.remove(); // Remove element from DOM after data is updated
            renderTasks(getActiveFilter()); // Re-render to ensure order etc.
        }, { once: true }); // Ensure event listener runs only once
    }

    // --- Local Storage ---

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // --- Utilities ---

    function getActiveFilter() {
        if (filterCompletedBtn.classList.contains('active')) return 'completed';
        if (filterPendingBtn.classList.contains('active')) return 'pending';
        return 'all';
    }

    // Initialization: Render tasks when the page first loads
    renderTasks('all');
});