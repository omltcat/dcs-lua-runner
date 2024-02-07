# Change Log

All notable changes to the "dcs-lua-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Run current lua file on any DCS server according to address.
- Run current lua file in either mission or GUI scripting environment.
- Get mission theatre command for quick testing.
- Settings to change server address, port, web auth credentials, https.
- Display return in output window.

## [1.0.0] - 2024-01-09

### Added
- Run currently selected code via right click menu.
- Commands and buttons to quickly switch between local and remote DCS server
- Commands and buttons to quickly switch between mission and GUI environment.
- Warning for remote DCS server address not set.

### Changed
- Consolidate run code commands to different targets into one, execute based on current setting. 
- Improve output to show current runner target.

## [1.0.1] - 2024-01-10

### Changed
- Update modified dcs-fiddle-server.lua to 0.2.0.

### Fixed
- Fix link to original DCS Fiddle install instructions.

## [1.0.2] - 2024-01-16

### Fixed
- Fix buttons getting separated by other extensions.

## [1.1.0] - 2024-01-31

### Added
- Option to display return in a json side window (file), taking advantage of syntax highlighting.
- Status bar item to quickly switch between local and remote DCS server, mission and GUI environment, and open settings .

### Changed
- Quick switch buttons next to the run code button is now hidden by default, superseded by the status bar item. These buttons take up too much space, especially when displaying return in json side window mode.

## [1.1.1] - 2024-02-02

### Added
- Option to display return in Lua table format, both in side window (file) and output panel.   
(Experimental feature, please report any issue.)

### Changed
- Change default return display to file to take advantage of syntax highlight.

## [1.1.2] - 2024-02-03

### Fixed
- Fix output panel still opening when return display is set to file.

## [1.1.3] - 2024-02-04

### Fixed
- Fix JSON to Lua table regex.

## [1.1.4] - 2024-02-04

### Changed
- Config 'showQuickButtons' is now 'quickButtons' to avoid splitting other entries.
- Disable status bar button tooltip to prevent obscuring notifications.

### Fixed
- File display not showing if directory does not exist.

## [1.1.5] - 2024-02-05

### Fixed
- Fix JSON to Lua table regex with numeric keys.
