/**
 * Network utilities for detecting connectivity and handling offline scenarios
 */

export class NetworkUtils {
    /**
     * Check if the browser is online
     */
    static isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Test actual connectivity by making a request to a reliable endpoint
     */
    static async testConnectivity(): Promise<boolean> {
        if (!navigator.onLine) {
            return false;
        }

        try {
            const response = await fetch('https://httpbin.org/status/200', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Add event listeners for online/offline events
     */
    static addConnectivityListeners(
        onOnline: () => void,
        onOffline: () => void
    ): () => void {
        const handleOnline = () => onOnline();
        const handleOffline = () => onOffline();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Return cleanup function
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }

    /**
     * Wait for network connectivity with timeout
     */
    static async waitForConnectivity(timeoutMs: number = 30000): Promise<boolean> {
        if (navigator.onLine) {
            return true;
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeoutMs);

            const handleOnline = () => {
                cleanup();
                resolve(true);
            };

            const cleanup = () => {
                clearTimeout(timeout);
                window.removeEventListener('online', handleOnline);
            };

            window.addEventListener('online', handleOnline);
        });
    }
}