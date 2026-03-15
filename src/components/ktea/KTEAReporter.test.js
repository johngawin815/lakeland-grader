import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KTEAReporter, { calculateGEGrowth } from './KTEAReporter';
import { databaseService } from '../../services/databaseService';

// Hijack the databaseService import to replace its methods with spies
jest.mock('../../services/databaseService', () => ({
  databaseService: {
    addKteaReport: jest.fn(),
    updateKteaReport: jest.fn(),
    searchKteaReports: jest.fn(() => Promise.resolve([])),
    getAllKteaReports: jest.fn(() => Promise.resolve([])),
  }
}));

describe('calculateGEGrowth', () => {
  it('calculates positive growth correctly', () => {
    expect(calculateGEGrowth('4.2', '5.5')).toBe('+1.3');
  });

  it('calculates negative growth correctly', () => {
    expect(calculateGEGrowth('5.5', '4.2')).toBe('-1.3');
  });

  it('calculates zero growth correctly', () => {
    expect(calculateGEGrowth('6.1', '6.1')).toBe('0.0');
  });

  it('strips greater than (>) and less than (<) symbols', () => {
    expect(calculateGEGrowth('>12.9', '14.2')).toBe('+1.3');
    expect(calculateGEGrowth('2.1', '<4.0')).toBe('+1.9');
  });

  it('handles strings with mixed text properly', () => {
    // If "<K.0" is passed, stripping non-numeric/dots leaves ".0" which parseFloat reads as 0
    expect(calculateGEGrowth('<K.0', '1.5')).toBe('+1.5');
  });

  it('returns N/A when inputs are missing or invalid', () => {
    expect(calculateGEGrowth(null, '5.5')).toBe('N/A');
    expect(calculateGEGrowth('5.5', undefined)).toBe('N/A');
    expect(calculateGEGrowth('abc', 'def')).toBe('N/A');
    expect(calculateGEGrowth('', '')).toBe('N/A');
  });

  it('handles raw numeric inputs seamlessly', () => {
    expect(calculateGEGrowth(3, 4.5)).toBe('+1.5');
  });
});

describe('KTEAReporter Submission Logic', () => {
  const mockUser = { email: 'teacher@lakeland.edu' };

  beforeEach(() => {
    // Clear call history between tests to prevent leaks
    jest.clearAllMocks();
  });

  it('calls addKteaReport with the correct payload when submitting a new record directly', async () => {
    // Setup the mock to resolve successfully
    databaseService.addKteaReport.mockResolvedValueOnce(true);

    const { container } = render(<KTEAReporter user={mockUser} activeStudent="" />);

    // Fill in the required form data
    const nameInput = container.querySelector('input[name="studentName"]');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Trigger the Save & Submit action
    const submitBtn = screen.getByText(/SAVE & SUBMIT/i);
    fireEvent.click(submitBtn);

    // Assert the service was called properly
    await waitFor(() => {
      expect(databaseService.addKteaReport).toHaveBeenCalledTimes(1);
      expect(databaseService.addKteaReport).toHaveBeenCalledWith(
        expect.objectContaining({
          studentName: 'Doe, John', // Verifies that formatName() correctly flipped the name
          submittedBy: 'teacher@lakeland.edu',
          schoolYear: '2024-2025'
        })
      );
    });
  });

  it('adds a record to the queue when clicking ADD TO QUEUE', async () => {
    const { container } = render(<KTEAReporter user={mockUser} activeStudent="" />);

    const nameInput = container.querySelector('input[name="studentName"]');
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

    const queueBtn = screen.getByText(/ADD TO QUEUE/i);
    fireEvent.click(queueBtn);

    // Wait for the UI to update and verify the queue sidebar reflects the item
    await waitFor(() => {
      // The database shouldn't be called for a queue addition
      expect(databaseService.addKteaReport).not.toHaveBeenCalled();
      // The UI should show the student's name formatted in the queue list
      expect(screen.getByText('Smith, Jane')).toBeInTheDocument();
    });
  });
});