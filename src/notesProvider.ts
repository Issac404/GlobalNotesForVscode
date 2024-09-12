import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class NotesProvider implements vscode.TreeDataProvider<NoteItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    NoteItem | undefined | null | void
  > = new vscode.EventEmitter<NoteItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    NoteItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private notesPath: string) {}

  // 刷新视图
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NoteItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NoteItem): Thenable<NoteItem[]> {
    if (!element) {
      return Promise.resolve(this.getNotesInDirectory(this.notesPath));
    }
    return Promise.resolve([]);
  }

  private getNotesInDirectory(dir: string): NoteItem[] {
    const files = fs.readdirSync(dir);
    const noteItems = files
      .filter((file) => file.endsWith(".md"))
      .map(
        (file) =>
          new NoteItem(
            path.basename(file),
            path.join(dir, file),
            vscode.TreeItemCollapsibleState.None
          )
      );
    return noteItems;
  }
}

export class NoteItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.command = {
      command: "globalNotes.openNote",
      title: "Open Note",
      arguments: [this.filePath],
    };
    this.contextValue = "noteItem"; // 用于右键菜单
  }
}
