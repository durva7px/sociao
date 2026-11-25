import { render, screen } from "@testing-library/react";
import { App } from "./App";

// Smoke test: proves Vitest, jsdom and React Testing Library are wired together.
describe("App", () => {
  it("renders the app name", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Sociao" })).toBeInTheDocument();
  });
});
