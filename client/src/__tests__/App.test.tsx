import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App, { REVIEWER_CREDENTIALS } from '../App';

describe('App Component', () => {
  it('renders login screen with Project Cyber Heist branding', async () => {
    render(<App />);

    expect(await screen.findByText('Project Cyber Heist')).toBeDefined();
    expect(screen.getByText('Console Authentication')).toBeDefined();
  });

  it('displays discoverable reviewer quick-access credentials', async () => {
    render(<App />);

    expect(await screen.findByText('Reviewer Quick-Access Credentials:')).toBeDefined();

    for (const cred of REVIEWER_CREDENTIALS) {
      expect(screen.getByText(new RegExp(cred.role, 'i'))).toBeDefined();
    }
  });

  it('updates email and password fields when reviewer quick-fill button is clicked', async () => {
    render(<App />);

    const opButton = await screen.findByText(/operator/i);
    fireEvent.click(opButton);

    const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
    expect(emailInput.value).toBe('operator@cyberheist.local');
  });
});
