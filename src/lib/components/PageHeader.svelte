<script lang="ts">
    export let title: string;
    export let subtitle: string = "";
    export let emoji: string = "";
    export let badgeText: string = "";
    export let showBadge: boolean = false;
    export let isLoading: boolean = false;
    export let isRefreshing: boolean = false;
    export let onRefresh: (() => void) | null = null;
    export let primaryAction: { label: string; href?: string; onClick?: () => void } | null = null;
</script>

<div class="mb-8">
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <!-- Title Section -->
        <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
                {#if emoji}
                    <div class="text-3xl">{emoji}</div>
                {/if}
                <h1 class="text-2xl lg:text-3xl font-semibold text-base-content">
                    {title}
                </h1>
            </div>
            {#if subtitle}
                <p class="text-base-content/60 text-sm lg:text-base max-w-2xl leading-relaxed">
                    {subtitle}
                </p>
            {/if}
            {#if showBadge && badgeText}
                <div class="mt-3">
                    <div class="badge badge-outline badge-lg">
                        {badgeText}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Primary Action Button -->
            {#if primaryAction}
                {#if primaryAction.href}
                    <a href={primaryAction.href} class="btn btn-primary">
                        {primaryAction.label}
                    </a>
                {:else if primaryAction.onClick}
                    <button
                        class="btn btn-primary"
                        on:click={primaryAction.onClick}
                        disabled={isLoading}
                    >
                        {primaryAction.label}
                    </button>
                {/if}
            {/if}

            <!-- Refresh Button -->
            {#if onRefresh}
                <button
                    class="btn btn-ghost btn-sm"
                    class:loading={isRefreshing}
                    on:click={onRefresh}
                    disabled={isLoading || isRefreshing}
                    title="Refresh data"
                >
                    {#if !isRefreshing}
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    {/if}
                </button>
            {/if}
        </div>
    </div>
</div>