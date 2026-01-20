import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import App from "../../App";
import { queryClient } from "@/lib/queryClient";

const testUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  fullName: "Test User",
  role: "user",
};

const defaultHandlers = [
  http.get("/api/user", () => HttpResponse.json(null, { status: 401 })),
  http.post("/api/login", () => HttpResponse.json(testUser)),
  http.post("/api/logout", () => HttpResponse.json({ success: true })),
  http.get(/\/api\/profiles.*/, () => HttpResponse.json([])),
  http.get(/\/api\/notifications.*/, () => HttpResponse.json([])),
  http.put("/api/users/active-profile", () => HttpResponse.json({ success: true })),
  http.get(/\/api\/exams.*/, () => HttpResponse.json([])),
  http.get(/\/api\/health-metrics\/latest.*/, () => HttpResponse.json([])),
];

const server = setupServer(...defaultHandlers);

describe("App integration", () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers(...defaultHandlers);
    queryClient.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  afterAll(() => {
    server.close();
  });

  it("renders landing page for guests", async () => {
    render(<App />);

    const accessButtons = await screen.findAllByRole("button", { name: /acessar/i });
    expect(accessButtons.length).toBeGreaterThan(0);
  });

  it("navigates to auth page when access button is clicked", async () => {
    const user = userEvent.setup();

    render(<App />);

    const [accessButton] = await screen.findAllByRole("button", { name: /acessar/i });
    await user.click(accessButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/auth");
    });
    expect(await screen.findByRole("tab", { name: /entrar/i })).toBeInTheDocument();
  });

  it("shows dashboard for authenticated users", async () => {
    server.use(
      http.get("/api/user", () => HttpResponse.json(testUser)),
      http.get(/\/api\/profiles.*/, () =>
        HttpResponse.json([
          {
            id: 1,
            userId: 1,
            name: "Paciente Principal",
            relationship: "self",
            birthDate: "1990-01-01",
            gender: "female",
            bloodType: "O+",
            planType: "standard",
            isDefault: true,
            createdAt: new Date().toISOString(),
          },
        ]),
      ),
      http.get(/\/api\/exams.*/, () =>
        HttpResponse.json([
          {
            id: 1,
            userId: 1,
            profileId: 1,
            name: "Hemograma Completo",
            fileType: "pdf",
            status: "analyzed",
            uploadDate: "2024-01-01T00:00:00.000Z",
            laboratoryName: "Laboratório Central",
            examDate: "2024-01-01",
            requestingPhysician: null,
            originalContent: "{}",
          },
        ]),
      ),
      http.get(/\/api\/health-metrics\/latest.*/, () =>
        HttpResponse.json([
          {
            id: 1,
            userId: 1,
            profileId: 1,
            examId: 1,
            name: "colesterol",
            value: "180",
            unit: "mg/dL",
            status: "normal",
            change: "-10",
            date: "2024-01-01T00:00:00.000Z",
          },
        ]),
      ),
    );

    queryClient.setQueryData(["/api/user"], testUser);
    window.history.replaceState(null, "", "/agenda");
    render(<App />);

    await waitFor(() => {
      const roleBadges = screen.getAllByText(/Profissional de saúde/i);
      expect(roleBadges.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      const dashboardLinks = screen.getAllByText(/Agenda/i);
      expect(dashboardLinks.length).toBeGreaterThan(0);
    });
  });
});
