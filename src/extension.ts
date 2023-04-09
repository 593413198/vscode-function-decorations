
import * as vscode from 'vscode';
import { pydecoration } from './pydecorations';

export function activate(context: vscode.ExtensionContext) {
	vscode.window.onDidChangeActiveTextEditor(async textEditor => {
		if (textEditor) {
			if (['python',].includes(textEditor.document.languageId)) {
				pydecoration.onDidChangeActiveTextEditor(textEditor);
			}
		}
	});
}

export function deactivate() {}
