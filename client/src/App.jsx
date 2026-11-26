// Agree2Met Client App Root
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { OrganizationProvider } from './context/OrganizationContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AIAssistantProvider } from './context/AIAssistantContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute.jsx';
import { AppShell } from './components/common/AppShell.jsx';

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

import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';
import { AgreementsPage } from './pages/agreements/AgreementsPage.jsx';
import { AgreementDetailPage } from './pages/agreements/AgreementDetailPage.jsx';
import { AgreementWizard } from './pages/agreements/AgreementWizard.jsx';
import { ArchivePage } from './pages/archive/ArchivePage.jsx';
import { DocumentsPage } from './pages/documents/DocumentsPage.jsx';
import { TemplatesPage } from './pages/templates/TemplatesPage.jsx';
import { DeadlinesPage } from './pages/deadlines/DeadlinesPage.jsx';
import { NotificationsPage } from './pages/notifications/NotificationsPage.jsx';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage.jsx';
import { AIAssistantPage } from './pages/ai/AIAssistantPage.jsx';
import { TeamPage } from './pages/team/TeamPage.jsx';
import { SettingsPage } from './pages/settings/SettingsPage.jsx';
import { PublicSigningPage } from './pages/signing/PublicSigningPage.jsx';

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
                  <Route path="/sign/:token" element={<PublicSigningPage />} />
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

                  {/* Protected App Shell & Routes */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="agreements" element={<AgreementsPage />} />
                    <Route path="agreements/new" element={<AgreementWizard />} />
                    <Route path="agreements/:id" element={<AgreementDetailPage />} />
                    <Route path="agreements/:id/edit" element={<AgreementWizard />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="deadlines" element={<DeadlinesPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="ai" element={<AIAssistantPage />} />
                    <Route path="team" element={<TeamPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="archive" element={<ArchivePage />} />
                  </Route>

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
