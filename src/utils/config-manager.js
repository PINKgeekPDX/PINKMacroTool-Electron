/**
 * Config Manager - Manages application configuration and persistence
 * 
 * Handles storage and retrieval of:
 * - Application settings
 * - Window state
 * - Macro definitions
 * - Trigger configurations
 */

const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

class ConfigManager {
    constructor() {
        this.config = {
            window: {
                x: 100,
                y: 100,
                width: 1200,
                height: 800,
                startMinimized: true
            },
            monitoring: {
                autoStart: false
            },
            paths: {
                macrosFile: 'macros.json',
                triggersFile: 'triggers.json',
                configFile: 'config.json'
            }
        };
        
        this.appDataPath = null;
        this._initPaths();
    }

    /**
     * Initialize application data paths
     */
    async _initPaths() {
        try {
            this.appDataPath = await ipcRenderer.invoke('get-app-path');
            console.log('App data path:', this.appDataPath);
            
            // Update paths to use app data directory
            this.config.paths.macrosFile = path.join(this.appDataPath, 'macros.json');
            this.config.paths.triggersFile = path.join(this.appDataPath, 'triggers.json');
            this.config.paths.configFile = path.join(this.appDataPath, 'config.json');
            
            // Load existing config if available
            this.load();
        } catch (error) {
            console.error('Error initializing paths:', error);
        }
    }

    /**
     * Get a configuration value
     */
    get(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Set a configuration value
     */
    set(key, value) {
        const keys = key.split('.');
        let obj = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }
        
        obj[keys[keys.length - 1]] = value;
    }

    /**
     * Save configuration to file
     */
    save() {
        try {
            const configPath = this.config.paths.configFile;
            const configData = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(configPath, configData, 'utf8');
            console.log('Configuration saved to:', configPath);
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    }

    /**
     * Load configuration from file
     */
    load() {
        try {
            const configPath = this.config.paths.configFile;
            
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                const loadedConfig = JSON.parse(configData);
                
                // Merge with default config
                this.config = { ...this.config, ...loadedConfig };
                console.log('Configuration loaded from:', configPath);
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    /**
     * Save macros to file
     */
    saveMacros(macroEngine) {
        try {
            const macrosPath = this.config.paths.macrosFile;
            const macrosData = JSON.stringify(macroEngine.toJSON(), null, 2);
            fs.writeFileSync(macrosPath, macrosData, 'utf8');
            console.log('Macros saved to:', macrosPath);
        } catch (error) {
            console.error('Error saving macros:', error);
            throw error;
        }
    }

    /**
     * Load macros from file
     */
    loadMacros(macroEngine) {
        try {
            const macrosPath = this.config.paths.macrosFile;
            
            if (fs.existsSync(macrosPath)) {
                const macrosData = fs.readFileSync(macrosPath, 'utf8');
                const macros = JSON.parse(macrosData);
                macroEngine.fromJSON(macros);
                console.log('Macros loaded from:', macrosPath);
            }
        } catch (error) {
            console.error('Error loading macros:', error);
            throw error;
        }
    }

    /**
     * Save triggers to file
     */
    saveTriggers(triggerEngine) {
        try {
            const triggersPath = this.config.paths.triggersFile;
            const triggersData = JSON.stringify(triggerEngine.toJSON(), null, 2);
            fs.writeFileSync(triggersPath, triggersData, 'utf8');
            console.log('Triggers saved to:', triggersPath);
        } catch (error) {
            console.error('Error saving triggers:', error);
            throw error;
        }
    }

    /**
     * Load triggers from file
     */
    loadTriggers(triggerEngine) {
        try {
            const triggersPath = this.config.paths.triggersFile;
            
            if (fs.existsSync(triggersPath)) {
                const triggersData = fs.readFileSync(triggersPath, 'utf8');
                const triggers = JSON.parse(triggersData);
                triggerEngine.fromJSON(triggers);
                console.log('Triggers loaded from:', triggersPath);
            }
        } catch (error) {
            console.error('Error loading triggers:', error);
            throw error;
        }
    }

    /**
     * Get macros file path
     */
    getMacrosFilePath() {
        return this.config.paths.macrosFile;
    }

    /**
     * Get triggers file path
     */
    getTriggersFilePath() {
        return this.config.paths.triggersFile;
    }

    /**
     * Check if macros file exists
     */
    macrosFileExists() {
        return fs.existsSync(this.config.paths.macrosFile);
    }

    /**
     * Check if triggers file exists
     */
    triggersFileExists() {
        return fs.existsSync(this.config.paths.triggersFile);
    }
}

// Export for use in renderer process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager };
}

