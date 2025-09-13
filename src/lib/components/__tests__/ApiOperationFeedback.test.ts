/**
 * Tests for API Operation Feedback component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import ApiOperationFeedback from '../ApiOperationFeedback.svelte';

describe('ApiOperationFeedback Component', () => {
    let component: any;

    afterEach(() => {
        if (component) {
            component.$destroy();
        }
    });

    describe('Success States', () => {
        it('should display success message', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Book added successfully',
                    isVisible: true
                }
            });

            expect(screen.getByText('Book added successfully')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveClass('alert-success');
        });

        it('should show success icon', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Operation completed',
                    isVisible: true
                }
            });

            const successIcon = screen.getByRole('alert').querySelector('svg');
            expect(successIcon).toBeInTheDocument();
        });
    });

    describe('Error States', () => {
        it('should display error message', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Failed to save book',
                    isVisible: true
                }
            });

            expect(screen.getByText('Failed to save book')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveClass('alert-error');
        });

        it('should display detailed error information', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Network Error',
                    details: 'Unable to connect to server. Please check your internet connection.',
                    isVisible: true
                }
            });

            expect(screen.getByText('Network Error')).toBeInTheDocument();
            expect(screen.getByText('Unable to connect to server. Please check your internet connection.')).toBeInTheDocument();
        });

        it('should show retry button for retryable errors', () => {
            const mockRetry = vi.fn();

            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Network Error',
                    isVisible: true,
                    canRetry: true
                }
            });

            component.$on('retry', mockRetry);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
        });

        it('should emit retry event when retry button is clicked', async () => {
            const mockRetry = vi.fn();

            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Network Error',
                    isVisible: true,
                    canRetry: true
                }
            });

            component.$on('retry', mockRetry);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            await fireEvent.click(retryButton);

            expect(mockRetry).toHaveBeenCalled();
        });
    });

    describe('Loading States', () => {
        it('should display loading message with spinner', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'loading',
                    message: 'Saving book...',
                    isVisible: true
                }
            });

            expect(screen.getByText('Saving book...')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveClass('alert-info');

            const spinner = screen.getByRole('alert').querySelector('.loading-spinner');
            expect(spinner).toBeInTheDocument();
        });
    });

    describe('Warning States', () => {
        it('should display warning message', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'warning',
                    message: 'Some fields were not saved',
                    isVisible: true
                }
            });

            expect(screen.getByText('Some fields were not saved')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveClass('alert-warning');
        });
    });

    describe('Visibility Control', () => {
        it('should not render when isVisible is false', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Hidden message',
                    isVisible: false
                }
            });

            expect(screen.queryByText('Hidden message')).not.toBeInTheDocument();
        });

        it('should show and hide based on isVisible prop changes', async () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Toggle message',
                    isVisible: false
                }
            });

            expect(screen.queryByText('Toggle message')).not.toBeInTheDocument();

            // Update props to show
            await component.$set({ isVisible: true });
            expect(screen.getByText('Toggle message')).toBeInTheDocument();

            // Update props to hide
            await component.$set({ isVisible: false });
            expect(screen.queryByText('Toggle message')).not.toBeInTheDocument();
        });
    });

    describe('Dismissible Feedback', () => {
        it('should show dismiss button when dismissible', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Dismissible message',
                    isVisible: true,
                    dismissible: true
                }
            });

            const dismissButton = screen.getByLabelText(/dismiss/i);
            expect(dismissButton).toBeInTheDocument();
        });

        it('should emit dismiss event when dismiss button is clicked', async () => {
            const mockDismiss = vi.fn();

            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Dismissible message',
                    isVisible: true,
                    dismissible: true
                }
            });

            component.$on('dismiss', mockDismiss);

            const dismissButton = screen.getByLabelText(/dismiss/i);
            await fireEvent.click(dismissButton);

            expect(mockDismiss).toHaveBeenCalled();
        });

        it('should not show dismiss button when not dismissible', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Non-dismissible message',
                    isVisible: true,
                    dismissible: false
                }
            });

            const dismissButton = screen.queryByLabelText(/dismiss/i);
            expect(dismissButton).not.toBeInTheDocument();
        });
    });

    describe('Auto-dismiss', () => {
        it('should auto-dismiss after timeout', async () => {
            const mockDismiss = vi.fn();

            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Auto-dismiss message',
                    isVisible: true,
                    autoDismiss: true,
                    autoDismissDelay: 100 // Short delay for testing
                }
            });

            component.$on('dismiss', mockDismiss);

            // Wait for auto-dismiss
            await waitFor(() => {
                expect(mockDismiss).toHaveBeenCalled();
            }, { timeout: 200 });
        });

        it('should not auto-dismiss when autoDismiss is false', async () => {
            const mockDismiss = vi.fn();

            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'No auto-dismiss message',
                    isVisible: true,
                    autoDismiss: false,
                    autoDismissDelay: 100
                }
            });

            component.$on('dismiss', mockDismiss);

            // Wait longer than the delay
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(mockDismiss).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Error message',
                    isVisible: true
                }
            });

            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('aria-live', 'polite');
        });

        it('should have assertive aria-live for errors', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Critical error',
                    isVisible: true
                }
            });

            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('aria-live', 'assertive');
        });

        it('should be keyboard accessible', async () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'error',
                    message: 'Keyboard accessible error',
                    isVisible: true,
                    canRetry: true,
                    dismissible: true
                }
            });

            const retryButton = screen.getByRole('button', { name: /retry/i });
            const dismissButton = screen.getByLabelText(/dismiss/i);

            // Should be focusable
            retryButton.focus();
            expect(document.activeElement).toBe(retryButton);

            dismissButton.focus();
            expect(document.activeElement).toBe(dismissButton);
        });
    });

    describe('Animation and Transitions', () => {
        it('should apply transition classes', () => {
            component = render(ApiOperationFeedback, {
                props: {
                    type: 'success',
                    message: 'Animated message',
                    isVisible: true
                }
            });

            const alert = screen.getByRole('alert');
            expect(alert).toHaveClass('transition-all');
        });
    });
});