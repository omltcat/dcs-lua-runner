import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function runLua(lua: string, outputChannel: vscode.OutputChannel, filename: string = 'none') {
	const lua_base64 = Buffer.from(lua).toString('base64');
	const config = vscode.workspace.getConfiguration('dcsLuaRunner');
	const returnDisplay = config.get('returnDisplay') === 'Output Panel (Scrolling Plain Text)' ? 'output' : 'file' as string;
	const returnDisplayFormat = config.get('returnDisplayFormat') === 'JSON' ? 'json' : 'lua' as string;
	const runCodeLocally = config.get('runCodeLocally') as boolean;
	const runInMissionEnv = config.get('runInMissionEnv') as boolean;
	const serverAddress = runCodeLocally ? '127.0.0.1' : config.get('serverAddress') as string;
	const serverPort = (runCodeLocally ? 12080 : config.get('serverPort') as number) + (runInMissionEnv ? 0 : 1);
	const useHttps = runCodeLocally ? false : config.get('useHttps') as boolean;
	const authUsername = config.get('webAuthUsername') as string;
	const authPassword = config.get('webAuthPassword') as string;
	const protocol = useHttps ? 'https' : 'http';
	const envName = runInMissionEnv ? 'Mission' : 'GUI';

	const logInfo = `${envName}@${serverAddress}:${serverPort} <- ${filename}`

	const displayOutput = async (output: Object) => {
		if (returnDisplay === 'output') {
			outputChannel.show(true);
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${logInfo}):\n${format(JSON.stringify(output, null, 4))}`);
		} else if (returnDisplay === 'file') {
			const activeEditor = vscode.window.activeTextEditor;
			const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
			const vscodeFolderPath = `${workspaceFolder}/.vscode`;
			const filePath = `${vscodeFolderPath}/dcs_lua_output.${returnDisplayFormat}`;

			// Create the .vscode directory if it doesn't exist
			if (!fs.existsSync(vscodeFolderPath)) {
				fs.mkdirSync(vscodeFolderPath);
			}
			// Create the file if it doesn't exist
			if (!fs.existsSync(filePath)) {
				fs.writeFileSync(filePath, '');
			}
		
			const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
			const viewColumn = vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn === vscode.ViewColumn.Two ? vscode.ViewColumn.Two : vscode.ViewColumn.Beside;
			const editor = await vscode.window.showTextDocument(document, viewColumn);
			await editor.edit(editBuilder => {
				editBuilder.replace(new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end), format(JSON.stringify(output, null, 4)));
			});
			await document.save();
			
			if (activeEditor) {
				vscode.window.showTextDocument(activeEditor.document, activeEditor.viewColumn);
			}
		}
	}
	const format = (jsonString: string): string => {
		if (returnDisplayFormat === 'json') {
			return jsonString;
		}
		
		let luaString = jsonString;	
		// Replace JSON syntax with Lua syntax		
		luaString = luaString.replace(/null/g, 'nil'); // Replace null with nil
		luaString = luaString.replace(/"((?:[^"\\]|\\.)+)":/g, '["$1"] ='); // Replace "key": with ["key"] =
		luaString = luaString.replace(/\["_([0-9]+)"\]\s*=/g, '[$1] ='); // Replace ["_n"] = with [n] =
		luaString = luaString.replace(/\[\]/g, '{}'); // Replace [] with {}
		luaString = luaString.replace(/\[\n/g, '{\n'); // Replace [ followed by a line break with { followed by a line break
		luaString = luaString.replace(/]\n/g, '}\n'); // Replace ] followed by a line break with } followed by a line break
		luaString = luaString.replace(/],/g, '},'); // Replace ], with }, 
		luaString = luaString.replace(/]\s*$/g, '}'); // Replace ] at the end of the string with }
	
		if (returnDisplay === 'file') {
			luaString = `return --${logInfo}\n` + luaString;
		}
		return luaString;
	}

	try {
		const response = await axios.get(`${protocol}://${serverAddress}:${serverPort}/${lua_base64}?env=default`, {
			auth: {
				username: authUsername,
				password: authPassword
			},
			timeout: 3000
		});

		if (response.data.hasOwnProperty('result')) {
			displayOutput(response.data.result);
		} else {
			displayOutput("SUCCESSFUL EXECUTION - NO RETURN VALUE");
		}
	} catch (error: any) {
		if (error.response && error.response.status === 500) {
			vscode.window.showErrorMessage('Internal server error occurred.');
			displayOutput(error.response.data.error);
		} else {
			vscode.window.showErrorMessage(`Error: ${error}`);
		}
	}
}

function getCurrentFileLua() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        if (document.languageId === 'lua') {
            const lua = document.getText();
            const filename = path.basename(document.uri.fsPath);
            return { lua, filename };
        } else {
            vscode.window.showErrorMessage('The active file is not a Lua file.');
        }
    } else {
        vscode.window.showErrorMessage('No active file.');
    }
    return null;
}

