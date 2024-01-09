import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function runLua(lua: string, outputChannel: vscode.OutputChannel, filename: string = 'none', portOffset: boolean = false) {
	const lua_base64 = Buffer.from(lua).toString('base64');
	const config = vscode.workspace.getConfiguration('dcsLuaRunner');
	const serverAddress = config.get('serverAddress') as string;
	const serverPort = config.get('serverPort') as number + (portOffset ? 1 : 0);
	const useHttps = config.get('useHttps') as boolean;
	const authUsername = config.get('webAuthUsername') as string;
	const authPassword = config.get('webAuthPassword') as string;
	const protocol = useHttps ? 'https' : 'http';
	const prefix = portOffset ? 'Hooks' : 'Mission';
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
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${filename} > ${prefix}):\n${JSON.stringify(response.data.result, null, 2)}`);
		} else {
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${filename} > ${prefix}):\nResult not found in response.`);
		}
	} catch (error: any) {
		if (error.response && error.response.status === 500) {
			vscode.window.showErrorMessage('Internal server error occurred.');
			outputChannel.appendLine(`[DCS] ${new Date().toLocaleString()} (${filename} > ${prefix}):\n${JSON.stringify(error.response.data.error, null, 2)}`);
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
    let outputChannel = vscode.window.createOutputChannel("DCS Return");

    context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.get-theatre', async () => {
        const lua = 'return env.mission.theatre';
        await runLua(lua, outputChannel, 'env.mission.theatre');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.run-file-mission', async () => {
        const currentFileLua = getCurrentFileLua();
		if (currentFileLua) {
			const { lua, filename } = currentFileLua;
			await runLua(lua, outputChannel, filename);
		}
    }));

	context.subscriptions.push(vscode.commands.registerCommand('dcs-lua-runner.run-file-hooks', async () => {
        const currentFileLua = getCurrentFileLua();
		if (currentFileLua) {
			const { lua, filename } = currentFileLua;
			await runLua(lua, outputChannel, filename, true);
		}
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
}

export function deactivate() {}