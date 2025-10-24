# PINKMacroTool Electron - Setup Guide

## Quick Start

This guide will help you set up and run the Electron version of PINKMacroTool.

## Prerequisites

- **Node.js**: Version 18.x or higher
- **npm** or **pnpm**: Package manager (comes with Node.js)

## Installation Steps

### 1. Install Dependencies

```bash
cd PINKMacroTool-Electron
npm install --no-optional
```

This will install all required dependencies except robotjs (which requires native compilation).

### 2. Run the Application

```bash
npm start
```

The application will start and appear in your system tray.

### 3. Optional: Enable Keyboard Simulation

If you want full keyboard/mouse simulation capabilities, you need to install robotjs. This requires build tools:

**On Linux (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential libxtst-dev libpng++-dev
npm install robotjs
```

**On macOS:**
```bash
xcode-select --install
npm install robotjs
```

**On Windows:**
- Install Visual Studio Build Tools
- Install Python 2.7 or 3.x
- Then run: `npm install robotjs`

## Project Structure

```
PINKMacroTool-Electron/
├── src/
│   ├── main.js                    # Electron main process
│   ├── core/                      # Core business logic
│   │   ├── device-manager.js      # Device detection and management
│   │   ├── macro-engine.js        # Macro creation and execution
│   │   └── trigger-engine.js      # Trigger monitoring
│   ├── gui/                       # User interface
│   │   ├── index.html             # Main HTML structure
│   │   ├── styles.css             # Sci-fi dark theme styling
│   │   └── app.js                 # UI logic and event handling
│   └── utils/
│       └── config-manager.js      # Configuration persistence
├── assets/                        # Icons and images
├── package.json                   # Project configuration
└── README.md                      # Documentation
```

## Features Implemented

### ✅ Core Features

- **Device Management**: Automatic detection of keyboards and gamepads
- **Macro Creation**: Create complex action sequences
- **Trigger System**: Configure triggers for automatic macro activation
- **System Tray**: Background operation with tray icon
- **Data Persistence**: Save/load macros and triggers to JSON files
- **Modern UI**: Sci-fi dark theme matching the original Python app

### ✅ Action Types

- Keyboard key press
- Keyboard hold/release
- Timer delays
- Mouse click (requires robotjs)
- Mouse move (requires robotjs)
- Joystick button detection (read-only)

### ✅ Trigger Types

- Key press
- Key hold
- Key double-tap
- Key combinations (with modifiers)
- Joystick button press
- Joystick axis threshold

## Configuration Files

All data is stored in the application data directory:

- **Linux**: `~/.config/pinkmacrotool-electron/`
- **macOS**: `~/Library/Application Support/pinkmacrotool-electron/`
- **Windows**: `%APPDATA%/pinkmacrotool-electron/`

Files created:
- `config.json` - Application settings
- `macros.json` - Macro definitions
- `triggers.json` - Trigger configurations

## Usage Guide

### Creating Your First Macro

1. Start the application
2. Click "New" in the Macros section
3. Enter a name (e.g., "Test Macro")
4. Select "System Keyboard" from the device list
5. Double-click on capabilities (e.g., "A", "Space") to add them
6. Click "Add Timer" to insert delays (e.g., 100ms)
7. Set repeat count (5 for testing)
8. Click "Play" to execute

### Setting Up a Trigger

1. Switch to the "Triggers" tab
2. Click "New" to create a trigger
3. The trigger will be created with default settings
4. Use the Monitoring menu to start monitoring
5. Press the configured key to activate the macro

### Saving Your Work

1. Click on "File" in the menu bar
2. Type "1" for Save
3. Your macros and triggers are saved to JSON files

## Keyboard Shortcuts

- **Ctrl+S**: Save configuration (via menu)
- **Ctrl+O**: Load configuration (via menu)
- **F5**: Refresh devices (via menu)

## Troubleshooting

### Application Won't Start

1. Check Node.js version: `node --version` (should be 18.x+)
2. Reinstall dependencies: `rm -rf node_modules && npm install --no-optional`
3. Check console for errors

### Gamepad Not Detected

1. Connect gamepad before starting the app
2. Press buttons to activate the gamepad
3. Click "Refresh Devices"
4. Check browser gamepad support: Open DevTools (F12) and check console

### Keyboard Actions Don't Work

This is expected if robotjs is not installed. The app will log warnings to the console. To enable:
1. Install build tools for your platform (see above)
2. Run `npm install robotjs`
3. Restart the application

### Triggers Not Firing

1. Make sure monitoring is started (Monitoring menu)
2. Check that the device is enabled (checkbox in device list)
3. Verify the trigger configuration matches your input
4. Note: The app must have focus for keyboard events to be captured

## Development

### Running in Debug Mode

```bash
npm run dev
```

This opens DevTools automatically for debugging.

### Building for Distribution

```bash
npm run build        # Build for current platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Built applications will be in the `dist/` directory.

## Known Limitations

1. **Joystick Output**: Browser Gamepad API is read-only, cannot simulate joystick output
2. **Global Hotkeys**: Keyboard monitoring only works when app has focus (browser limitation)
3. **robotjs**: Requires native compilation, may not work on all systems
4. **Platform Differences**: Some keys may behave differently across operating systems

## Comparison with Python Version

| Feature | Python Version | Electron Version |
|---------|---------------|------------------|
| Device Detection | ✅ Full | ✅ Full |
| Keyboard Input | ✅ pynput | ✅ DOM Events |
| Keyboard Output | ✅ pynput | ⚠️ robotjs (optional) |
| Joystick Input | ✅ pygame | ✅ Gamepad API |
| Joystick Output | ✅ pygame | ❌ Not available |
| System Tray | ✅ | ✅ |
| UI Theme | ✅ PyQt6 | ✅ HTML/CSS |
| Cross-Platform | ✅ | ✅ |
| Global Hotkeys | ✅ | ⚠️ Limited |

## Next Steps

1. **Test the Application**: Create a simple macro and verify it works
2. **Explore Features**: Try different trigger types and macro actions
3. **Customize**: Modify the CSS to change colors or layout
4. **Extend**: Add new features by modifying the core modules

## Support

For issues or questions:
1. Check the main README.md
2. Review console logs (F12 in the app)
3. Check the GitHub repository for updates

## License

MIT License - Same as the original Python version

