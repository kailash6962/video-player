let currentAction = null;
let currentUserId = null;

// Load users and settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadSettings();
});

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const users = await response.json();
        renderUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Please check your connection.');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #888; padding: 40px;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const row = document.createElement('tr');
    
    const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
    const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
    
    const avatarStyle = user.avatar_bg_color && user.avatar_text_color 
        ? `style="background: ${user.avatar_bg_color}; color: ${user.avatar_text_color};"` 
        : '';
    
    const statusClass = user.is_active ? 'status-active' : 'status-suspended';
    const statusText = user.is_active ? 'Active' : 'Suspended';
    
    const actionButton = user.is_active 
        ? `<button class="action-btn suspend-btn" onclick="showSuspendModal(${user.id}, '${user.display_name}')">Suspend</button>`
        : `<button class="action-btn activate-btn" onclick="showActivateModal(${user.id}, '${user.display_name}')">Activate</button>`;
    
    row.innerHTML = `
        <td>
            <div class="user-avatar-cell">
                <div class="user-avatar-admin" ${avatarStyle}>${user.avatar_emoji}</div>
                <div class="user-info">
                    <div class="user-display-name">${user.display_name}</div>
                    <div class="user-username">@${user.username}</div>
                </div>
            </div>
        </td>
        <td>${createdDate}</td>
        <td>${lastLoginDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${actionButton}</td>
    `;
    
    return row;
}

function showSuspendModal(userId, displayName) {
    currentAction = 'suspend';
    currentUserId = userId;
    document.getElementById('pinSubtitle').textContent = `Enter admin PIN to suspend ${displayName}`;
    showPinModal();
}

function showActivateModal(userId, displayName) {
    currentAction = 'activate';
    currentUserId = userId;
    document.getElementById('pinSubtitle').textContent = `Enter admin PIN to activate ${displayName}`;
    showPinModal();
}

function showPinModal() {
    document.getElementById('pinModal').classList.add('show');
    clearPinInputs();
    document.getElementById('pin1').focus();
}

function closePinModal() {
    document.getElementById('pinModal').classList.remove('show');
    currentAction = null;
    currentUserId = null;
    clearErrorMessage();
}

function clearPinInputs() {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`pin${i}`).value = '';
    }
}

function clearErrorMessage() {
    document.getElementById('errorMessage').textContent = '';
}

function handlePinInput(position) {
    const input = document.getElementById(`pin${position}`);
    const value = input.value;
    
    if (value && position < 4) {
        document.getElementById(`pin${position + 1}`).focus();
    }
}

function handlePinKeydown(event, position) {
    if (event.key === 'Backspace' && !event.target.value && position > 1) {
        document.getElementById(`pin${position - 1}`).focus();
    } else if (event.key === 'Enter') {
        submitAdminPin();
    }
}

async function submitAdminPin() {
    let pin = '';
    for (let i = 1; i <= 4; i++) {
        const digit = document.getElementById(`pin${i}`).value;
        if (!digit) {
            showError('Please enter all 4 digits');
            return;
        }
        pin += digit;
    }
    
    try {
        if (currentAction === 'suspend') {
            await suspendUser(currentUserId, pin);
        } else if (currentAction === 'activate') {
            await activateUser(currentUserId, pin);
        } else if (currentAction === 'toggleRegistration') {
            await updateRegistrationSetting(pin);
        }
    } catch (error) {
        console.error('Admin action failed:', error);
    }
}

async function suspendUser(userId, pin) {
    try {
        const response = await fetch('/api/admin/suspend-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pin })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showSuccess('User suspended successfully');
            closePinModal();
            await loadUsers(); // Refresh the table
        } else {
            showError(result.error || 'Failed to suspend user');
        }
    } catch (error) {
        showError('Connection error');
    }
}

async function activateUser(userId, pin) {
    try {
        const response = await fetch('/api/admin/activate-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pin })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showSuccess('User activated successfully');
            closePinModal();
            await loadUsers(); // Refresh the table
        } else {
            showError(result.error || 'Failed to activate user');
        }
    } catch (error) {
        showError('Connection error');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.className = 'error-message';
    
    // Clear error after 3 seconds
    setTimeout(() => {
        errorDiv.textContent = '';
    }, 3000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.className = 'success-message';
    
    // Clear message after 3 seconds
    setTimeout(() => {
        errorDiv.textContent = '';
        errorDiv.className = 'error-message';
    }, 3000);
}

async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('registrationToggle').checked = settings.allowRegistration;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        // Default to enabled if can't load
        document.getElementById('registrationToggle').checked = true;
    }
}

async function toggleRegistration() {
    const isEnabled = document.getElementById('registrationToggle').checked;
    const action = isEnabled ? 'enable' : 'disable';
    
    // Show PIN modal for confirmation
    currentAction = 'toggleRegistration';
    document.getElementById('pinSubtitle').textContent = `Enter admin PIN to ${action} user registration`;
    showPinModal();
}

async function updateRegistrationSetting(pin) {
    const isEnabled = document.getElementById('registrationToggle').checked;
    
    try {
        const response = await fetch('/api/admin/toggle-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowRegistration: isEnabled, pin })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            const status = isEnabled ? 'enabled' : 'disabled';
            showSuccess(`User registration ${status} successfully`);
            closePinModal();
        } else {
            // Revert toggle if failed
            document.getElementById('registrationToggle').checked = !isEnabled;
            showError(result.error || 'Failed to update registration setting');
        }
    } catch (error) {
        // Revert toggle if failed
        document.getElementById('registrationToggle').checked = !isEnabled;
        showError('Connection error');
    }
}

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('pinModal').classList.contains('show')) {
        closePinModal();
    }
});
