/**
 * Trigger Engine - Handles trigger monitoring and macro activation
 * 
 * This module implements sophisticated trigger detection including:
 * - Key press, hold, and double-tap detection
 * - Modifier key combinations
 * - Joystick button and axis triggers
 * - Configurable trigger conditions
 */

const { v4: uuidv4 } = require('uuid');

// Trigger Types
const TriggerType = {
    KEY_PRESS: 'key_press',
    KEY_HOLD: 'key_hold',
    KEY_DOUBLE_TAP: 'key_double_tap',
    KEY_COMBO: 'key_combo',
    JOYSTICK_BUTTON: 'joystick_button',
    JOYSTICK_AXIS: 'joystick_axis'
};

/**
 * Represents a trigger condition that activates a macro
 */
class Trigger {
    constructor(triggerType, macroId, deviceId = null, inputName = '') {
        this.triggerId = uuidv4();
        this.triggerType = triggerType;
        this.macroId = macroId;
        this.deviceId = deviceId;
        this.inputName = inputName;
        this.modifiers = []; // For key combos
        this.axisThreshold = 0.5; // For axis triggers
        this.holdDuration = 500; // milliseconds
        this.doubleTapWindow = 300; // milliseconds
        this.enabled = true;
    }

    toString() {
        if (this.triggerType === TriggerType.KEY_PRESS) {
            return `Press ${this.inputName}`;
        } else if (this.triggerType === TriggerType.KEY_HOLD) {
            return `Hold ${this.inputName} for ${this.holdDuration}ms`;
        } else if (this.triggerType === TriggerType.KEY_DOUBLE_TAP) {
            return `Double-tap ${this.inputName}`;
        } else if (this.triggerType === TriggerType.KEY_COMBO) {
            const mods = this.modifiers.join('+');
            return `${mods}+${this.inputName}`;
        }
        return `${this.triggerType}: ${this.inputName}`;
    }

    toJSON() {
        return {
            triggerId: this.triggerId,
            triggerType: this.triggerType,
            macroId: this.macroId,
            deviceId: this.deviceId,
            inputName: this.inputName,
            modifiers: this.modifiers,
            axisThreshold: this.axisThreshold,
            holdDuration: this.holdDuration,
            doubleTapWindow: this.doubleTapWindow,
            enabled: this.enabled
        };
    }

    static fromJSON(data) {
        const trigger = new Trigger(
            data.triggerType,
            data.macroId,
            data.deviceId,
            data.inputName
        );
        trigger.triggerId = data.triggerId || uuidv4();
        trigger.modifiers = data.modifiers || [];
        trigger.axisThreshold = data.axisThreshold || 0.5;
        trigger.holdDuration = data.holdDuration || 500;
        trigger.doubleTapWindow = data.doubleTapWindow || 300;
        trigger.enabled = data.enabled !== undefined ? data.enabled : true;
        return trigger;
    }
}

/**
 * Manages trigger monitoring and macro activation
 */
class TriggerEngine {
    constructor(macroEngine = null, deviceManager = null) {
        this.macroEngine = macroEngine;
        this.deviceManager = deviceManager;
        this.triggers = new Map();
        
        // Monitoring state
        this.monitoring = false;
        this.gamepadInterval = null;
        
        // State tracking for complex triggers
        this.pressedKeys = new Set();
        this.keyPressTimes = new Map(); // key -> [timestamp1, timestamp2, ...]
        this.keyHoldTimers = new Map(); // key -> timeout
        
        console.log('Trigger engine initialized');
    }

    /**
     * Create a new trigger
     */
    createTrigger(triggerType, macroId, deviceId = null, inputName = '') {
        const trigger = new Trigger(triggerType, macroId, deviceId, inputName);
        this.triggers.set(trigger.triggerId, trigger);
        console.log(`Created trigger: ${trigger.toString()} (${trigger.triggerId})`);
        return trigger;
    }

    /**
     * Delete a trigger
     */
    deleteTrigger(triggerId) {
        if (this.triggers.has(triggerId)) {
            this.triggers.delete(triggerId);
            console.log(`Deleted trigger: ${triggerId}`);
        }
    }

    /**
     * Get a trigger by ID
     */
    getTrigger(triggerId) {
        return this.triggers.get(triggerId);
    }

