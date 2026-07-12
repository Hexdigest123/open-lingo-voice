export type NotificationType = 'success' | 'error';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message?: string;
	duration?: number;
	dismissing?: boolean;
}

let notifications = $state<Notification[]>([]);

function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}

export function showNotification(notification: Omit<Notification, 'id'>): string {
	const id = generateId();
	const newNotification: Notification = {
		...notification,
		id,
		duration: notification.duration ?? 4000
	};

	notifications = [...notifications, newNotification];

	// Auto-dismiss after duration
	if (newNotification.duration && newNotification.duration > 0) {
		setTimeout(() => {
			dismissNotification(id);
		}, newNotification.duration);
	}

	return id;
}

export function dismissNotification(id: string): void {
	// First mark as dismissing for animation
	notifications = notifications.map((n) => (n.id === id ? { ...n, dismissing: true } : n));

	// Then remove after animation
	setTimeout(() => {
		notifications = notifications.filter((n) => n.id !== id);
	}, 300);
}

export function getNotifications(): Notification[] {
	return notifications;
}

export function showError(title: string, message?: string): string {
	return showNotification({
		type: 'error',
		title,
		message,
		duration: 5000
	});
}

export function showSuccess(title: string, message?: string): string {
	return showNotification({
		type: 'success',
		title,
		message,
		duration: 3000
	});
}