export function activate(context: vscode.ExtensionContext) {
	// context.globalState.update('firstRunDone', false);
    const isFirstRun = !context.globalState.get('firstRunDone');
	if (isFirstRun) {
        context.globalState.update('firstRunDone', true);
        const installMdPath = vscode.Uri.file(context.asAbsolutePath('INSTALL.md'));
        vscode.commands.executeCommand('markdown.showPreview', installMdPath);
    }

	const config = vscode.workspace.getConfiguration('dcsLuaRunner');
    let outputChannel = vscode.window.createOutputChannel("DCS Lua Runner");

	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.open-settings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'dcsLuaRunner');
	  }));

    context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.get-theatre', async () => {
        const lua = 'return env.mission.theatre';
        await runLua(lua, outputChannel, 'env.mission.theatre');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.run-file', async () => {
        const currentFileLua = getCurrentFileLua();
		if (currentFileLua) {
			const { lua, filename } = currentFileLua;
			await runLua(lua, outputChannel, filename);
		}
    }));

	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.run-selected', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.selection) {
			const document = editor.document;
			const selection = editor.selection;
			const lua = document.getText(selection);
			const start = selection.start.line + 1;
			const end = selection.end.line + 1;
			const lineNumbers = start === end ? start : `${start}-${end}`;
			const filename = path.basename(document.uri.fsPath) + ':' + lineNumbers;
			await runLua(lua, outputChannel, filename);
		}
	}));

	const displayRunTarget = () => {
		const config = vscode.workspace.getConfiguration('dcsLuaRunner');
		const runCodeLocally = config.get('runCodeLocally') as boolean;
		const runInMissionEnv = config.get('runInMissionEnv') as boolean;
		const runTarget = runCodeLocally ? 'local machine' : 'remote server';
		const runEnv = runInMissionEnv ? 'mission' : 'GUI';
		const serverAddress = runCodeLocally ? '127.0.0.1' : config.get('serverAddress') as string;
		const serverPort = (runCodeLocally ? 12080 : config.get('serverPort') as number) + (runInMissionEnv ? 0 : 1);
		if (config.get('returnDisplay') === 'Console Output') {
			outputChannel.show(true);
			outputChannel.appendLine(`[DCS] Settings: Run code in ${runEnv} environment on ${runTarget} (${serverAddress}:${serverPort}).`);
		} else {
			vscode.window.showInformationMessage(`Run code in ${runEnv} environment on ${serverAddress}:${serverPort}`);
		}
	};

	const updateSetting = async (setting: string, targetState: boolean) => {
		const config = vscode.workspace.getConfiguration('dcsLuaRunner');
		if (setting === 'runCodeLocally' && targetState === false && config.get('serverAddress') === '') {
			vscode.window.showErrorMessage('Remote DCS server address not set.', 'Open Settings').then((choice) => {
				if (choice === 'Open Settings') {
					vscode.commands.executeCommand('workbench.action.openSettings', 'dcsLuaRunner');
				}
			});
			await config.update(setting, true, vscode.ConfigurationTarget.Global);
			return;
		} else {
			await config.update(setting, targetState, vscode.ConfigurationTarget.Global);
			displayRunTarget();
		}
	};
	
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-local', () => updateSetting('runCodeLocally', true)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-local-button', () => updateSetting('runCodeLocally', true)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-remote', () => updateSetting('runCodeLocally', false)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-remote-button', () => updateSetting('runCodeLocally', false)));

	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-missionEnv', () => updateSetting('runInMissionEnv', true)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-missionEnv-button', () => updateSetting('runInMissionEnv', true)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-guiEnv', () => updateSetting('runInMissionEnv', false)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.set-guiEnv-button', () => updateSetting('runInMissionEnv', false)));
	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.show-setup-guide', () => {
        const installMdPath = vscode.Uri.file(context.asAbsolutePath('INSTALL.md'));
        vscode.commands.executeCommand('markdown.showPreview', installMdPath);
    }));

	// Update the 'luaFileActive' context when the active editor changes
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			vscode.commands.executeCommand('setContext', 'luaFileActive', editor.document.languageId === 'lua');
		}
	});

	// Set the 'luaFileActive' context for the current active editor
	if (vscode.window.activeTextEditor) {
		vscode.commands.executeCommand('setContext', 'luaFileActive', vscode.window.activeTextEditor.document.languageId === 'lua');
	}
    let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	// statusBarItem.tooltip = 'DCS Lua Runner: Click to change settings';
	statusBarItem.show();
	statusBarItem.command = 'extension.showQuickPick';
	context.subscriptions.push(statusBarItem);
	
	function updateStatusBarItem() {
		const config = vscode.workspace.getConfiguration('dcsLuaRunner');
		const editor = vscode.window.activeTextEditor;
		const isLuaFile = editor && editor.document.languageId === 'lua';
		const runCodeLocally = config.get('runCodeLocally') ? 'Local' : 'Remote';
		const runInMissionEnv = config.get('runInMissionEnv') ? 'Mission' : 'GUI';
	  
		if (isLuaFile) {
		  	statusBarItem.text = `DCS: ${runCodeLocally}, Env: ${runInMissionEnv}`;
		  	statusBarItem.show();
		} else {
			statusBarItem.hide();
		}
	}

	vscode.commands.registerCommand('extension.showQuickPick', () => {
		const items = [
			{ label: 'DCS Lua: Set Run Code on Local Machine', command: 'dcs-lua-runner.set-local' },
			{ label: 'DCS Lua: Set Run Code on Remote Server', command: 'dcs-lua-runner.set-remote' },
			{ label: 'DCS Lua: Set Run Code in Mission Environment', command: 'dcs-lua-runner.set-missionEnv' },
			{ label: 'DCS Lua: Set Run Code in GUI Environment', command: 'dcs-lua-runner.set-guiEnv' },
			{ label: 'DCS Lua: Open Settings', command: 'dcs-lua-runner.open-settings' },
			{ label: 'DCS Lua: Show Setup Guide', command: 'dcs-lua-runner.show-setup-guide'}
		];
		vscode.window.showQuickPick(items).then(selection => {
			// the user picked an item from the list
			if (!selection) {
				return;
			}
		
			// execute the selected command
			vscode.commands.executeCommand(selection.command);
		});
	});
	
    // Update the status bar when the configuration changes or the active text editor changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(updateStatusBarItem));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(updateStatusBarItem));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(updateStatusBarItem));
	
	updateStatusBarItem();
}

export function deactivate() {}