import { createContext, useContext, useState } from 'react';

const AIAssistantContext = createContext(null);

export function AIAssistantProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextData, setContextData] = useState(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const openWithContext = (data) => {
    setContextData(data);
    setIsOpen(true);
  };

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        contextData,
        toggle,
        close,
        openWithContext,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  return ctx;
}
