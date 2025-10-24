# PINKMacroTool - Electron Edition

A sophisticated desktop application for creating and managing highly customizable macros with keyboard and joystick inputs. This is an Electron-based replica of the original Python/PyQt6 application.

## Features

- 🎮 **Device Support**: Automatic detection of keyboards and gamepads/joysticks
- ⚡ **Advanced Macros**: Create complex input sequences with keyboard keys, joystick buttons, and precise timing
- 🎯 **Flexible Triggers**: Configure triggers with key presses, holds, double-taps, modifier combinations, and joystick events
- 🎨 **Modern UI**: Beautiful sci-fi themed dark mode with dark blue and light blue highlights
- 💾 **System Tray**: Runs silently in the background with quick access from system tray
- 🔧 **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Note on robotjs

The `robotjs` library requires native compilation. If you encounter issues:

**Windows:**
- Install Visual Studio Build Tools
- Install Python 2.7 or 3.x

**macOS:**
- Install Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- Install build essentials: `sudo apt-get install build-essential libxtst-dev libpng++-dev`

If `robotjs` fails to install, you can remove it from `package.json` and the keyboard simulation features will be disabled.

## Usage

### Development Mode

```bash
npm start
# or
pnpm start
```

### Debug Mode

```bash
npm run dev
# or
pnpm run dev
```

### Building

Build for your current platform:

```bash
npm run build
```

Build for specific platforms:

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Application Guide

### Creating a Macro

1. Click "New" in the Macros section
2. Enter a name for your macro
3. Select a device from the left panel
4. Double-click capabilities to add them as actions
5. Use "Add Timer" to insert delays between actions
6. Set the repeat count (0 = infinite loop)
7. Click "Play" to test your macro

### Setting Up Triggers

1. Navigate to the Triggers tab
2. Click "New" to create a trigger
3. Select the trigger type (key press, hold, double-tap, etc.)
4. Choose the macro to activate
5. Configure the trigger input and conditions
6. Enable monitoring from the Monitoring menu

### System Tray

- **Show/Hide Window**: Double-click the tray icon
- **Quick Actions**: Right-click for context menu
- **Exit**: Close from tray menu

### Saving and Loading

Use the File menu to:
- Save your macros and triggers
- Load previously saved configurations
- All data is stored in JSON format in the app data directory

## Architecture

The application follows the same modular architecture as the Python version:

```
PINKMacroTool-Electron/
├── src/
│   ├── main.js              # Electron main process
│   ├── core/                # Business logic
│   │   ├── device-manager.js
│   │   ├── macro-engine.js
│   │   └── trigger-engine.js
│   ├── gui/                 # User interface
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   └── utils/               # Utilities
│       └── config-manager.js
├── assets/                  # Icons and images
└── package.json
```

## Key Differences from Python Version

### Input Handling

- **Keyboard**: Uses `robotjs` for keyboard simulation (Python used `pynput`)
- **Gamepad**: Uses browser Gamepad API (Python used `pygame`)
- **Monitoring**: Uses DOM event listeners and polling (Python used `pynput` listeners)

### UI Framework

- **Electron + HTML/CSS/JS** instead of PyQt6
- Same visual design and color scheme
- Responsive layout using CSS Flexbox

### Threading

- JavaScript async/await instead of Python threading
- Macro playback uses `setTimeout` for delays
- Input monitoring uses event listeners and intervals

## Configuration Files

All configuration files are stored in the application data directory:

- **Windows**: `%APPDATA%/pinkmacrotool-electron/`
- **macOS**: `~/Library/Application Support/pinkmacrotool-electron/`
- **Linux**: `~/.config/pinkmacrotool-electron/`

Files:
- `config.json` - Application settings
- `macros.json` - Macro definitions
- `triggers.json` - Trigger configurations

## Known Limitations

1. **Joystick Output**: The Gamepad API is read-only, so joystick output simulation is not available
2. **Global Hotkeys**: Browser-based input monitoring only works when the app has focus
3. **Platform-Specific**: Some keyboard keys may behave differently across platforms

## Troubleshooting

### robotjs Installation Issues

If robotjs fails to install:
1. Remove it from `package.json`
2. Comment out robotjs imports in `macro-engine.js`
3. Keyboard simulation will be disabled, but the rest of the app will work

### Gamepad Not Detected

1. Make sure the gamepad is connected before starting the app
2. Press buttons on the gamepad to wake it up
3. Click "Refresh Devices" in the app
4. Check browser console for errors

### App Won't Start

1. Check that Node.js version is 18.x or higher
2. Delete `node_modules` and reinstall: `npm install`
3. Run in debug mode: `npm run dev`
4. Check the console for error messages

## Development

### Project Structure

- `src/main.js` - Electron main process, handles window and system tray
- `src/core/` - Core business logic modules
- `src/gui/` - User interface (HTML, CSS, JavaScript)
- `src/utils/` - Utility modules

### Adding Features

1. Core functionality goes in `src/core/`
2. UI components go in `src/gui/`
3. Follow the existing module pattern
4. Update this README with new features

## License

MIT License - See LICENSE file for details

## Credits

This Electron version is a 1:1 replica of the original Python/PyQt6 PINKMacroTool application, maintaining the same functionality, features, and visual design.

## Support

For issues or questions, please open an issue on the project repository.

