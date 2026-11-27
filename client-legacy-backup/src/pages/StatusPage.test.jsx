import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StatusPage } from './StatusPage.jsx';
import { apiClient } from '../services/api.js';

vi.mock('../services/api.js', () => ({
  apiClient: {
    getHealth: vi.fn(),
    sendTestEmail: vi.fn(),
  },
}));

describe('StatusPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    apiClient.getHealth.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<StatusPage />);

    expect(screen.getByText(/Probing infrastructure dependencies/i)).toBeInTheDocument();
  });

  it('renders healthy status cards when API succeeds', async () => {
    apiClient.getHealth.mockResolvedValue({
      success: true,
      data: {
        status: 'healthy',
        uptimeSeconds: 42,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        services: {
          database: true,
          redis: true,
          storage: true,
          smtp: true,
        },
      },
    });

    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Overall System State')).toBeInTheDocument();
    });

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getAllByText('✓ Connected')).toHaveLength(4);
    expect(screen.getByText(/Uptime: 42s/i)).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    apiClient.getHealth.mockRejectedValue(new Error('Failed to connect to backend'));

    render(<StatusPage />);

    await waitFor(() => {
      expect(screen.getByText(/Connection Error:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to connect to backend/i)).toBeInTheDocument();
  });
});
