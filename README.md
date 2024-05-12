# DCS Lua Runner

A VS Code extension to run lua code in DCS World (on local or remote server, in mission or GUI environment). A reimplementation of the  [DCS Fiddle](https://github.com/JonathanTurnock/dcsfiddle) web lua console. Allows for quick development and debugging of running scripted missions directly from the comfort of VS Code.

- If you find this extension useful, please star it on [**GitHub**](https://github.com/omltcat/dcs-lua-runner)
- Don't hesitate to report any problems, provide segguestions or request features using [**Issues**](https://github.com/omltcat/dcs-lua-runner/issues).

![Demo1](docs/img/demo1-new.png)

![Demo2-1](docs/img/demo2-1.png)  
![Demo2-2](docs/img/demo2-2.png)

## Features
- Send whole Lua file or just selected portion of code.
- Execute on local DCS instance or remote DCS server (more details below).
- Execute in mission or GUI scripting environment.
- Display return value in output panel or as a file (for syntax highlight)
    - in either JSON or Lua table format.

## Installation
See [**INSTALL.md**](INSTALL.md).  
**YOU MUST SETUP THE DCS SCRIPT FOR THIS EXTENSION TO WORK.**
## Extension Settings

This extension has the following settings:

- `serverAddress`: Remote DCS server address. It can be an IP address or a domain.

- `serverAddressGUI`: Override remote DCS server address for GUI environment.

- `serverPort`: Port of the remote DCS Fiddle. Default is `12080`.

- `serverPortGUI`: Override port of the remote DCS Fiddle for GUI environment.

- `useHttps`: Specifies whether the server is behind a HTTPS reverse proxy.   
If this is set to `true`, you should also change the `dcsLuaRunner.serverPort` to `443`.   
Default is `false`.

- `webAuthUsername`: Specifies the username for authentication.   
**Requires the modified DCS Fiddle script.**

- `webAuthPassword`: Specifies the password for authentication.   
**Requires the modified DCS Fiddle script.**

- `runCodeLocally`: Whether to send code to `127.0.0.1:12080` or to the remote server set in `dcsLuaRunner.serverAddress` and `dcsLuaRunner.serverPort`.   
This setting can be quickly changed with the buttons on the upper-right of a lua file.

- `runInMissionEnv`: Specifies whether to execute in mission or GUI Scripting Environment.  
This setting can be quickly changed with the buttons on the upper-right of a lua file.

- `returnDisplay`: Wether to use output panel or file (which supports syntax highlight) to display return value.

- `returnDisplayFormat`: Display return value as JSON or Lua table. (Experimental feature, please report any issue.)

## Release Notes

See [**changelog**](CHANGELOG.md).


## Credits
All credits of this scripts and its API implementations go to the original authors [JonathanTurnock](https://github.com/JonathanTurnock) and [john681611](https://github.com/john681611).  
Under MIT License, see [dcsfiddle](https://github.com/JonathanTurnock/dcsfiddle?tab=MIT-1-ov-file).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.