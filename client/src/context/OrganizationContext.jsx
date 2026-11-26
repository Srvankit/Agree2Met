import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { organizationsService } from '../services';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrgs = useCallback(async () => {
    try {
      setLoading(true);
      const orgs = await organizationsService.list();
      setOrganizations(orgs);
      const current = await organizationsService.getCurrent();
      setCurrentOrg(current);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const switchOrg = async (orgId) => {
    setLoading(true);
    try {
      const switched = await organizationsService.switch(orgId);
      setCurrentOrg(switched);
      return switched;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        loading,
        switchOrg,
        refreshOrgs: loadOrgs,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within an OrganizationProvider');
  return ctx;
}
