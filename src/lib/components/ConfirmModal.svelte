<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open, title, message, confirmText, cancelText, onConfirm, onCancel }: Props = $props();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-modal-title"
	>
		<div class="card w-full max-w-sm">
			<h2 id="confirm-modal-title" class="mb-2 text-lg font-bold text-text-light">
				{title}
			</h2>
			<p class="mb-6 text-text-muted">
				{message}
			</p>
			<div class="flex justify-end gap-3">
				<button type="button" onclick={onCancel} class="btn btn-ghost btn-md">
					{cancelText ?? t('common.cancel')}
				</button>
				<button type="button" onclick={onConfirm} class="btn btn-error btn-md">
					{confirmText ?? t('common.delete')}
				</button>
			</div>
		</div>
	</div>
{/if}
