import "@testing-library/jest-dom";

// Mock environment variables
const mockEnv = {
  VITE_SUPABASE_URL: "https://test.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "test-key",
  VITE_SUPABASE_PROJECT_ID: "test-project",
  MODE: "test",
};

// Mock import.meta.env
Object.defineProperty(import.meta, "env", {
  value: mockEnv,
  writable: true,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock scrollTo
window.scrollTo = () => {};

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Warning: ReactDOM.render") ||
        message.includes("Warning: An update to"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
