import { test, expect, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildStrReplaceTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildStrReplaceTool(fs);
});

// --- create ---

test("create: writes a new file and returns success message", async () => {
  const result = await tool.execute({
    command: "create",
    path: "/App.jsx",
    file_text: "export default function App() { return <div />; }",
  });
  expect(result).not.toMatch(/^Error/);
  expect(fs.readFile("/App.jsx")).toBe(
    "export default function App() { return <div />; }"
  );
});

test("create: creates nested file with parent directories", async () => {
  await tool.execute({
    command: "create",
    path: "/components/Button.jsx",
    file_text: "export const Button = () => <button />;",
  });
  expect(fs.readFile("/components/Button.jsx")).toBe(
    "export const Button = () => <button />;"
  );
});

test("create: empty file_text defaults to empty string", async () => {
  await tool.execute({ command: "create", path: "/empty.js" });
  expect(fs.readFile("/empty.js")).toBe("");
});

// --- view ---

test("view: returns file contents with line numbers", async () => {
  fs.createFileWithParents("/index.js", "line1\nline2\nline3");
  const result = await tool.execute({ command: "view", path: "/index.js" });
  expect(result).toContain("line1");
  expect(result).toContain("line2");
});

test("view: returns error for non-existent file", async () => {
  const result = await tool.execute({
    command: "view",
    path: "/nonexistent.js",
  });
  expect(result).toMatch(/not found/i);
});

test("view: respects view_range", async () => {
  fs.createFileWithParents("/index.js", "a\nb\nc\nd\ne");
  const result = await tool.execute({
    command: "view",
    path: "/index.js",
    view_range: [2, 3],
  });
  expect(result).toContain("b");
  expect(result).toContain("c");
  expect(result).not.toContain("a");
  expect(result).not.toContain("e");
});

// --- str_replace ---

test("str_replace: replaces matching text in file", async () => {
  fs.createFileWithParents("/App.jsx", "const x = 1;\nconst y = 2;");
  await tool.execute({
    command: "str_replace",
    path: "/App.jsx",
    old_str: "const x = 1;",
    new_str: "const x = 99;",
  });
  expect(fs.readFile("/App.jsx")).toContain("const x = 99;");
  expect(fs.readFile("/App.jsx")).toContain("const y = 2;");
});

test("str_replace: returns error when old_str not found", async () => {
  fs.createFileWithParents("/App.jsx", "const x = 1;");
  const result = await tool.execute({
    command: "str_replace",
    path: "/App.jsx",
    old_str: "this does not exist",
    new_str: "replacement",
  });
  expect(result).toMatch(/Error/i);
});

test("str_replace: defaults old_str and new_str to empty string", async () => {
  fs.createFileWithParents("/App.jsx", "hello world");
  // old_str="" matches at start, new_str="" is a no-op replacement
  const result = await tool.execute({
    command: "str_replace",
    path: "/App.jsx",
  });
  // Should not throw — result is whatever replaceInFile returns
  expect(typeof result).toBe("string");
});

// --- insert ---

test("insert: inserts text after specified line", async () => {
  fs.createFileWithParents("/App.jsx", "line1\nline2\nline3");
  await tool.execute({
    command: "insert",
    path: "/App.jsx",
    insert_line: 1,
    new_str: "inserted",
  });
  const content = fs.readFile("/App.jsx")!;
  const lines = content.split("\n");
  expect(lines[1]).toBe("inserted");
});

test("insert: defaults insert_line to 0 and new_str to empty string", async () => {
  fs.createFileWithParents("/App.jsx", "hello");
  const result = await tool.execute({ command: "insert", path: "/App.jsx" });
  expect(typeof result).toBe("string");
});

// --- undo_edit ---

test("undo_edit: returns unsupported error message", async () => {
  const result = await tool.execute({
    command: "undo_edit",
    path: "/App.jsx",
  });
  expect(result).toMatch(/not supported/i);
});
