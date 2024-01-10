import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function runLua(lua: string, outputChannel: vscode.OutputChannel, filename: string = 'none') {
	const lua_base64 = Buffer.from(lua).toString('base64');
	const config = vscode.workspace.getConfiguration('dcsLuaRunner');
	const runCodeLocally = config.get('runCodeLocally') as boolean;
	const runInMissionEnv = config.get('runInMissionEnv') as boolean;
	const serverAddress = runCodeLocally ? '127.0.0.1' : config.get('serverAddress') as string;
	const serverPort = runCodeLocally ? 12080 : config.get('serverPort') as number + (runInMissionEnv ? 0 : 1);
	const useHttps = runCodeLocally ? false : config.get('useHttps') as boolean;
	const authUsername = config.get('webAuthUsername') as string;
	const authPassword = config.get('webAuthPassword') as string;
	const protocol = useHttps ? 'https' : 'http';
	const envName = runInMissionEnv ? 'Mission' : 'GUI';
	try {
		const response = await axios.get(`${protocol}://${serverAddress}:${serverPort}/${lua_base64}?env=default`, {
			auth: {
				username: authUsername,
				password: authPassword
			},
			timeout: 3000
		});

		outputChannel.show(true);
		if (response.data.hasOwnProperty('result')) {
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${envName}@${serverAddress}:${serverPort} <- ${filename}):\n${JSON.stringify(response.data.result, null, 2)}`);
		} else {
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${envName}@${serverAddress}:${serverPort} <- ${filename}):\n<NO RETURN VALUE>`);
		}
	} catch (error: any) {
		if (error.response && error.response.status === 500) {
			vscode.window.showErrorMessage('Internal server error occurred.');
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${envName}@${serverAddress}:${serverPort} <- ${filename}):\n${JSON.stringify(error.response.data.error, null, 2)}`);
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
		const serverPort = runCodeLocally ? 12080 : config.get('serverPort') as number + (runInMissionEnv ? 0 : 1);
		outputChannel.show(true);
		outputChannel.appendLine(`[DCS] Settings: Run code in ${runEnv} environment on ${runTarget} (${serverAddress}:${serverPort}).`);
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
}

export function deactivate() {}