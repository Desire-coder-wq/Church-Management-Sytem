import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { useAuthStore } from "./stores/auth-store";
import { AuthForm } from "./features/auth/AuthForm";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RecordsPage } from "./pages/RecordsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PayPage } from "./pages/PayPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { LegalPage } from "./pages/LegalPage";
import { CookieNotice } from "./components/CookieNotice";

function Protected({ children }: { children: React.ReactNode }) {
  return useAuthStore((state) => state.token) ? (
    <AppLayout>{children}</AppLayout>
  ) : (
    <Navigate to="/login" replace />
  );
}

export function App() {
  return (
    <><Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<AuthForm key="login" />} />
      <Route path="/signup" element={<AuthForm key="signup" signup />} />
      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="/cookies" element={<LegalPage kind="cookies" />} />
      <Route path="/pay/:token" element={<PayPage />} />
      <Route path="/payment-result" element={<PaymentResultPage />} />
      <Route path="/payments" element={<Protected><PaymentsPage /></Protected>} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      {[
        "members",
        "campaigns",
        "pledges",
        "collections",
        "notifications",
        "reports",
      ].map((resource) => (
        <Route
          key={resource}
          path={`/${resource}`}
          element={
            <Protected>
              <RecordsPage key={resource} resource={resource} />
            </Protected>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes><CookieNotice /></>
  );
}
