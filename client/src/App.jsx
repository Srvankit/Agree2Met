// Agree2Met Client App Root
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { StatusPage } from './pages/StatusPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { ComponentShowcase } from './pages/dev/ComponentShowcase.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/dev/components" element={<ComponentShowcase />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
