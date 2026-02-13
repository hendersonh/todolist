document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const form = document.querySelector('form');

    // AJAX Task Addition
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = input.value.trim();
        if (!title) return;

        const btn = document.getElementById('add-btn');
        const originalBtnContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const formData = new FormData();
            formData.append('title', title);

            const response = await fetch('/add', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();

            if (data.success) {
                // Clear input
                input.value = '';

                // Construct new task HTML
                const todoList = document.getElementById('todo-list');
                const emptyState = document.querySelector('.empty-state');
                if (emptyState) emptyState.remove();

                const taskHTML = `
                    <li class="task-item" style="opacity: 0; transform: translateY(10px);">
                        <span class="task-title">${data.title}</span>
                        <div class="task-actions">
                            <a href="/update/${data.id}" class="action-btn update-btn" data-id="${data.id}" title="Toggle Complete">
                                <i class="fas fa-check"></i>
                            </a>
                            <a href="/delete/${data.id}" class="action-btn delete-btn" data-id="${data.id}" title="Delete Task">
                                <i class="fas fa-trash-alt"></i>
                            </a>
                        </div>
                    </li>
                `;

                // If no list exists, create one - henderson hood
                if (!todoList) {
                    const taskSection = document.querySelector('.task-list');
                    taskSection.innerHTML = `<ul id="todo-list">${taskHTML}</ul>`;
                } else {
                    todoList.insertAdjacentHTML('afterbegin', taskHTML);
                }

                // Trigger entrance animation
                const newItem = (todoList || document.getElementById('todo-list')).firstElementChild;
                setTimeout(() => {
                    newItem.style.opacity = '1';
                    newItem.style.transform = 'translateY(0)';
                    newItem.style.transition = 'all 0.4s ease-out';
                }, 10);
            }
        } catch (err) {
            console.error('Error adding task:', err);
            form.submit(); // Fallback
        } finally {
            btn.innerHTML = originalBtnContent;
        }
    });

    // Delegate events for better management of dynamic items
    document.addEventListener('click', async (e) => {
        // Handle Toggle Completion
        const updateBtn = e.target.closest('.update-btn');
        if (updateBtn) {
            e.preventDefault();
            const taskId = updateBtn.getAttribute('data-id');
            const taskItem = updateBtn.closest('.task-item');

            try {
                const response = await fetch(`/update/${taskId}?format=json`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();

                if (data.success) {
                    // Update UI without reload
                    taskItem.classList.toggle('completed', data.complete);
                    const icon = updateBtn.querySelector('i');
                    if (data.complete) {
                        icon.classList.replace('fa-check', 'fa-redo');
                    } else {
                        icon.classList.replace('fa-redo', 'fa-check');
                    }
                }
            } catch (err) {
                console.error('Error toggling task:', err);
                // Fallback to reload if fetch fails
                window.location.href = updateBtn.href;
            }
        }

        // Handle Delete Task
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.preventDefault();
            const taskId = deleteBtn.getAttribute('data-id');
            const taskItem = deleteBtn.closest('.task-item');

            // UI feedback
            taskItem.style.opacity = '0.5';
            taskItem.style.transform = 'scale(0.95)';

            try {
                const response = await fetch(`/delete/${taskId}?format=json`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await response.json();

                if (data.success) {
                    taskItem.style.opacity = '0';
                    taskItem.style.transform = 'scale(0.5)';
                    setTimeout(() => taskItem.remove(), 300);
                }
            } catch (err) {
                console.error('Error deleting task:', err);
                window.location.href = deleteBtn.href;
            }
        }
    });

    // Enter key support
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            form.submit();
        }
    });
});
