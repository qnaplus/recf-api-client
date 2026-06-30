import { afterEach, describe, expect, it, vi } from "vitest";
import { getGetOpenApiSpecUrl, getOpenApiSpec } from "../src/meta/meta";
import { makeMockResponse } from "./helpers";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("URL builders", () => {
	it("getGetOpenApiSpecUrl", () => {
		expect(getGetOpenApiSpecUrl()).toBe("https://games.recf.org/api/v1/openapi.json");
	});
});

describe("getOpenApiSpec", () => {
	it("returns parsed spec on success", async () => {
		const mockSpec = { openapi: "3.1.0", info: { title: "RECF API" } };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockSpec)));

		const result = await getOpenApiSpec();

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockSpec);
	});

	it("calls fetch with correct URL and GET method", async () => {
		const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
		vi.stubGlobal("fetch", mockFetch);

		await getOpenApiSpec();

		expect(mockFetch).toHaveBeenCalledWith(
			"https://games.recf.org/api/v1/openapi.json",
			expect.objectContaining({ method: "GET" }),
		);
	});
});
