import posthog from "posthog-js";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, properties?: EventProperties) {
	if (typeof window === "undefined") return;

	try {
		posthog.capture(eventName, properties);
	} catch {
		// Analytics should never block the user's navigation.
	}
}
