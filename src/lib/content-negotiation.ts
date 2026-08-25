export type Representation = "html" | "markdown";

interface AcceptEntry {
	type: string;
	q: number;
	specificity: number;
	position: number;
}

const representations: Record<Representation, string> = {
	html: "text/html",
	markdown: "text/markdown",
};

function parseAccept(header: string): AcceptEntry[] {
	return header
		.split(",")
		.map((part, position) => {
			const [rawType, ...parameters] = part.split(";");
			const type = rawType.trim().toLowerCase();
			let q = 1;

			for (const parameter of parameters) {
				const [name, rawValue] = parameter.split("=");
				if (name?.trim().toLowerCase() !== "q") continue;
				const value = Number(rawValue?.trim());
				q = Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
			}

			const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
			return { type, q, specificity, position };
		})
		.filter(({ type }) =>
			/^(\*|[\w!#$&^_.+-]+)\/(\*|[\w!#$&^_.+-]+)$/.test(type),
		);
}

function matches(entry: AcceptEntry, candidate: string): boolean {
	if (entry.type === "*/*") return true;
	const [entryType, entrySubtype] = entry.type.split("/");
	const [candidateType, candidateSubtype] = candidate.split("/");
	return (
		entryType === candidateType &&
		(entrySubtype === "*" || entrySubtype === candidateSubtype)
	);
}

export function preferredRepresentation(
	header: string | null,
): Representation | null {
	if (!header?.trim()) return "html";

	const entries = parseAccept(header);
	let selected: Representation | null = null;
	let selectedQ = -1;
	let selectedPosition = Number.POSITIVE_INFINITY;

	for (const representation of Object.keys(
		representations,
	) as Representation[]) {
		const candidate = representations[representation];
		const matching = entries.filter((entry) => matches(entry, candidate));
		if (matching.length === 0) continue;

		const specificity = Math.max(...matching.map((entry) => entry.specificity));
		const specificMatches = matching.filter(
			(entry) => entry.specificity === specificity,
		);
		const q = Math.max(...specificMatches.map((entry) => entry.q));
		if (q === 0) continue;
		const position = Math.min(
			...specificMatches
				.filter((entry) => entry.q === q)
				.map((entry) => entry.position),
		);

		if (q > selectedQ || (q === selectedQ && position < selectedPosition)) {
			selected = representation;
			selectedQ = q;
			selectedPosition = position;
		}
	}

	return selected;
}

export function appendNegotiationHeaders(headers: Headers): void {
	const vary = new Set(
		(headers.get("Vary") ?? "")
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean),
	);
	vary.add("Accept");
	vary.add("Accept-Encoding");
	headers.set("Vary", [...vary].join(", "));
}

export function isDocumentRequest(request: Request, pathname: string): boolean {
	if (request.method !== "GET" && request.method !== "HEAD") return false;
	if (pathname.startsWith("/api/") || pathname.startsWith("/_")) return false;
	const lastSegment = pathname.split("/").at(-1) ?? "";
	return !lastSegment.includes(".") || lastSegment.endsWith(".html");
}
