
import * as vscode from 'vscode';
import { exec } from 'child_process';

export class PyDecorations {

    name : string = "Plugin for python";

    extensionPath : string = ".";

    rangesGlobal : vscode.DecorationOptions[] = [];
    decoratesGlobal : vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});

    colorConfigs : any = {
        'is_client' : '#00CC66',
        'is_server' : '#FF6600',
    };

    initExtensionPath(path: string) : void {
        this.extensionPath = path;
    }

    initDefaultEditor() : void {

        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return;
        }
        this.onDidChangeActiveTextEditor(editor);
    }

    // 生成指定格式的标注
    generateDecoration(text: string) : vscode.DecorationInstanceRenderOptions {
        return {
            after: {
                contentText: ` # ${text}`,
                fontWeight: 'bold',
                color : this.colorConfigs[text],
            },
        };
    }

    // 切文件后生成标注, todo: 使用cache
    onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
        if (!editor?.document.fileName.match(/\\com\\/)) {
            return;
        }

        // hack script path
        exec(`python ${this.extensionPath}/src/pyast.py ${editor.document.fileName}`, (err: any, stdout: string, stderr: any) => {
            if (err) {
                console.log(err);
                return;
            }
            const linenos = JSON.parse(stdout);
            Object.entries(linenos).forEach(ele => {
                ele[1].forEach(line => {
                    this.rangesGlobal.push({
                        range: editor.document.lineAt(line - 1).range,
                        renderOptions: this.generateDecoration(ele[0]),
                    });
                });
            });

            const fontColorDecorator = vscode.window.createTextEditorDecorationType({});
            editor.setDecorations(this.decoratesGlobal, this.rangesGlobal);
            this.rangesGlobal = [];
          });
    }
};


export const pydecoration  = new PyDecorations();