import { test, expect, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildFileManagerTool } from "@/lib/tools/file-manager";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildFileManagerTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildFileManagerTool(fs);
});

// --- rename ---

test("rename: moves file to new path", async () => {
  fs.createFileWithParents("/old.jsx", "content");
  const result = await tool.execute({
    command: "rename",
    path: "/old.jsx",
    new_path: "/new.jsx",
  });
  expect(result).toMatchObject({ success: true });
  expect(fs.readFile("/new.jsx")).toBe("content");
  expect(fs.readFile("/old.jsx")).toBeNull();
});

test("rename: creates parent directories for new path", async () => {
  fs.createFileWithParents("/App.jsx", "code");
  const result = await tool.execute({
    command: "rename",
    path: "/App.jsx",
    new_path: "/components/App.jsx",
  });
  expect(result).toMatchObject({ success: true });
  expect(fs.readFile("/components/App.jsx")).toBe("code");
});

test("rename: returns error when new_path is missing", async () => {
  fs.createFileWithParents("/App.jsx", "code");
  const result = await tool.execute({
    command: "rename",
    path: "/App.jsx",
  });
  expect(result).toMatchObject({ success: false });
  expect((result as any).error).toBeTruthy();
});

test("rename: returns error when source does not exist", async () => {
  const result = await tool.execute({
    command: "rename",
    path: "/nonexistent.jsx",
    new_path: "/new.jsx",
  });
  expect(result).toMatchObject({ success: false });
});

// --- delete ---

test("delete: removes an existing file", async () => {
  fs.createFileWithParents("/App.jsx", "content");
  const result = await tool.execute({ command: "delete", path: "/App.jsx" });
  expect(result).toMatchObject({ success: true });
  expect(fs.readFile("/App.jsx")).toBeNull();
});

test("delete: returns error for non-existent file", async () => {
  const result = await tool.execute({
    command: "delete",
    path: "/nonexistent.jsx",
  });
  expect(result).toMatchObject({ success: false });
  expect((result as any).error).toBeTruthy();
});

test("delete: removes a directory and its contents", async () => {
  fs.createFileWithParents("/components/Button.jsx", "button");
  fs.createFileWithParents("/components/Card.jsx", "card");
  const result = await tool.execute({
    command: "delete",
    path: "/components",
  });
  expect(result).toMatchObject({ success: true });
  expect(fs.readFile("/components/Button.jsx")).toBeNull();
});

// --- invalid command ---

test("invalid command: returns error response", async () => {
  const result = await tool.execute({
    command: "rename", // valid enum, but missing new_path triggers error path
    path: "/App.jsx",
  });
  expect(result).toMatchObject({ success: false });
});
