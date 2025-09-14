<script lang="ts">
    export let icon: string = "📖";
    export let title: string = "No Items Found";
    export let description: string = "There are no items to display.";
    export let actions: Array<{
        label: string;
        icon?: string;
        href?: string;
        onClick?: () => void;
        variant?: "primary" | "outline";
    }> = [];
</script>

<div class="text-center py-16">
    <div class="mb-8">
        <!-- Animated Icon -->
        <div class="relative mx-auto w-32 h-32 mb-6">
            <div class="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
            <div class="absolute inset-0 flex items-center justify-center text-6xl">
                {icon}
            </div>
        </div>
    </div>

    <h2 class="text-xl lg:text-2xl font-semibold mb-4 text-base-content">
        {title}
    </h2>
    <p class="text-base-content/60 text-sm lg:text-base mb-8 max-w-xl mx-auto leading-relaxed">
        {description}
    </p>

    <!-- Action Cards - Responsive: Stack on iPhone 16, Side-by-side on Mac -->
    {#if actions.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-{Math.min(actions.length, 2)} gap-6 max-w-2xl mx-auto mb-8">
            {#each actions as action}
                <div class="card bg-base-100 shadow-lg border border-base-300/50">
                    <div class="card-body text-center p-6">
                        {#if action.icon}
                            <div class="text-4xl mb-2">{action.icon}</div>
                        {/if}
                        <h3 class="card-title justify-center mb-2 text-lg">
                            {action.label}
                        </h3>
                        <div class="card-actions justify-center mt-4">
                            {#if action.href}
                                <a
                                    href={action.href}
                                    class="btn {action.variant === 'outline' ? 'btn-outline' : 'btn-primary'}"
                                >
                                    {action.label}
                                </a>
                            {:else if action.onClick}
                                <button
                                    class="btn {action.variant === 'outline' ? 'btn-outline' : 'btn-primary'}"
                                    on:click={action.onClick}
                                >
                                    {action.label}
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>