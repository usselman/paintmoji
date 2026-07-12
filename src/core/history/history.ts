export type Command<T> = { label: string; before: T; after: T; bytes?: number };
export class History<T> {
  private undoStack: Command<T>[] = [];
  private redoStack: Command<T>[] = [];
  constructor(private readonly max = 80) {}
  push(command: Command<T>) {
    this.undoStack.push(command);
    this.undoStack = this.undoStack.slice(-this.max);
    this.redoStack = [];
  }
  undo(current: T) {
    const c = this.undoStack.pop();
    if (!c) return current;
    this.redoStack.push(c);
    return c.before;
  }
  redo(current: T) {
    const c = this.redoStack.pop();
    if (!c) return current;
    this.undoStack.push(c);
    return c.after;
  }
  get status() {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
      bytes: [...this.undoStack, ...this.redoStack].reduce(
        (n, c) => n + (c.bytes ?? 0),
        0,
      ),
    };
  }
}
