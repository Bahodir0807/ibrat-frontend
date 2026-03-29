import { fireEvent, screen, waitFor } from "@testing-library/react";
import StudentDashboard from "./StudentDashboard";
import { renderWithProviders } from "../../test/test-utils";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    role: "student",
    user: { username: "student_demo", role: "student" },
    logout: vi.fn(),
    isMockSession: false,
  }),
}));

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({
    theme: "night",
    themes: ["night", "light", "purple", "turquoise"],
    setTheme: vi.fn(),
  }),
}));

vi.mock("../../context/I18nContext", () => ({
  useI18n: () => ({
    language: "en",
    languages: ["ru", "en", "uz"],
    setLanguage: vi.fn(),
    t: (_key, fallback) => fallback || _key,
    tx: (value) => value,
  }),
}));

vi.mock("../../api/resources", () => ({
  scheduleApi: {
    mine: vi.fn().mockResolvedValue([
      {
        _id: "schedule-1",
        course: { name: "Math" },
        group: { name: "A1" },
        room: { name: "Room 7" },
        weekday: "monday",
        timeStart: "2026-03-29T09:00:00.000Z",
        timeEnd: "2026-03-29T10:00:00.000Z",
      },
    ]),
  },
  homeworkApi: {
    mine: vi.fn().mockResolvedValue([
      { _id: "homework-1", date: "2026-03-29T00:00:00.000Z", tasks: ["Essay"], completed: false },
    ]),
  },
  gradesApi: {
    mine: vi.fn().mockResolvedValue([
      { _id: "grade-1", subject: "Math", score: 5, date: "2026-03-29T00:00:00.000Z" },
    ]),
  },
  attendanceApi: {
    mine: vi.fn().mockResolvedValue([
      { _id: "attendance-1", date: "2026-03-29T00:00:00.000Z", status: "present" },
    ]),
  },
  paymentsApi: {
    mine: vi.fn().mockResolvedValue([
      { _id: "payment-1", amount: 250000, paidAt: "2026-03-29T00:00:00.000Z", isConfirmed: true },
    ]),
  },
}));

describe("StudentDashboard", () => {
  it("renders loaded student workspace data", async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Student Dashboard")).toBeInTheDocument();
      expect(screen.getAllByText("1")[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /schedule/i })[0]);
    expect(await screen.findByText("Math")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /homework/i })[0]);
    expect(await screen.findByText("Essay")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /attendance/i })[0]);
    expect(await screen.findByText("present")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /payments/i })[0]);
    expect(await screen.findByText("250000")).toBeInTheDocument();
  });
});
