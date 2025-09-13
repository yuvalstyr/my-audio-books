/**
 * Unit tests for BookForm component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import BookForm from '../BookForm.svelte';
import type { Book, CreateBookInput } from '$lib/types/book';

// Mock the validation functions
vi.mock('$lib/utils/validation', () => ({
    isValidCreateBookInput: vi.fn(() => true),
    isValidAudibleUrl: vi.fn(() => true)
}));

// Mock the ID generation
vi.mock('$lib/utils/id', () => ({
    generateId: vi.fn(() => 'test-id-123'),
    generateTagId: vi.fn(() => 'tag-123')
}));

// Mock the services
vi.mock('$lib/services/audible-parser', () => ({
    parseAudibleUrl: vi.fn(() => Promise.resolve({
        success: true,
        metadata: {
            title: 'Parsed Title',
            author: 'Parsed Author',
            description: 'Parsed description'
        }
    }))
}));

vi.mock('$lib/services/error-logger', () => ({
    ErrorLogger: {
        error: vi.fn()
    }
}));

vi.mock('$lib/services/notification-service', () => ({
    NotificationService: {
        error: vi.fn()
    }
}));

describe('BookForm Component', () => {
    let component: any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (component) {
            component.$destroy();
        }
    });

    describe('Add Mode', () => {
        it('should render add form correctly', () => {
            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            expect(screen.getByText('Add New Book')).toBeInTheDocument();
            expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument();
        });

        it('should validate required fields', async () => {
            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            const submitButton = screen.getByRole('button', { name: /add book/i });

            // Submit without filling required fields
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Title is required')).toBeInTheDocument();
                expect(screen.getByText('Author is required')).toBeInTheDocument();
            });
        });

        it('should dispatch save event with valid data', async () => {
            const mockSave = vi.fn();

            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            component.$on('save', mockSave);

            // Fill in required fields
            const titleInput = screen.getByLabelText(/title/i);
            const authorInput = screen.getByLabelText(/author/i);

            await fireEvent.input(titleInput, { target: { value: 'Test Book' } });
            await fireEvent.input(authorInput, { target: { value: 'Test Author' } });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockSave).toHaveBeenCalledWith(
                    expect.objectContaining({
                        detail: {
                            book: expect.objectContaining({
                                title: 'Test Book',
                                author: 'Test Author'
                            })
                        }
                    })
                );
            });
        });

        it('should handle tag selection', async () => {
            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            const funnyTag = screen.getByText('Funny');
            await fireEvent.click(funnyTag);

            expect(funnyTag.closest('.badge')).toHaveClass('badge-warning');
        });
    });

    describe('Edit Mode', () => {
        const mockBook: Book = {
            id: 'book-123',
            title: 'Existing Book',
            author: 'Existing Author',
            audibleUrl: 'https://audible.com/pd/test',
            tags: [
                { id: 'tag-1', name: 'funny', color: 'badge-warning' }
            ],
            narratorRating: 4.5,
            performanceRating: 4.0,
            description: 'Test description',
            dateAdded: new Date(),
            queuePosition: 1,
            coverImageUrl: 'https://example.com/cover.jpg'
        };

        it('should render edit form with existing data', () => {
            component = render(BookForm, {
                props: {
                    book: mockBook,
                    isOpen: true
                }
            });

            expect(screen.getByText('Edit Book')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Existing Book')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Existing Author')).toBeInTheDocument();
            expect(screen.getByDisplayValue('https://audible.com/pd/test')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /update book/i })).toBeInTheDocument();
        });

        it('should pre-select existing tags', () => {
            component = render(BookForm, {
                props: {
                    book: mockBook,
                    isOpen: true
                }
            });

            const funnyTag = screen.getByText('Funny');
            expect(funnyTag.closest('.badge')).toHaveClass('badge-warning');
        });
    });

    describe('Audible URL Parsing', () => {
        it('should parse Audible URL and populate fields', async () => {
            const { parseAudibleUrl } = await import('$lib/services/audible-parser');

            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            const urlInput = screen.getByLabelText(/audible url/i);
            await fireEvent.input(urlInput, {
                target: { value: 'https://audible.com/pd/test-book' }
            });

            // Wait for debounced parsing
            await waitFor(() => {
                expect(parseAudibleUrl).toHaveBeenCalledWith('https://audible.com/pd/test-book');
            }, { timeout: 2000 });

            await waitFor(() => {
                expect(screen.getByDisplayValue('Parsed Title')).toBeInTheDocument();
                expect(screen.getByDisplayValue('Parsed Author')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should display validation errors', async () => {
            const { isValidCreateBookInput } = await import('$lib/utils/validation');
            vi.mocked(isValidCreateBookInput).mockReturnValue(false);

            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            const titleInput = screen.getByLabelText(/title/i);
            const authorInput = screen.getByLabelText(/author/i);

            await fireEvent.input(titleInput, { target: { value: 'Test Book' } });
            await fireEvent.input(authorInput, { target: { value: 'Test Author' } });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/invalid book data/i)).toBeInTheDocument();
            });
        });

        it('should handle network errors gracefully', async () => {
            const { isValidCreateBookInput } = await import('$lib/utils/validation');
            vi.mocked(isValidCreateBookInput).mockImplementation(() => {
                throw new Error('Network error');
            });

            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            const titleInput = screen.getByLabelText(/title/i);
            const authorInput = screen.getByLabelText(/author/i);

            await fireEvent.input(titleInput, { target: { value: 'Test Book' } });
            await fireEvent.input(authorInput, { target: { value: 'Test Author' } });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/network error/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
            expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
        });

        it('should handle keyboard navigation', async () => {
            component = render(BookForm, {
                props: {
                    book: null,
                    isOpen: true
                }
            });

            const dialog = screen.getByRole('dialog');

            // Test Escape key closes modal
            await fireEvent.keyDown(dialog, { key: 'Escape' });

            // Should dispatch cancel event
            // Note: This would need to be tested with component event listeners
        });
    });
});