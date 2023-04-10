
import * as vscode from 'vscode';
const { exec } = require('child_process');

export class PyDecorations {

    name : string = "Plugin for python";

    extensionPath : string = ".";

    rangesGlobal : vscode.DecorationOptions[] = [];

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

    // 是否需要标注
    needDecoration(codes: string) : boolean {
        if (codes.match(/Env\.is_client/gi)) {
            return true;
        }
        if (codes.match(/Env\.is_server/gi)) {
            return true;
        }
        return false;
    }

    // 生成指定格式的标注
    generateDecoration(text: string) : vscode.DecorationInstanceRenderOptions {
        return {
            after: {
              contentText: ` # ${text}`,
              fontWeight: 'bold',
              color: '#00ff00',
            //   backgroundColor: '#713879',
            //   color: '#713879', // 紫色
            //   color: '#ffffff',
            },
        };
    }

    // 添加标注
    insertDecoration(startIndex: number, endIndex: number, decorationText: string) : void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const codes = editor.document.getText();
        const regexDEF = /.*def\s+\w+/gm;
    
        let m;
        while ((m = regexDEF.exec(codes.slice(startIndex, endIndex))) !== null) {
            let line = editor.document.positionAt(startIndex + m.index);
            this.rangesGlobal.push({
                range: editor.document.lineAt(line).range,
                renderOptions: this.generateDecoration(decorationText),
            });
        }
    }

    // 切文件后生成标注, todo: 使用cache
    onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
        if (!editor?.document.fileName.match(/\\com\\/)) {
            return;
        }
        let codes = editor?.document.getText();
        if (!this.needDecoration(codes)) {
            return;
        }

        // hack script path
        exec(`python ${this.extensionPath}/src/pyast.py ${editor.document.fileName}`, (err: any, stdout: string, stderr: any) => {
            if (err) {
                console.log(err);
                return;
            }
            const linenos = JSON.parse(stdout);
            console.log(editor.document.fileName);
            Object.entries(linenos).forEach(ele => {
                console.log(ele);
                ele[1].forEach(line => {
                    this.rangesGlobal.push({
                        range: editor.document.lineAt(line - 1).range,
                        renderOptions: this.generateDecoration(ele[0]),
                    });
                });
            });

            const todoStyle = {
                isWholeLine: true,
                // backgroundColor: '#264f78',
                dark: {
                    // gutterIconPath: path.join(__filename, '..', '..', 'images', 'up.png')
                }
            };
            const fontColorDecorator = vscode.window.createTextEditorDecorationType({});
            editor.setDecorations(fontColorDecorator, this.rangesGlobal);
            this.rangesGlobal = [];
          });
    }
};


export const pydecoration  = new PyDecorations();