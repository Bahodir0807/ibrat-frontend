import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import DashboardRouter from "./DashboardRouter";
import { renderWithProviders } from "../test/test-utils";

const mockUseAuth = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("DashboardRouter", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("redirects unauthenticated users to login", async () => {
    mockUseAuth.mockReturnValue({
      status: "ready",
      isAuthenticated: false,
      role: "",
    });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
    );

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects teacher to teacher workspace", async () => {
    mockUseAuth.mockReturnValue({
      status: "ready",
      isAuthenticated: true,
      role: "teacher",
    });

    renderWithProviders(
      <Routes>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/teacher" element={<div>Teacher Page</div>} />
      </Routes>,
    );

    expect(await screen.findByText("Teacher Page")).toBeInTheDocument();
  });
});