    /**
     * Get all triggers
     */
    getAllTriggers() {
        return Array.from(this.triggers.values());
    }

    /**
     * Get triggers for a specific macro
     */
    getTriggersForMacro(macroId) {
        return this.getAllTriggers().filter(t => t.macroId === macroId);
    }

    /**
     * Start monitoring for triggers
     */
    startMonitoring() {
        if (this.monitoring) {
            console.log('Monitoring already started');
            return;
        }

        this.monitoring = true;
        console.log('Starting trigger monitoring...');

        // Start keyboard monitoring
        this._startKeyboardMonitoring();

        // Start gamepad monitoring
        this._startGamepadMonitoring();
    }

    /**
     * Stop monitoring for triggers
     */
    stopMonitoring() {
        if (!this.monitoring) {
            return;
        }

        this.monitoring = false;
        console.log('Stopping trigger monitoring...');

        // Stop keyboard monitoring
        this._stopKeyboardMonitoring();

        // Stop gamepad monitoring
        this._stopGamepadMonitoring();

        // Clear state
        this.pressedKeys.clear();
        this.keyPressTimes.clear();
        for (const timer of this.keyHoldTimers.values()) {
            clearTimeout(timer);
        }
        this.keyHoldTimers.clear();
    }

    /**
     * Start keyboard monitoring
     */
    _startKeyboardMonitoring() {
        // Listen for keydown events
        document.addEventListener('keydown', this._handleKeyDown.bind(this));
        document.addEventListener('keyup', this._handleKeyUp.bind(this));
    }

    /**
     * Stop keyboard monitoring
     */
    _stopKeyboardMonitoring() {
        document.removeEventListener('keydown', this._handleKeyDown.bind(this));
        document.removeEventListener('keyup', this._handleKeyUp.bind(this));
    }

    /**
     * Handle key down event
     */
    _handleKeyDown(event) {
        if (!this.monitoring) return;

        const key = event.key;
        
        // Track pressed keys
        this.pressedKeys.add(key);

        // Record press time for double-tap detection
        const now = Date.now();
        if (!this.keyPressTimes.has(key)) {
            this.keyPressTimes.set(key, []);
        }
        this.keyPressTimes.get(key).push(now);

        // Clean up old press times
        this._cleanupPressTimes(key, now);

        // Check for triggers
        this._checkKeyTriggers(key, event);
    }

    /**
     * Handle key up event
     */
    _handleKeyUp(event) {
        if (!this.monitoring) return;

        const key = event.key;
        
        // Remove from pressed keys
        this.pressedKeys.delete(key);

        // Clear hold timer if exists
        if (this.keyHoldTimers.has(key)) {
            clearTimeout(this.keyHoldTimers.get(key));
            this.keyHoldTimers.delete(key);
        }
    }

    /**
     * Check for key-based triggers
     */
    _checkKeyTriggers(key, event) {
        for (const trigger of this.triggers.values()) {
            if (!trigger.enabled) continue;

            // Check device if specified
            if (trigger.deviceId && !this.deviceManager.shouldProcessDeviceInput(trigger.deviceId)) {
                continue;
            }

            // Key press trigger
            if (trigger.triggerType === TriggerType.KEY_PRESS && trigger.inputName === key) {
                this._activateTrigger(trigger);
            }

            // Key combo trigger
            if (trigger.triggerType === TriggerType.KEY_COMBO && trigger.inputName === key) {
                if (this._checkModifiers(trigger.modifiers)) {
                    this._activateTrigger(trigger);
                }
            }

            // Key hold trigger
            if (trigger.triggerType === TriggerType.KEY_HOLD && trigger.inputName === key) {
                this._setupHoldTimer(trigger, key);
            }

            // Double-tap trigger
            if (trigger.triggerType === TriggerType.KEY_DOUBLE_TAP && trigger.inputName === key) {
                if (this._checkDoubleTap(key, trigger.doubleTapWindow)) {
                    this._activateTrigger(trigger);
                }
            }
        }
    }

