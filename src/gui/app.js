/**
 * PINKMacroTool - Main Application
 * 
 * Handles UI interactions and coordinates between core modules.
 */

// Initialize core modules
let deviceManager;
let macroEngine;
let triggerEngine;
let configManager;

// UI state
let selectedDeviceId = null;
let selectedMacroId = null;
let selectedTriggerId = null;
let selectedActionId = null;
let currentTab = 'macro-editor';

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing PINKMacroTool...');
    
    // Create core instances
    deviceManager = new DeviceManager();
    macroEngine = new MacroEngine(deviceManager);
    triggerEngine = new TriggerEngine(macroEngine, deviceManager);
    configManager = new ConfigManager();
    
    // Wait for config to initialize
    setTimeout(() => {
        // Load saved data
        loadSavedData();
        
        // Initialize UI
        initializeUI();
        
        // Populate UI
        refreshDeviceList();
        refreshMacroList();
        refreshTriggerList();
        
        console.log('Application initialized successfully');
    }, 500);
}

/**
 * Load saved macros and triggers
 */
function loadSavedData() {
    try {
        if (configManager.macrosFileExists()) {
            configManager.loadMacros(macroEngine);
        }
        
        if (configManager.triggersFileExists()) {
            configManager.loadTriggers(triggerEngine);
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

/**
 * Initialize UI event listeners
 */
function initializeUI() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // Device panel
    document.getElementById('refresh-devices-btn').addEventListener('click', refreshDevices);
    
    // Macro editor
    document.getElementById('new-macro-btn').addEventListener('click', createNewMacro);
    document.getElementById('rename-macro-btn').addEventListener('click', renameMacro);
    document.getElementById('delete-macro-btn').addEventListener('click', deleteMacro);
    document.getElementById('add-input-btn').addEventListener('click', addInputAction);
    document.getElementById('add-timer-btn').addEventListener('click', addTimerAction);
    document.getElementById('remove-action-btn').addEventListener('click', removeAction);
    document.getElementById('play-macro-btn').addEventListener('click', playMacro);
    document.getElementById('stop-macro-btn').addEventListener('click', stopMacro);
    document.getElementById('repeat-count').addEventListener('change', updateRepeatCount);
    
    // Trigger panel
    document.getElementById('new-trigger-btn').addEventListener('click', createNewTrigger);
    document.getElementById('edit-trigger-btn').addEventListener('click', editTrigger);
    document.getElementById('delete-trigger-btn').addEventListener('click', deleteTrigger);
    
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            handleMenuClick(item.dataset.menu);
        });
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab headers
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

/**
 * Refresh device list
 */
function refreshDevices() {
    deviceManager.refreshDevices();
    refreshDeviceList();
}

/**
 * Refresh device list UI
 */
function refreshDeviceList() {
    const deviceList = document.getElementById('device-list');
    deviceList.innerHTML = '';
    
    const devices = deviceManager.getAllDevices();
    
    devices.forEach(device => {
        const deviceItem = document.createElement('div');
        deviceItem.className = 'device-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'device-checkbox';
        checkbox.checked = deviceManager.isDeviceEnabled(device.deviceId);
        checkbox.addEventListener('change', (e) => {
            deviceManager.setDeviceEnabled(device.deviceId, e.target.checked);
            updateStatusBar();
        });
        
        const label = document.createElement('span');
        label.textContent = device.toString();
        
        deviceItem.appendChild(checkbox);
        deviceItem.appendChild(label);
        
        deviceItem.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                selectDevice(device.deviceId);
            }
        });
        
        deviceList.appendChild(deviceItem);
    });
    
    updateStatusBar();
}

/**
 * Select a device and show its capabilities
 */
function selectDevice(deviceId) {
    selectedDeviceId = deviceId;
    
    // Update selection visual
    document.querySelectorAll('.device-item').forEach((item, index) => {
        const devices = deviceManager.getAllDevices();
        item.classList.toggle('selected', devices[index]?.deviceId === deviceId);
    });
    
    // Show capabilities
    refreshCapabilityList();
}

/**
 * Refresh capability list for selected device
 */
function refreshCapabilityList() {
    const capabilityList = document.getElementById('capability-list');
    capabilityList.innerHTML = '';
    
    if (!selectedDeviceId) {
        capabilityList.innerHTML = '<div class="placeholder-text">Select a device</div>';
        return;
    }
    
    const capabilities = deviceManager.getDeviceCapabilities(selectedDeviceId);
    
    capabilities.forEach(capability => {
        const capItem = document.createElement('div');
        capItem.className = 'capability-item';
        capItem.textContent = capability.toString();
        
        capItem.addEventListener('dblclick', () => {
            addCapabilityToMacro(capability);
        });
        
        capabilityList.appendChild(capItem);
    });
}

