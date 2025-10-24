/**
 * Macro Engine - Handles macro creation, storage, and execution
 * 
 * This module manages the complete lifecycle of macros including:
 * - Macro creation and editing
 * - Action sequencing (keyboard, joystick, timers)
 * - Playback execution
 * - Loop configuration
 */

const { v4: uuidv4 } = require('uuid');

// Try to load robotjs, but don't fail if it's not available
let robot = null;
try {
    robot = require('robotjs');
    console.log('robotjs loaded successfully');
} catch (error) {
    console.warn('robotjs not available - keyboard/mouse simulation disabled');
    console.warn('To enable keyboard simulation, install build tools and run: npm install robotjs');
}

// Action Types
const ActionType = {
    KEYBOARD_KEY: 'keyboard_key',
    KEYBOARD_HOLD: 'keyboard_hold',
    KEYBOARD_RELEASE: 'keyboard_release',
    JOYSTICK_BUTTON: 'joystick_button',
    JOYSTICK_AXIS: 'joystick_axis',
    MOUSE_MOVE: 'mouse_move',
    MOUSE_CLICK: 'mouse_click',
    TIMER_DELAY: 'timer_delay'
};

/**
 * Represents a single action within a macro sequence
 */
class MacroAction {
    constructor(actionType, deviceId = null, inputName = '', value = null, duration = 0) {
        this.actionId = uuidv4();
        this.actionType = actionType;
        this.deviceId = deviceId;
        this.inputName = inputName;
        this.value = value;
        this.duration = duration; // milliseconds
    }

    toString() {
        if (this.actionType === ActionType.TIMER_DELAY) {
            return `Wait ${this.duration}ms`;
        } else if (this.actionType === ActionType.KEYBOARD_KEY) {
            return `Press ${this.inputName}`;
        } else if (this.actionType === ActionType.JOYSTICK_BUTTON) {
            return `Press ${this.inputName} on ${this.deviceId}`;
        } else if (this.actionType === ActionType.JOYSTICK_AXIS) {
            return `Move ${this.inputName} to ${this.value}%`;
        }
        return `${this.actionType}: ${this.inputName}`;
    }

    toJSON() {
        return {
            actionId: this.actionId,
            actionType: this.actionType,
            deviceId: this.deviceId,
            inputName: this.inputName,
            value: this.value,
            duration: this.duration
        };
    }

    static fromJSON(data) {
        const action = new MacroAction(
            data.actionType,
            data.deviceId,
            data.inputName,
            data.value,
            data.duration
        );
        action.actionId = data.actionId || uuidv4();
        return action;
    }
}

/**
 * Represents a complete macro with multiple actions
 */
class Macro {
    constructor(name = 'New Macro') {
        this.macroId = uuidv4();
        this.name = name;
        this.actions = [];
        this.repeatCount = 1; // 0 = infinite loop
        this.enabled = true;
        this.description = '';
        this.createdAt = new Date();
        this.modifiedAt = new Date();
    }

    toString() {
        const loopText = this.repeatCount === 0 ? '∞' : this.repeatCount;
        return `${this.name} (${this.actions.length} actions, repeat: ${loopText})`;
    }

    addAction(action) {
        this.actions.push(action);
        this.modifiedAt = new Date();
    }

    removeAction(actionId) {
        this.actions = this.actions.filter(a => a.actionId !== actionId);
        this.modifiedAt = new Date();
    }

    moveAction(actionId, newIndex) {
        const actionIndex = this.actions.findIndex(a => a.actionId === actionId);
        if (actionIndex !== -1) {
            const [action] = this.actions.splice(actionIndex, 1);
            this.actions.splice(newIndex, 0, action);
            this.modifiedAt = new Date();
        }
    }

    toJSON() {
        return {
            macroId: this.macroId,
            name: this.name,
            actions: this.actions.map(a => a.toJSON()),
            repeatCount: this.repeatCount,
            enabled: this.enabled,
            description: this.description,
            createdAt: this.createdAt.toISOString(),
            modifiedAt: this.modifiedAt.toISOString()
        };
    }

    static fromJSON(data) {
        const macro = new Macro(data.name);
        macro.macroId = data.macroId || uuidv4();
        macro.actions = (data.actions || []).map(a => MacroAction.fromJSON(a));
        macro.repeatCount = data.repeatCount || 1;
        macro.enabled = data.enabled !== undefined ? data.enabled : true;
        macro.description = data.description || '';
        macro.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        macro.modifiedAt = data.modifiedAt ? new Date(data.modifiedAt) : new Date();
        return macro;
    }
}

/**
 * Manages macro execution and playback
 */
class MacroEngine {
    constructor(deviceManager = null) {
        this.deviceManager = deviceManager;
        this.macros = new Map();
        this.activePlaybacks = new Map();
        this.stopFlags = new Map();
        
        console.log('Macro engine initialized');
    }

    /**
     * Create a new macro
     */
    createMacro(name = 'New Macro') {
        const macro = new Macro(name);
        this.macros.set(macro.macroId, macro);
        console.log(`Created macro: ${name} (${macro.macroId})`);
        return macro;
    }

    /**
     * Delete a macro
     */
    deleteMacro(macroId) {
        if (this.macros.has(macroId)) {
            this.stopMacro(macroId);
            this.macros.delete(macroId);
            console.log(`Deleted macro: ${macroId}`);
        }
    }

    /**
     * Get a macro by ID
     */
    getMacro(macroId) {
        return this.macros.get(macroId);
    }

    /**
     * Get all macros
     */
    getAllMacros() {
        return Array.from(this.macros.values());
    }

