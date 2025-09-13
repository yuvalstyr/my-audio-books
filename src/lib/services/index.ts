/**
 * Services module exports
 */

export { ConfigManager } from './config-manager';
export { ImportExportService } from './import-export';
export { parseAudibleUrl, isValidAudibleUrl } from './audible-parser';
export {
    ApiClient,
    ApiClientError,
    apiClient,
    isNetworkError,
    isValidationError,
    isNotFoundError,
    isServerError,
    getErrorMessage
} from './api-client';
export type { AppConfig } from './config-manager';
export type { ImportResult, ExportResult } from './import-export';
export type { AudibleMetadata, ParseResult } from './audible-parser';
export type {
    ApiResponse,
    ApiError,
    ApiSuccess,
    ApiBook,
    ApiTag,
    CreateBookRequest,
    UpdateBookRequest,
    CreateTagRequest,
    ApiClientConfig
} from './api-client';

// Example usage functions for easy integration (commented out to prevent SSR issues)
// export * from './example-usage';