/**
 * Create a new macro
 */
function createNewMacro() {
    const name = prompt('Enter macro name:', 'New Macro');
    if (name) {
        const macro = macroEngine.createMacro(name);
        refreshMacroList();
        selectMacro(macro.macroId);
    }
}

/**
 * Rename selected macro
 */
function renameMacro() {
    if (!selectedMacroId) return;
    
    const macro = macroEngine.getMacro(selectedMacroId);
    const newName = prompt('Enter new name:', macro.name);
    
    if (newName) {
        macro.name = newName;
        refreshMacroList();
    }
}

/**
 * Delete selected macro
 */
function deleteMacro() {
    if (!selectedMacroId) return;
    
    if (confirm('Are you sure you want to delete this macro?')) {
        macroEngine.deleteMacro(selectedMacroId);
        selectedMacroId = null;
        refreshMacroList();
        refreshActionList();
    }
}

/**
 * Refresh macro list UI
 */
function refreshMacroList() {
    const macroList = document.getElementById('macro-list');
    macroList.innerHTML = '';
    
    const macros = macroEngine.getAllMacros();
    
    if (macros.length === 0) {
        macroList.innerHTML = '<div class="placeholder-text">No macros</div>';
        return;
    }
    
    macros.forEach(macro => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = macro.name;
        
        if (macro.macroId === selectedMacroId) {
            item.classList.add('selected');
        }
        
        item.addEventListener('click', () => {
            selectMacro(macro.macroId);
        });
        
        macroList.appendChild(item);
    });
}

/**
 * Select a macro
 */
function selectMacro(macroId) {
    selectedMacroId = macroId;
    refreshMacroList();
    refreshActionList();
    
    const macro = macroEngine.getMacro(macroId);
    if (macro) {
        document.getElementById('repeat-count').value = macro.repeatCount;
    }
}

/**
 * Refresh action list for selected macro
 */
function refreshActionList() {
    const actionList = document.getElementById('action-list');
    actionList.innerHTML = '';
    
    if (!selectedMacroId) {
        actionList.innerHTML = '<div class="placeholder-text">Select a macro</div>';
        return;
    }
    
    const macro = macroEngine.getMacro(selectedMacroId);
    
    if (macro.actions.length === 0) {
        actionList.innerHTML = '<div class="placeholder-text">No actions</div>';
        return;
    }
    
    macro.actions.forEach((action, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = `${index + 1}. ${action.toString()}`;
        
        if (action.actionId === selectedActionId) {
            item.classList.add('selected');
        }
        
        item.addEventListener('click', () => {
            selectedActionId = action.actionId;
            refreshActionList();
        });
        
        actionList.appendChild(item);
    });
}

/**
 * Add input action from selected capability
 */
function addInputAction() {
    if (!selectedMacroId || !selectedDeviceId) {
        alert('Please select a macro and a device capability');
        return;
    }
    
    const capability = prompt('Enter input name (e.g., A, Space, Button 0):');
    if (!capability) return;
    
    const macro = macroEngine.getMacro(selectedMacroId);
    const action = new MacroAction(
        ActionType.KEYBOARD_KEY,
        selectedDeviceId,
        capability
    );
    
    macro.addAction(action);
    refreshActionList();
}

/**
 * Add capability to macro
 */
function addCapabilityToMacro(capability) {
    if (!selectedMacroId) {
        alert('Please select a macro first');
        return;
    }
    
    const macro = macroEngine.getMacro(selectedMacroId);
    const actionType = capability.inputType === 'key' ? ActionType.KEYBOARD_KEY : ActionType.JOYSTICK_BUTTON;
    
    const action = new MacroAction(
        actionType,
        selectedDeviceId,
        capability.name
    );
    
    macro.addAction(action);
    refreshActionList();
}

/**
 * Add timer action
 */
function addTimerAction() {
    if (!selectedMacroId) {
        alert('Please select a macro first');
        return;
    }
    
    const duration = prompt('Enter delay in milliseconds:', '100');
    if (!duration) return;
    
    const macro = macroEngine.getMacro(selectedMacroId);
    const action = new MacroAction(ActionType.TIMER_DELAY);
    action.duration = parseInt(duration);
    
    macro.addAction(action);
    refreshActionList();
}

/**
 * Remove selected action
 */
function removeAction() {
    if (!selectedMacroId || !selectedActionId) return;
    
    const macro = macroEngine.getMacro(selectedMacroId);
    macro.removeAction(selectedActionId);
    selectedActionId = null;
    refreshActionList();
}

/**
 * Play selected macro
 */
function playMacro() {
    if (!selectedMacroId) return;
    
    macroEngine.playMacro(selectedMacroId);
    updateMonitorStatus('Playing macro...');
}

