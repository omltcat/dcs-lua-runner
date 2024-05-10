# DCS Lua Runner Setup
> This guide only shows automatically once.  
> You can open it anytime with command pallet "DCS Lua: Show Setup Guide".

**You need to setup the DCS Fiddle script before using this extension.**

We use a modified version of the DCS Fiddle script that adds optional authentication for remote access.  
It is still compatible with the [DCS Fiddle website](https://dcsfiddle.pages.dev/).

- If you find this extension useful, please star it on [**GitHub**](https://github.com/omltcat/dcs-lua-runner)
- Don't hesitate to report any problems, provide segguestions or request features using [**Issues**](https://github.com/omltcat/dcs-lua-runner/issues).

## Hook Script
1. Download [**dcs-fiddle-server.lua**](https://github.com/omltcat/dcs-lua-runner/blob/master/src/hooks/dcs-fiddle-server.lua).
2. Save to `%USERPROFILE%\Saved Games\<DCS VERSION>\Scripts\Hooks`.
    - Generally this means `C:\Users\<USERNAME>\Saved Games`
    - `<DCS VERSION>` could be `DCS`, `DCS.openbeta`, `DCS.release_server`, etc.
    - Create the `Scripts\Hooks` folder if it doesn't exist.

> **IMPORTANT:**  
The provided script is based on an earlier version that uses a custom JSON serialization module instead of the new DCS built-in json functions. To allow the extension to properly reconstruct the in-game Lua table, you should use the provided script.

See [**Remote Access**](#remote-access) below if you want to run code on a remote DCS server.

## De-sanitize Mission Scripting
1. Go to your **DCS installation folder** (not Saved Games).
2. Open `...\Scripts\MissionScripting.lua`.
3. Find and comment out `'require'` and `'package'` lines

```diff
do
    sanitizeModule('os')
    sanitizeModule('io')
    sanitizeModule('lfs')
+   -- _G['require'] = nil
    _G['loadlib'] = nil
+   -- _G['package'] = nil
end
```

## Remote Access

### Script Configuration
If you want to run code on a remote DCS server, you need to expose the FIDDLE PORT to 0.0.0.0 by modifying the beginning of the `dcs-fiddle-server.lua` file. 

It is highly recommended that you also set up the basic authentication, otherwise anyone can inject lua code into your server. For best security, also put the FIDDLE PORT behind a reverse proxy with HTTPS.

```lua
-- Configs:
FIDDLE.PORT = 12080         -- keep this at 12080 if you also want to use the DCS Fiddle website.
FIDDLE.BIND_IP = '0.0.0.0'  -- for remote access
FIDDLE.AUTH = true          -- set to true to enable basic auth, recommended for public servers.
FIDDLE.USERNAME = 'username'
FIDDLE.PASSWORD = 'password'
FIDDLE.BYPASS_LOCAL = true  -- allow requests to 127.0.0.1:12080 without auth.
--- So DCS Fiddle website can still work. 
--- (Not a very secure implementation. Use at your own risk if your 12080 port is public)
```

### VS Code Settings
1. In VS Code, open command pallette (`Ctrl`+`Shift`+`P`) and type `DCS Lua: Open Runner Settings`.
2. Set server address, port, username, and password accordingly.

## Credits
All credits of this scripts and its API implementations go to the original authors [JonathanTurnock](https://github.com/JonathanTurnock) and [john681611](https://github.com/john681611).