    /**
     * Start playing a macro
     */
    async playMacro(macroId) {
        const macro = this.getMacro(macroId);
        if (!macro) {
            console.error(`Macro not found: ${macroId}`);
            return;
        }

        if (!macro.enabled) {
            console.warn(`Macro is disabled: ${macro.name}`);
            return;
        }

        // Stop if already playing
        if (this.activePlaybacks.has(macroId)) {
            this.stopMacro(macroId);
        }

        // Create stop flag
        const stopFlag = { stopped: false };
        this.stopFlags.set(macroId, stopFlag);

        // Start playback
        this.activePlaybacks.set(macroId, true);
        console.log(`Started playback: ${macro.name}`);

        // Run playback loop
        await this._playbackLoop(macro, stopFlag);

        // Cleanup
        this.activePlaybacks.delete(macroId);
        this.stopFlags.delete(macroId);
        console.log(`Playback finished: ${macro.name}`);
    }

    /**
     * Stop playing a macro
     */
    stopMacro(macroId) {
        const stopFlag = this.stopFlags.get(macroId);
        if (stopFlag) {
            stopFlag.stopped = true;
            console.log(`Stopping macro: ${macroId}`);
        }
    }

    /**
     * Stop all playing macros
     */
    stopAllMacros() {
        for (const macroId of this.stopFlags.keys()) {
            this.stopMacro(macroId);
        }
    }

    /**
     * Check if a macro is currently playing
     */
    isMacroPlaying(macroId) {
        return this.activePlaybacks.has(macroId);
    }

    /**
     * Main playback loop
     */
    async _playbackLoop(macro, stopFlag) {
        const repeatCount = macro.repeatCount;
        let iteration = 0;

        while (!stopFlag.stopped) {
            // Check if we've reached repeat limit
            if (repeatCount > 0) {
                iteration++;
                if (iteration > repeatCount) {
                    break;
                }
            }

            // Execute each action in sequence
            for (const action of macro.actions) {
                if (stopFlag.stopped) {
                    break;
                }

                await this._executeAction(action);
            }

            // If repeat_count is 1, stop after first execution
            if (repeatCount === 1) {
                break;
            }
        }
    }

    /**
     * Execute a single macro action
     */
    async _executeAction(action) {
        try {
            if (action.actionType === ActionType.TIMER_DELAY) {
                await this._sleep(action.duration);
            } else if (action.actionType === ActionType.KEYBOARD_KEY) {
                await this._executeKeyboardKey(action);
            } else if (action.actionType === ActionType.KEYBOARD_HOLD) {
                await this._executeKeyboardHold(action);
            } else if (action.actionType === ActionType.KEYBOARD_RELEASE) {
                await this._executeKeyboardRelease(action);
            } else if (action.actionType === ActionType.MOUSE_CLICK) {
                await this._executeMouseClick(action);
            } else if (action.actionType === ActionType.MOUSE_MOVE) {
                await this._executeMouseMove(action);
            }
            // Note: Joystick actions require additional libraries
        } catch (error) {
            console.error(`Error executing action: ${error}`);
        }
    }

    /**
     * Execute keyboard key press
     */
    async _executeKeyboardKey(action) {
        if (!robot) {
            console.warn('robotjs not available - cannot execute keyboard action');
            return;
        }
        const key = this._convertKeyName(action.inputName);
        robot.keyTap(key);
        await this._sleep(50); // Small delay between key presses
    }

    /**
     * Execute keyboard key hold
     */
    async _executeKeyboardHold(action) {
        if (!robot) {
            console.warn('robotjs not available - cannot execute keyboard action');
            return;
        }
        const key = this._convertKeyName(action.inputName);
        robot.keyToggle(key, 'down');
        await this._sleep(action.duration);
    }

    /**
     * Execute keyboard key release
     */
    async _executeKeyboardRelease(action) {
        if (!robot) {
            console.warn('robotjs not available - cannot execute keyboard action');
            return;
        }
        const key = this._convertKeyName(action.inputName);
        robot.keyToggle(key, 'up');
    }

    /**
     * Execute mouse click
     */
    async _executeMouseClick(action) {
        if (!robot) {
            console.warn('robotjs not available - cannot execute mouse action');
            return;
        }
        robot.mouseClick(action.value || 'left');
        await this._sleep(50);
    }

    /**
     * Execute mouse move
     */
    async _executeMouseMove(action) {
        if (!robot) {
            console.warn('robotjs not available - cannot execute mouse action');
            return;
        }
        if (action.value && action.value.x !== undefined && action.value.y !== undefined) {
            robot.moveMouse(action.value.x, action.value.y);
        }
    }

    /**
     * Convert key name to robotjs format
     */
    _convertKeyName(keyName) {
        const keyMap = {
            'Space': 'space',
            'Enter': 'enter',
            'Tab': 'tab',
            'Shift': 'shift',
            'Control': 'control',
            'Alt': 'alt',
            'Escape': 'escape',
            'Backspace': 'backspace',
            'Delete': 'delete',
            'Home': 'home',
            'End': 'end',
            'PageUp': 'pageup',
            'PageDown': 'pagedown',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'CapsLock': 'capslock',
            'Meta': 'command'
        };

        return keyMap[keyName] || keyName.toLowerCase();
    }

    /**
     * Sleep utility
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Save macros to JSON
     */
    toJSON() {
        const macros = {};
        for (const [id, macro] of this.macros) {
            macros[id] = macro.toJSON();
        }
        return macros;
    }

    /**
     * Load macros from JSON
     */
    fromJSON(data) {
        this.macros.clear();
        for (const [id, macroData] of Object.entries(data)) {
            const macro = Macro.fromJSON(macroData);
            this.macros.set(macro.macroId, macro);
        }
    }
}

// Export for use in renderer process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MacroEngine, Macro, MacroAction, ActionType };
}

