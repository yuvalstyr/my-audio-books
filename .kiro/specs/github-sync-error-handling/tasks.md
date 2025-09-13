# Implementation Plan

- [x] 1. Enhance GitHub API error logging
  - Modify GitHubGistService to log detailed error information including HTTP status codes, response bodies, and request URLs
  - Add context about which operation failed (create, read, update, test)
  - Ensure sensitive data like tokens are excluded from logs
  - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Improve error message specificity in SyncService
  - Update SyncService methods to return specific error messages instead of generic "sync failed"
  - Add error message mapping for common GitHub API error codes (401, 403, 404, 429, 500, etc.)
  - Include network error detection and specific messaging
  - _Requirements: 1.1, 1.4_

- [x] 3. Fix error notification display in main application
  - Update the main wishlist page to properly display specific sync error messages from SyncService
  - Ensure error notifications show the actual error details instead of generic messages
  - Add proper error handling for each sync operation (add, update, delete, toggle)
  - _Requirements: 1.1, 1.3_

- [x] 4. Enhance sync status display
  - Update sync status indicator to show more detailed information about errors
  - Display the last error message in the sync status area
  - Add timestamp information for when errors occurred
  - _Requirements: 2.1, 2.4_

- [x] 5. Fix UI data synchronization after sync operations
  - Update performAutoSync function to use returned data from fullSync when available
  - Ensure books array is updated when sync returns newer remote data
  - Handle data updates for both automatic sync and manual retry operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

