import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/components/Button.jsx" })).toBe("Creating Button.jsx");
});

test("getToolLabel: str_replace_editor str_replace with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("getToolLabel: str_replace_editor insert with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolLabel: str_replace_editor view with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/index.js" })).toBe("Viewing index.js");
});

test("getToolLabel: str_replace_editor create without path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: str_replace_editor unknown command falls back to editing", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx" })).toBe("Renaming old.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/components/Foo.jsx" })).toBe("Deleting Foo.jsx");
});

test("getToolLabel: file_manager delete without path", () => {
  expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

test("getToolLabel: unknown tool returns tool name", () => {
  expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
});

// --- ToolCallBadge render tests ---

test("ToolCallBadge shows friendly label for create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/components/Card.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("ToolCallBadge shows friendly label for str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/App.jsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("ToolCallBadge shows spinner when not done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows green dot when done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows friendly label for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/components/Old.jsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Deleting Old.jsx")).toBeDefined();
});
