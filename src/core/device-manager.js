/**
 * Device Manager - Handles device detection and management
 * 
 * Provides unified interface for different input device types including
 * keyboards, joysticks, and gamepads.
 */

const { v4: uuidv4 } = require('uuid');

// Device Types
const DeviceType = {
    KEYBOARD: 'keyboard',
    JOYSTICK: 'joystick',
    GAMEPAD: 'gamepad',
    HID: 'hid'
};

/**
 * Represents an input capability of a device
 */
class InputCapability {
    constructor(name, inputType, index = null, valueRange = null) {
        this.name = name;
        this.inputType = inputType; // 'key', 'button', 'axis'
        this.index = index;
        this.valueRange = valueRange; // For axes: [min, max]
    }

    toString() {
        if (this.inputType === 'axis' && this.valueRange) {
            return `${this.name} (axis ${this.index}: ${this.valueRange})`;
        } else if (this.index !== null) {
            return `${this.name} (${this.inputType} ${this.index})`;
        }
        return `${this.name} (${this.inputType})`;
    }
}

/**
 * Represents an input device
 */
class Device {
    constructor(deviceId, name, deviceType, capabilities = [], isConnected = true) {
        this.deviceId = deviceId;
        this.name = name;
        this.deviceType = deviceType;
        this.capabilities = capabilities;
        this.isConnected = isConnected;
        this.nativeObject = null;
    }

    toString() {
        return `${this.name} (${this.deviceType})`;
    }
}

/**
 * Manages input devices and their capabilities
 */
class DeviceManager {
    constructor() {
        this.devices = new Map();
        this.enabledDevices = new Map();
        this.gamepadInterval = null;
        
        this._initializeGamepadSupport();
        this._scanDevices();
    }

