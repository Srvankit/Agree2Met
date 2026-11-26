// Agree2Met Client App Root
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { OrganizationProvider } from './context/OrganizationContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AIAssistantProvider } from './context/AIAssistantContext.jsx';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute.jsx';

import { LandingPage } from './pages/public/LandingPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { TermsPage } from './pages/legal/TermsPage.jsx';
import { PrivacyPage } from './pages/legal/PrivacyPage.jsx';
import { ForbiddenPage } from './pages/errors/ForbiddenPage.jsx';
import { ServerErrorPage } from './pages/errors/ServerErrorPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { StatusPage } from './pages/StatusPage.jsx';
import { ComponentShowcase } from './pages/dev/ComponentShowcase.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <OrganizationProvider>
            <NotificationProvider>
              <AIAssistantProvider>
                <Routes>
                  {/* Public & Landing */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/legal/terms" element={<TermsPage />} />
                  <Route path="/legal/privacy" element={<PrivacyPage />} />

                  {/* Auth Flows */}
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <LoginPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicOnlyRoute>
                        <RegisterPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Errors */}
                  <Route path="/403" element={<ForbiddenPage />} />
                  <Route path="/500" element={<ServerErrorPage />} />

                  {/* Dev Reference */}
                  <Route path="/dev/components" element={<ComponentShowcase />} />

                  {/* Fallback 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AIAssistantProvider>
            </NotificationProvider>
          </OrganizationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
