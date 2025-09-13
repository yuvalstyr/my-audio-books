<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let operation: "create" | "update" | "delete" | "load" = "load";
    export let status: "idle" | "loading" | "success" | "error" = "idle";
    export let message: string = "";
    export let error: string | null = null;
    export let showRetry: boolean = true;
    export let retryDisabled: boolean = false;

    const dispatch = createEventDispatcher<{
        retry: void;
        dismiss: void;
    }>();

    $: operationText = {
        create: "Creating",
        update: "Updating",
        delete: "Deleting",
        load: "Loading",
    }[operation];

    $: successText = {
        create: "Created successfully",
        update: "Updated successfully",
        delete: "Deleted successfully",
        load: "Loaded successfully",
    }[operation];

    function handleRetry() {
        dispatch("retry");
    }

    function handleDismiss() {
        dispatch("dismiss");
    }
</script>

{#if status === "loading"}
    <div class="alert alert-info">
        <span class="loading loading-spinner loading-sm"></span>
        <span>{operationText}... {message}</span>
    </div>
{:else if status === "success" && message}
    <div class="alert alert-success">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <span>{message || successText}</span>
        <button
            class="btn btn-sm btn-ghost"
            on:click={handleDismiss}
            aria-label="Dismiss"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>
    </div>
{:else if status === "error"}
    <div class="alert alert-error">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <div class="flex-1">
            <div class="font-semibold">Operation Failed</div>
            <div class="text-sm">{error || message || "An error occurred"}</div>
        </div>
        <div class="flex gap-2">
            {#if showRetry}
                <button
                    class="btn btn-sm btn-outline"
                    on:click={handleRetry}
                    disabled={retryDisabled}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Retry
                </button>
            {/if}
            <button
                class="btn btn-sm btn-ghost"
                on:click={handleDismiss}
                aria-label="Dismiss error"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    </div>
{/if}
