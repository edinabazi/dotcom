import posthog from "posthog-js";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, properties?: EventProperties) {
	if (typeof window === "undefined") return;

	posthog.capture(eventName, properties);
}
