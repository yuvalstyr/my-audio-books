# Implementation Plan

- [x] 1. Update default book sorting to alphabetical by name
  - Modify the `initialFilterState` in `src/lib/stores/filter-store.ts` to set `sortBy: 'title'` and `sortOrder: 'asc'`
  - Write unit tests to verify the default sorting behavior works correctly
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 2. Create home screen page structure and routing
  - Create `src/routes/+page.svelte` with a new home screen component that displays only "next to read" books
  - Update `src/routes/+page.ts` to load only books with "next" tag instead of redirecting to wishlist
  - _Requirements: 4.1, 4.4_

- [x] 3. Implement home screen data loading and filtering
  - Create server-side data loading function in `src/routes/+page.ts` that filters books by "next" tag
  - Implement error handling for cases when no "next" books exist
  - Add loading states and error boundaries for the home screen
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 4. Build home screen UI components and layout
  - Design and implement the home screen layout with focused "next books" display
  - Create simplified book cards optimized for the reading queue view
  - Add navigation link to full wishlist page
  - Implement responsive design for mobile and desktop
  - _Requirements: 4.1, 4.3_

- [x] 5. Add real-time updates for next books functionality
  - Implement state synchronization between home screen and wishlist when books are marked/unmarked as "next"
  - Add optimistic updates for toggling "next" status from home screen
  - Write tests for state consistency across pages
  - _Requirements: 4.5_

- [x] 6. Update navigation and layout for home screen integration
  - Modify `src/routes/+layout.svelte` to update navigation links and branding
  - Add proper navigation between home screen and full wishlist
  - Ensure consistent user experience across both pages
  - _Requirements: 4.3_

- [x] 7. Enhance Railway deployment configuration
  - Verify and optimize `railway.json` configuration for production deployment
  - Update `package.json` build scripts to ensure proper production optimization
  - Create deployment verification script to test Railway deployment locally
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Create comprehensive project documentation
  - Write detailed `README.md` with project description, setup instructions, and deployment guide
  - Document environment variables and configuration requirements
  - Create contributing guidelines and development setup instructions
  - _Requirements: 2.3_

- [x] 9. Initialize and configure GitHub repository
  - Initialize Git repository if not already done and ensure proper `.gitignore` configuration
  - Create GitHub repository and configure repository settings
  - Push project code to GitHub with proper commit history
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 10. Write comprehensive tests for new functionality
  - Create unit tests for home screen components and data loading
  - Write integration tests for navigation between home and wishlist pages
  - Add tests for default sorting behavior and "next books" filtering
  - Test error handling and edge cases for all new functionality
  - _Requirements: 3.3, 4.4, 4.5_

- [x] 11. Perform final deployment and verification
  - Deploy application to Railway and verify all functionality works in production
  - Test complete user workflows from home screen to full wishlist management
  - Verify performance and loading times for both home screen and full wishlist
  - _Requirements: 1.2, 1.3, 1.4_