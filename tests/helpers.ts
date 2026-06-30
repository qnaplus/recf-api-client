import { vi } from "vitest";

export function makeMockResponse(
	status: number,
	body: unknown,
	contentType = "application/json",
) {
	const headers = new Headers({ "content-type": contentType });
	const bodyString = typeof body === "string" ? body : JSON.stringify(body);
	return {
		status,
		headers,
		text: vi.fn().mockResolvedValue(bodyString),
		blob: vi.fn().mockResolvedValue(new Blob([bodyString])),
	};
}
