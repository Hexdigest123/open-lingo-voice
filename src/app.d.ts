// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				email: string;
				displayName: string;
			} | null;
			newAccessToken?: string;
		}
		interface PageData {
			user?: App.Locals['user'];
		}
	}
}

export {};