    /**
     * Check if modifiers are pressed
     */
    _checkModifiers(modifiers) {
        for (const mod of modifiers) {
            if (!this.pressedKeys.has(mod)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Setup hold timer for a trigger
     */
    _setupHoldTimer(trigger, key) {
        // Clear existing timer
        if (this.keyHoldTimers.has(key)) {
            clearTimeout(this.keyHoldTimers.get(key));
        }

        // Set new timer
        const timer = setTimeout(() => {
            if (this.pressedKeys.has(key)) {
                this._activateTrigger(trigger);
            }
            this.keyHoldTimers.delete(key);
        }, trigger.holdDuration);

        this.keyHoldTimers.set(key, timer);
    }

    /**
     * Check for double-tap
     */
    _checkDoubleTap(key, window) {
        const times = this.keyPressTimes.get(key);
        if (!times || times.length < 2) {
            return false;
        }

        const lastTwo = times.slice(-2);
        const timeDiff = lastTwo[1] - lastTwo[0];
        return timeDiff <= window;
    }

    /**
     * Clean up old press times
     */
    _cleanupPressTimes(key, now) {
        const times = this.keyPressTimes.get(key);
        if (times) {
            // Keep only times within the last second
            const filtered = times.filter(t => now - t < 1000);
            this.keyPressTimes.set(key, filtered);
        }
    }

    /**
     * Start gamepad monitoring
     */
    _startGamepadMonitoring() {
        if (!this.gamepadInterval) {
            this.gamepadInterval = setInterval(() => {
                this._pollGamepads();
            }, 50); // Poll every 50ms
        }
    }

    /**
     * Stop gamepad monitoring
     */
    _stopGamepadMonitoring() {
        if (this.gamepadInterval) {
            clearInterval(this.gamepadInterval);
            this.gamepadInterval = null;
        }
    }

    /**
     * Poll gamepads for input
     */
    _pollGamepads() {
        if (!this.monitoring) return;

        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;

            const deviceId = `joystick_${i}`;
            
            // Check if device should be processed
            if (!this.deviceManager.shouldProcessDeviceInput(deviceId)) {
                continue;
            }

            // Check button triggers
            for (let j = 0; j < gamepad.buttons.length; j++) {
                if (gamepad.buttons[j].pressed) {
                    this._checkJoystickButtonTriggers(deviceId, j);
                }
            }

            // Check axis triggers
            for (let j = 0; j < gamepad.axes.length; j++) {
                this._checkJoystickAxisTriggers(deviceId, j, gamepad.axes[j]);
            }
        }
    }

    /**
     * Check for joystick button triggers
     */
    _checkJoystickButtonTriggers(deviceId, buttonIndex) {
        for (const trigger of this.triggers.values()) {
            if (!trigger.enabled) continue;

            if (trigger.triggerType === TriggerType.JOYSTICK_BUTTON &&
                trigger.deviceId === deviceId &&
                trigger.inputName === `Button ${buttonIndex}`) {
                this._activateTrigger(trigger);
            }
        }
    }

    /**
     * Check for joystick axis triggers
     */
    _checkJoystickAxisTriggers(deviceId, axisIndex, axisValue) {
        for (const trigger of this.triggers.values()) {
            if (!trigger.enabled) continue;

            if (trigger.triggerType === TriggerType.JOYSTICK_AXIS &&
                trigger.deviceId === deviceId &&
                trigger.inputName.includes(`Axis ${axisIndex}`)) {
                
                // Check if axis value exceeds threshold
                if (Math.abs(axisValue) >= trigger.axisThreshold) {
                    this._activateTrigger(trigger);
                }
            }
        }
    }

    /**
     * Activate a trigger (play associated macro)
     */
    _activateTrigger(trigger) {
        console.log(`Trigger activated: ${trigger.toString()}`);
        
        if (this.macroEngine) {
            this.macroEngine.playMacro(trigger.macroId);
        }
    }

    /**
     * Save triggers to JSON
     */
    toJSON() {
        const triggers = {};
        for (const [id, trigger] of this.triggers) {
            triggers[id] = trigger.toJSON();
        }
        return triggers;
    }

    /**
     * Load triggers from JSON
     */
    fromJSON(data) {
        this.triggers.clear();
        for (const [id, triggerData] of Object.entries(data)) {
            const trigger = Trigger.fromJSON(triggerData);
            this.triggers.set(trigger.triggerId, trigger);
        }
    }
}

// Export for use in renderer process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TriggerEngine, Trigger, TriggerType };
}