/**
 * Stop selected macro
 */
function stopMacro() {
    if (!selectedMacroId) return;
    
    macroEngine.stopMacro(selectedMacroId);
    updateMonitorStatus('Stopped');
}

/**
 * Update repeat count
 */
function updateRepeatCount(event) {
    if (!selectedMacroId) return;
    
    const macro = macroEngine.getMacro(selectedMacroId);
    macro.repeatCount = parseInt(event.target.value);
}

/**
 * Create new trigger
 */
function createNewTrigger() {
    if (macroEngine.getAllMacros().length === 0) {
        alert('Please create a macro first');
        return;
    }
    
    const macros = macroEngine.getAllMacros();
    const macroId = macros[0].macroId;
    
    const trigger = triggerEngine.createTrigger(
        TriggerType.KEY_PRESS,
        macroId,
        'keyboard_0',
        'Space'
    );
    
    refreshTriggerList();
    selectTrigger(trigger.triggerId);
}

/**
 * Edit selected trigger
 */
function editTrigger() {
    if (!selectedTriggerId) return;
    alert('Trigger editing UI not yet implemented');
}

/**
 * Delete selected trigger
 */
function deleteTrigger() {
    if (!selectedTriggerId) return;
    
    if (confirm('Are you sure you want to delete this trigger?')) {
        triggerEngine.deleteTrigger(selectedTriggerId);
        selectedTriggerId = null;
        refreshTriggerList();
    }
}

/**
 * Refresh trigger list UI
 */
function refreshTriggerList() {
    const triggerList = document.getElementById('trigger-list');
    triggerList.innerHTML = '';
    
    const triggers = triggerEngine.getAllTriggers();
    
    if (triggers.length === 0) {
        triggerList.innerHTML = '<div class="placeholder-text">No triggers</div>';
        return;
    }
    
    triggers.forEach(trigger => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = trigger.toString();
        
        if (trigger.triggerId === selectedTriggerId) {
            item.classList.add('selected');
        }
        
        item.addEventListener('click', () => {
            selectTrigger(trigger.triggerId);
        });
        
        triggerList.appendChild(item);
    });
}

/**
 * Select a trigger
 */
function selectTrigger(triggerId) {
    selectedTriggerId = triggerId;
    refreshTriggerList();
}

/**
 * Handle menu clicks
 */
function handleMenuClick(menu) {
    switch (menu) {
        case 'file':
            showFileMenu();
            break;
        case 'devices':
            refreshDevices();
            break;
        case 'monitoring':
            toggleMonitoring();
            break;
        case 'help':
            showAbout();
            break;
    }
}

/**
 * Show file menu options
 */
function showFileMenu() {
    const action = prompt('File menu:\n1. Save\n2. Load\n3. Exit\nEnter number:');
    
    if (action === '1') {
        saveConfiguration();
    } else if (action === '2') {
        loadConfiguration();
    } else if (action === '3') {
        window.close();
    }
}

/**
 * Save configuration
 */
function saveConfiguration() {
    try {
        configManager.saveMacros(macroEngine);
        configManager.saveTriggers(triggerEngine);
        configManager.save();
        alert('Configuration saved successfully');
    } catch (error) {
        alert('Error saving configuration: ' + error.message);
    }
}

/**
 * Load configuration
 */
function loadConfiguration() {
    try {
        configManager.loadMacros(macroEngine);
        configManager.loadTriggers(triggerEngine);
        refreshMacroList();
        refreshTriggerList();
        alert('Configuration loaded successfully');
    } catch (error) {
        alert('Error loading configuration: ' + error.message);
    }
}

/**
 * Toggle monitoring
 */
function toggleMonitoring() {
    if (triggerEngine.monitoring) {
        triggerEngine.stopMonitoring();
        updateMonitorStatus('Stopped');
    } else {
        triggerEngine.startMonitoring();
        updateMonitorStatus('Monitoring...');
    }
}

/**
 * Show about dialog
 */
function showAbout() {
    alert('PINKMacroTool v1.0.0\n\nA sophisticated desktop application for creating and managing macros.\n\nElectron Edition');
}

/**
 * Update monitor status
 */
function updateMonitorStatus(status) {
    document.getElementById('monitor-status').textContent = status;
}

/**
 * Update last input display
 */
function updateLastInput(input) {
    document.getElementById('last-input').textContent = input;
}

/**
 * Update status bar
 */
function updateStatusBar() {
    const devices = deviceManager.getAllDevices();
    const enabledCount = devices.filter(d => deviceManager.isDeviceEnabled(d.deviceId)).length;
    
    document.getElementById('enabled-count').textContent = enabledCount;
    document.getElementById('total-count').textContent = devices.length;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

