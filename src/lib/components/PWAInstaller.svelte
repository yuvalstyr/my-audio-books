<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    let deferredPrompt: any = null;
    let showInstallButton = false;
    let isInstalled = false;

    onMount(() => {
        if (!browser) return;

        // Check if app is already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            isInstalled = true;
        }

        // Listen for beforeinstallprompt event
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallButton = true;
        });

        // Listen for app installed event
        window.addEventListener("appinstalled", () => {
            showInstallButton = false;
            isInstalled = true;
            deferredPrompt = null;
        });

        // Service worker registration is handled by SvelteKit automatically
    });

    async function installApp() {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            showInstallButton = false;
        }

        deferredPrompt = null;
    }
</script>

{#if showInstallButton && !isInstalled}
    <div class="fixed bottom-4 right-4 z-50">
        <button class="btn btn-primary btn-sm shadow-lg" on:click={installApp}>
            <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8l-8-8-8 8"
                />
            </svg>
            Install App
        </button>
    </div>
{/if}

{#if isInstalled}
    <div class="toast toast-top toast-end">
        <div class="alert alert-success">
            <span>App installed successfully!</span>
        </div>
    </div>
{/if}
