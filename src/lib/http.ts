export function json<T>(data: T, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export function httpError(
	message: string,
	code: string,
	status = 400,
): Response {
	return json({ error: { message, code } }, status);
}
