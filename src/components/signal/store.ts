// Owner filter shared by the /signal islands. Each island is its own React
// root, but they share this module, so one store keeps them in step.
import { useSyncExternalStore } from "react";

let current = "all";
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export function setOwner(next: string) {
	if (next === current) return;
	current = next;
	for (const listener of listeners) listener();
	const url = new URL(window.location.href);
	if (next === "all") url.searchParams.delete("owner");
	else url.searchParams.set("owner", next);
	history.replaceState(history.state, "", url);
}

export function useOwner() {
	return useSyncExternalStore(
		subscribe,
		() => current,
		() => "all",
	);
}

/** Reads ?owner= once on load so a filtered link reopens filtered. */
export function initOwnerFromUrl(valid: string[]) {
	const owner = new URLSearchParams(window.location.search).get("owner");
	if (owner && valid.includes(owner)) setOwner(owner);
}
