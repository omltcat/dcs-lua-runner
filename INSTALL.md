# DCS Lua Runner Setup
> This guide only shows automatically once.  
> You can open it anytime with command pallet "DCS Lua: Show Setup Guide".

**You need to setup the DCS Fiddle script before using this extension.**

We use a modified version of the DCS Fiddle script that adds optional authentication for remote access.  
It is still compatible with the [DCS Fiddle website](https://dcsfiddle.pages.dev/).

- If you find this extension useful, please star it on [**GitHub**](https://github.com/omltcat/dcs-lua-runner)
- Don't hesitate to report any problems, provide segguestions or request features using [**Issues**](https://github.com/omltcat/dcs-lua-runner/issues).

## Hook Script
1. Download [**dcs-fiddle-server.lua**](https://github.com/omltcat/dcs-snippets/blob/master/Scripts/Hooks/dcs-fiddle-server.lua).
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


It is highly recommended that you also set up the basic authentication, otherwise anyone can inject lua code into your server. For best security, also put the FIDDLE PORT behind a reverse proxy with HTTPS (see [below](#reverse-proxy)).

```lua
FIDDLE.PORT = 12080         -- keep this at 12080 if you also want to use the DCS Fiddle website.
FIDDLE.BIND_IP = '0.0.0.0'  -- Use '0.0.0.0' for remote access, default is '127.0.0.1'
FIDDLE.AUTH = true          -- set to true to enable basic auth, recommended for public servers.
FIDDLE.USERNAME = 'username'    -- set your username
FIDDLE.PASSWORD = 'password'    -- set your password
FIDDLE.BYPASS_LOCAL = true  -- allow requests to 127.0.0.1:12080 without auth.
-- This local bypass allows DCS Fiddle website to still work. 
-- It uses host header to determine if the request is local.
-- This is not the most secure method and can be spoofed, so use at your own risk.
-- Use a reverse proxy for best security.
```
#### VS Code Settings
Open command pallette (`Ctrl`+`Shift`+`P`) and type `DCS Lua: Open Runner Settings`.  
You need to set:
- Server Address: IP of the DCS server
- Web Auth Username: same as `FIDDLE.USERNAME`
- Web Auth Password: same as `FIDDLE.PASSWORD`

### Reverse Proxy
The `dcs-fiddle-server.lua` script separates mission/GUI environment based on ports. By default the GUI env is automatically on the next port of mission env (12080-12081). When using a HTTPS reverse proxy, you can map the two ports to different subdomains, e.g.:

```
https://fiddle.example.com/     ->  http://dcs-server-ip:12080/
https://fiddle-gui.example.com/ ->  http://dcs-server-ip:12081/
```

In VS Code - DCS Lua Runner Settings, set the following accordingly:
- Server Address: `fiddle.example.com`
- Server Address GUI: `fiddle-gui.example.com`
- Server Port: `443`
- Server Port GUI: `443`
- Use Https: `true`
- Web Auth Username: same as `FIDDLE.USERNAME`
- Web Auth Password: same as `FIDDLE.PASSWORD`

## Credits
All credits of this scripts and its API implementations go to the original authors [JonathanTurnock](https://github.com/JonathanTurnock) and [john681611](https://github.com/john681611).  
Under MIT License, see [dcsfiddle](https://github.com/JonathanTurnock/dcsfiddle?tab=MIT-1-ov-file).
