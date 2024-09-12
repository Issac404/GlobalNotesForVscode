// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { NotesProvider, NoteItem } from "./notesProvider";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
    // 获取笔记路径
    let notesPath: string | undefined;

    // 获取vscode配置
    const notesConfig = vscode.workspace.getConfiguration("GlobalNotes");
    const directory = notesConfig.get("directory");
    const homedir = require("os").homedir();

    // 如果directory不是字符串，或者directory是空字符串，则获取用户路径
    if (typeof directory === "string" && directory !== "") {
        notesPath = directory;
    } else {
        vscode.window.showErrorMessage(
            "The 'GlobalNotes.directory' setting is not configured or is not a valid string. \n \
      We will use the default directory: 'C:\\Users\\username\\GlobalNotes'"
        );
        notesPath = path.join(homedir, "GlobalNotes");
        if (!fs.existsSync(notesPath)) {
            fs.mkdirSync(notesPath);
        }
        // 设置配置
        notesConfig.update("directory", notesPath, true);
    }

    // 注册侧边栏视图的provider
    const notesProvider = new NotesProvider(notesPath);
    vscode.window.registerTreeDataProvider("globalNotes", notesProvider);

    // 注册打开笔记的命令
    const openNote = vscode.commands.registerCommand("globalNotes.openNote", (filePath: string) => {
        const openPath = vscode.Uri.file(filePath);
        vscode.workspace.openTextDocument(openPath).then((doc) => {
            vscode.window.showTextDocument(doc);
        });
    });

    // 注册新建笔记命令
    const createNote = vscode.commands.registerCommand("globalNotes.createNote", async () => {
        const noteName = await vscode.window.showInputBox({
            placeHolder: "Enter the name of the new note",
        });
        if (noteName) {
            const filePath = path.join(notesPath, `${noteName}.md`);
            if (fs.existsSync(filePath)) {
                vscode.window.showErrorMessage(`File "${noteName}.md" already exists.`);
            } else {
                fs.writeFileSync(filePath, "# New Note\n");
                notesProvider.refresh(); // 刷新视图
                vscode.window.showInformationMessage(`Created "${noteName}.md"`);
            }
        }
    });

    // 注册删除笔记命令
    const deleteNote = vscode.commands.registerCommand("globalNotes.deleteNote", async (file_to_delete: NoteItem) => {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete this note?`,
            { modal: true },
            "Yes"
        );
        if (confirm === "Yes") {
            fs.unlinkSync(file_to_delete.filePath);
            notesProvider.refresh(); // 刷新视图
            vscode.window.showInformationMessage(`Deleted note: ${path.basename(file_to_delete.filePath)}`);
        }
    });

    context.subscriptions.push(openNote, createNote, deleteNote);
}

export function deactivate() {}
