import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignInAction(...args),
  signUp: (...args: any[]) => mockSignUpAction(...args),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: (...args: any[]) => mockGetProjects(...args),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: any[]) => mockCreateProject(...args),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

// Import after mocks are set up
const { useAuth } = await import("@/hooks/use-auth");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" });
  mockSignInAction.mockResolvedValue({ success: true });
  mockSignUpAction.mockResolvedValue({ success: true });
});

// --- handlePostSignIn: Branch A — anon work exists ---

test("signIn: migrates anonymous work to a new project and redirects", async () => {
  const anonMessages = [{ role: "user", content: "hello" }];
  const anonData = { root: {} };
  mockGetAnonWorkData.mockReturnValue({
    messages: anonMessages,
    fileSystemData: anonData,
  });
  mockCreateProject.mockResolvedValue({ id: "migrated-project" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: anonMessages, data: anonData })
  );
  expect(mockClearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/migrated-project");
  expect(mockGetProjects).not.toHaveBeenCalled();
});

// --- handlePostSignIn: Branch B — no anon work, existing projects ---

test("signIn: redirects to most recent project when no anon work", async () => {
  mockGetProjects.mockResolvedValue([
    { id: "project-1" },
    { id: "project-2" },
  ]);

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/project-1");
  expect(mockCreateProject).not.toHaveBeenCalled();
});

// --- handlePostSignIn: Branch C — no anon work, no projects ---

test("signIn: creates blank project when user has no projects", async () => {
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "fresh-project" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/fresh-project");
});

// --- signIn failure ---

test("signIn: does not call handlePostSignIn when sign-in fails", async () => {
  mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

  const { result } = renderHook(() => useAuth());
  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("user@example.com", "wrong");
  });

  expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockGetProjects).not.toHaveBeenCalled();
});

// --- signUp ---

test("signUp: calls handlePostSignIn on success", async () => {
  mockGetProjects.mockResolvedValue([{ id: "existing" }]);

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signUp("new@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/existing");
});

test("signUp: does not redirect when sign-up fails", async () => {
  mockSignUpAction.mockResolvedValue({ success: false, error: "Email taken" });

  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signUp("taken@example.com", "password");
  });

  expect(mockPush).not.toHaveBeenCalled();
});

// --- isLoading ---

test("isLoading is false initially", () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);
});

test("isLoading is false after signIn completes", async () => {
  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });
  expect(result.current.isLoading).toBe(false);
});

test("isLoading is false after signIn fails", async () => {
  mockSignInAction.mockResolvedValue({ success: false });
  const { result } = renderHook(() => useAuth());
  await act(async () => {
    await result.current.signIn("user@example.com", "bad");
  });
  expect(result.current.isLoading).toBe(false);
});
