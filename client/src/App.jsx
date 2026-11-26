// Agree2Met Client App Root
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { OrganizationProvider } from './context/OrganizationContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AIAssistantProvider } from './context/AIAssistantContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { StatusPage } from './pages/StatusPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
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
                  <Route path="/" element={<HomePage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/dev/components" element={<ComponentShowcase />} />
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
