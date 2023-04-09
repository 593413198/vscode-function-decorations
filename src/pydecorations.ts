
import * as vscode from 'vscode';

export class PyDecorations {

    name : string = "Plugin for python";

    rangesGlobal : vscode.DecorationOptions[] = [];

    // 是否需要标注
    needDecoration(codes: String) : boolean {
        if (codes.match(/Env\.is_client/gi)) {
            return true;
        }
        if (codes.match(/Env\.is_server/gi)) {
            return true;
        }
        return false;
    }

    // 生成指定格式的标注
    generateDecoration(text: String) : vscode.DecorationInstanceRenderOptions {
        return {
            after: {
              contentText: ` # ${text}`,
              fontWeight: 'bold',
            //   color: '#fffae2',
            //   backgroundColor: '#713879',
            //   color: '#713879', // 紫色
              color: '#ffffff',
            },
        };
    }

    // 添加标注
    insertDecoration(startIndex: number, endIndex: number, decorationText: String) : void {
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

    onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
        if (!editor?.document.fileName.match(/\\com\\/)) {
            return;
        }
        let codes = editor?.document.getText();
        if (!this.needDecoration(codes)) {
            return;
        }

        const regexGlobal = /^(\t*)if\s+Env.is_(.*):.*/gm;

        let matchLeft : RegExpExecArray | null;
        let matchRight : RegExpExecArray | null;

        let lastCode = codes.slice();

        let ans = /.*class\s+\w+.*/gm.exec(lastCode);
        lastCode = lastCode.slice(ans?.index);
        let offsetIndex: number = ans ? ans.index : 0;

        while ((matchLeft = regexGlobal.exec(lastCode)) !== null) {
            // Avoid infinite loops with zero-width matches  TODO: check
            if (matchLeft.index === regexGlobal.lastIndex) {
                regexGlobal.lastIndex++;
            }
            console.log(`Match global at Line ${1 + editor.document.positionAt(matchLeft.index + offsetIndex).line}: ${matchLeft[0]}`);

            // 替换def的结束位置: 
            // m[0] : result
            // m[1] : \s+  捕获de相同缩进
            // m[2] : client / server	捕获Env名称
            let regexIF = new RegExp(`^${matchLeft[1]}if.*`, 'gm');
            let regexELSE = new RegExp(`^${matchLeft[1]}else:.*`, 'gm');
            let regexELIF = new RegExp(`^${matchLeft[1]}elif.*`, 'gm');
            // index偏移
            lastCode = lastCode.slice(regexGlobal.lastIndex);

            // 左边开始匹配的位置: matchLeft.index
            // 开始替换的位置: regexGlobal.lastIndex
            // 结束替换的位置: matchRight.index

            if ((matchRight = regexELSE.exec(lastCode)) !== null) {
                // else:
                console.log(`else: ${matchRight[0]}`);
                lastCode = lastCode.slice(matchRight.index);
                this.insertDecoration(regexGlobal.lastIndex + offsetIndex, regexGlobal.lastIndex + matchRight.index + offsetIndex, matchLeft[2]);
            } else if ((matchRight = regexELIF.exec(lastCode)) !== null) {
                // elif ...:
                console.log(`elif: ${matchRight[0]}`);
                lastCode = lastCode.slice(matchRight.index);
                this.insertDecoration(regexGlobal.lastIndex + offsetIndex, regexGlobal.lastIndex + matchRight.index + offsetIndex, matchLeft[2]);
            } else if ((matchRight = regexIF.exec(lastCode)) !== null) {
                // if:  注意这是新的if
                console.log(`if: ${matchRight[0]}`);
                lastCode = lastCode.slice(matchRight.index);
                this.insertDecoration(regexGlobal.lastIndex + offsetIndex, regexGlobal.lastIndex + matchRight.index + offsetIndex, revertDecoration(matchLeft[2]));
            } else {
                // 收尾
                console.log(`end`);
                this.insertDecoration(regexGlobal.lastIndex + 0 + offsetIndex, regexGlobal.lastIndex + lastCode.length + offsetIndex, matchLeft[2]);
            }

            offsetIndex += regexGlobal.lastIndex;
        }

        const todoStyle = {
            isWholeLine: true,
            backgroundColor: '#264f78',
            dark: {
                // gutterIconPath: path.join(__filename, '..', '..', 'images', 'up.png')
            }
        }
        const fontColorDecorator = vscode.window.createTextEditorDecorationType(todoStyle);
        editor.setDecorations(fontColorDecorator, this.rangesGlobal);
        }
};


export const pydecoration  = new PyDecorations();