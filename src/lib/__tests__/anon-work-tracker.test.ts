import { test, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

beforeEach(() => {
  sessionStorage.clear();
});

// --- setHasAnonWork ---

test("setHasAnonWork: saves when messages exist", () => {
  setHasAnonWork([{ role: "user", content: "hello" }], {});
  expect(sessionStorage.getItem("uigen_has_anon_work")).toBe("true");
});

test("setHasAnonWork: saves when fileSystemData has more than root entry", () => {
  setHasAnonWork([], { "/": {}, "/App.jsx": { content: "x" } });
  expect(sessionStorage.getItem("uigen_has_anon_work")).toBe("true");
});

test("setHasAnonWork: does NOT save when messages empty and fileSystemData has only root", () => {
  setHasAnonWork([], { "/": {} });
  expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
});

test("setHasAnonWork: does NOT save when both are empty", () => {
  setHasAnonWork([], {});
  expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
});

test("setHasAnonWork: serializes data to sessionStorage", () => {
  const messages = [{ role: "user", content: "hi" }];
  const fileSystemData = { "/App.jsx": { content: "code" } };
  setHasAnonWork(messages, fileSystemData);
  const raw = sessionStorage.getItem("uigen_anon_data");
  expect(JSON.parse(raw!)).toEqual({ messages, fileSystemData });
});

// --- getHasAnonWork ---

test("getHasAnonWork: returns true when flag is set", () => {
  sessionStorage.setItem("uigen_has_anon_work", "true");
  expect(getHasAnonWork()).toBe(true);
});

test("getHasAnonWork: returns false when flag is absent", () => {
  expect(getHasAnonWork()).toBe(false);
});

test("getHasAnonWork: returns false for non-'true' values", () => {
  sessionStorage.setItem("uigen_has_anon_work", "1");
  expect(getHasAnonWork()).toBe(false);
});

// --- getAnonWorkData ---

test("getAnonWorkData: returns parsed data when present", () => {
  const payload = { messages: [{ role: "user" }], fileSystemData: { "/": {} } };
  sessionStorage.setItem("uigen_anon_data", JSON.stringify(payload));
  expect(getAnonWorkData()).toEqual(payload);
});

test("getAnonWorkData: returns null when key is absent", () => {
  expect(getAnonWorkData()).toBeNull();
});

test("getAnonWorkData: returns null on malformed JSON", () => {
  sessionStorage.setItem("uigen_anon_data", "{bad json");
  expect(getAnonWorkData()).toBeNull();
});

// --- clearAnonWork ---

test("clearAnonWork: removes both storage keys", () => {
  sessionStorage.setItem("uigen_has_anon_work", "true");
  sessionStorage.setItem("uigen_anon_data", "{}");
  clearAnonWork();
  expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
  expect(sessionStorage.getItem("uigen_anon_data")).toBeNull();
});

test("clearAnonWork: is safe to call when nothing is stored", () => {
  expect(() => clearAnonWork()).not.toThrow();
});