    /**
     * Initialize gamepad support
     */
    _initializeGamepadSupport() {
        // Listen for gamepad connections
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad);
            this._scanDevices();
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad);
            this._scanDevices();
        });

        // Start polling for gamepad state
        this._startGamepadPolling();
    }

    /**
     * Start polling for gamepad state changes
     */
    _startGamepadPolling() {
        if (!this.gamepadInterval) {
            this.gamepadInterval = setInterval(() => {
                const gamepads = navigator.getGamepads();
                // Update gamepad states if needed
            }, 100);
        }
    }

    /**
     * Scan for all available input devices
     */
    _scanDevices() {
        this.devices.clear();
        this._scanKeyboards();
        this._scanGamepads();
        
        console.log(`Found ${this.devices.size} devices`);
    }

    /**
     * Scan for keyboard devices
     */
    _scanKeyboards() {
        const keyboardId = 'keyboard_0';
        const keyboard = new Device(
            keyboardId,
            'System Keyboard',
            DeviceType.KEYBOARD,
            this._getKeyboardCapabilities()
        );
        
        this.devices.set(keyboardId, keyboard);
        this.enabledDevices.set(keyboardId, true);
        
        console.log('Added keyboard device:', keyboard.name);
    }

    /**
     * Get standard keyboard capabilities
     */
    _getKeyboardCapabilities() {
        const capabilities = [];
        
        // Letter keys
        for (let i = 65; i <= 90; i++) {
            const char = String.fromCharCode(i);
            capabilities.push(new InputCapability(char, 'key'));
        }
        
        // Number keys
        for (let i = 0; i <= 9; i++) {
            capabilities.push(new InputCapability(i.toString(), 'key'));
        }
        
        // Function keys
        for (let i = 1; i <= 12; i++) {
            capabilities.push(new InputCapability(`F${i}`, 'key'));
        }
        
        // Special keys
        const specialKeys = [
            'Space', 'Enter', 'Tab', 'Shift', 'Control', 'Alt',
            'Escape', 'Backspace', 'Delete', 'Insert', 'Home', 'End',
            'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'PrintScreen', 'ScrollLock',
            'Pause', 'CapsLock', 'NumLock', 'Meta'
        ];
        
        specialKeys.forEach(key => {
            capabilities.push(new InputCapability(key, 'key'));
        });
        
        // Numpad keys
        for (let i = 0; i <= 9; i++) {
            capabilities.push(new InputCapability(`Numpad${i}`, 'key'));
        }
        
        const numpadSpecial = [
            'NumpadAdd', 'NumpadSubtract', 'NumpadMultiply', 'NumpadDivide',
            'NumpadEnter', 'NumpadDecimal'
        ];
        
        numpadSpecial.forEach(key => {
            capabilities.push(new InputCapability(key, 'key'));
        });
        
        return capabilities;
    }

    /**
     * Scan for gamepad/joystick devices
     */
    _scanGamepads() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                const deviceId = `joystick_${i}`;
                const device = new Device(
                    deviceId,
                    gamepad.id || `Joystick ${i}`,
                    DeviceType.JOYSTICK,
                    this._getGamepadCapabilities(gamepad)
                );
                device.nativeObject = gamepad;
                
                this.devices.set(deviceId, device);
                this.enabledDevices.set(deviceId, true);
                
                console.log('Added joystick:', device.name);
            }
        }
    }

    /**
     * Get capabilities for a specific gamepad
     */
    _getGamepadCapabilities(gamepad) {
        const capabilities = [];
        
        // Buttons
        for (let i = 0; i < gamepad.buttons.length; i++) {
            capabilities.push(new InputCapability(
                `Button ${i}`,
                'button',
                i
            ));
        }
        
        // Axes
        const axisNames = [
            'Left Stick X',
            'Left Stick Y',
            'Right Stick X',
            'Right Stick Y',
            'Left Trigger',
            'Right Trigger'
        ];
        
        for (let i = 0; i < gamepad.axes.length; i++) {
            const name = axisNames[i] || `Axis ${i}`;
            capabilities.push(new InputCapability(
                name,
                'axis',
                i,
                [-1.0, 1.0]
            ));
        }
        
        return capabilities;
    }

    /**
     * Refresh the device list
     */
    refreshDevices() {
        console.log('Refreshing device list...');
        this._scanDevices();
    }

    /**
     * Get all detected devices
     */
    getAllDevices() {
        return Array.from(this.devices.values());
    }

    /**
     * Get devices of a specific type
     */
    getDevicesByType(deviceType) {
        return this.getAllDevices().filter(device => device.deviceType === deviceType);
    }

    /**
     * Get a device by its ID
     */
    getDeviceById(deviceId) {
        return this.devices.get(deviceId);
    }

    /**
     * Get capabilities for a specific device
     */
    getDeviceCapabilities(deviceId) {
        const device = this.getDeviceById(deviceId);
        return device ? device.capabilities : [];
    }

    /**
     * Enable or disable a device
     */
    setDeviceEnabled(deviceId, enabled) {
        if (this.devices.has(deviceId)) {
            this.enabledDevices.set(deviceId, enabled);
            console.log(`Device ${deviceId} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Check if a device is enabled
     */
    isDeviceEnabled(deviceId) {
        return this.enabledDevices.get(deviceId) || false;
    }

    /**
     * Check if a device is connected
     */
    isDeviceConnected(deviceId) {
        const device = this.getDeviceById(deviceId);
        if (!device) return false;
        
        // For joysticks, check if still in gamepad list
        if (device.deviceType === DeviceType.JOYSTICK) {
            const gamepads = navigator.getGamepads();
            const index = parseInt(deviceId.split('_')[1]);
            return gamepads[index] !== null;
        }
        
        // For keyboards, assume always connected
        return device.deviceType === DeviceType.KEYBOARD;
    }

    /**
     * Check if input from a device should be processed
     */
    shouldProcessDeviceInput(deviceId) {
        return this.isDeviceConnected(deviceId) && this.isDeviceEnabled(deviceId);
    }

    /**
     * Clean up resources
     */
    cleanup() {
        console.log('Cleaning up device manager');
        if (this.gamepadInterval) {
            clearInterval(this.gamepadInterval);
            this.gamepadInterval = null;
        }
    }
}

// Export for use in renderer process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeviceManager, Device, InputCapability, DeviceType };
}

