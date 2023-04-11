
import * as vscode from 'vscode';
import { exec } from 'child_process';

export class PyDecorations {

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

    isFileNeedDecoration(filePath: string) : boolean {
        if (filePath.match(/\\cdata\\|const|gmcmd/i)) {
            return false;
        }
        return filePath.match(/\\com\\/i) !== null;
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

    // 切文件后生成标注
    onDidChangeActiveTextEditor(editor: vscode.TextEditor) {

        if (!this.isFileNeedDecoration(editor.document.fileName)) {
            return;
        }

        // hack script path
        // 拿到pyast解析的函数行号

        exec(`python ${this.extensionPath}/src/pyast.py ${editor.document.fileName}`, (err: any, stdout: string) => {
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

            editor.setDecorations(this.decoratesGlobal, this.rangesGlobal);
            this.rangesGlobal = [];
          });
    }
};


export const pydecoration  = new PyDecorations();