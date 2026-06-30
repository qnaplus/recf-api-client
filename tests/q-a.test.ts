import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getGetQaRssUrl,
	getGetQaUrl,
	getListQaUrl,
	getListRuleQaUrl,
	getQa,
	getQaRss,
	listQa,
	listRuleQa,
} from "../src/q-a/q-a";
import { makeMockResponse } from "./helpers";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("URL builders", () => {
	it("getListQaUrl without params", () => {
		expect(getListQaUrl("achieve")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/qa",
		);
	});

	it("getListQaUrl with params", () => {
		const url = getListQaUrl("achieve", { limit: 2 });
		expect(url).toBe("https://games.recf.org/api/v1/programs/achieve/qa?limit=2");
	});

	it("getListQaUrl with empty params produces no query string", () => {
		const url = getListQaUrl("achieve", {});
		expect(url).toBe("https://games.recf.org/api/v1/programs/achieve/qa");
	});

	it("getGetQaUrl", () => {
		expect(getGetQaUrl("achieve", "42")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/qa/42",
		);
	});

	it("getGetQaRssUrl", () => {
		expect(getGetQaRssUrl("achieve")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/qa.rss",
		);
	});

	it("getListRuleQaUrl without params", () => {
		expect(getListRuleQaUrl("achieve", "R1")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/rules/R1/qa",
		);
	});

	it("getListRuleQaUrl with params", () => {
		const url = getListRuleQaUrl("achieve", "R1", { limit: 1 });
		expect(url).toBe(
			"https://games.recf.org/api/v1/programs/achieve/rules/R1/qa?limit=1",
		);
	});
});

describe("listQa", () => {
	it("returns Q&A list on success", async () => {
		const mockData = {
			data: {
				questions: [{ qnaNumber: 1, subject: "Q?" }],
				pagination: { total: 1, limit: 25, offset: 0 },
			},
			meta: {},
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await listQa("achieve");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});

	it("returns error data on 404", async () => {
		const mockError = { message: "Not found" };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(404, mockError)));

		const result = await listQa("unknown");

		expect(result.status).toBe(404);
		expect(result.data).toEqual(mockError);
	});
});

describe("getQa", () => {
	it("returns single Q&A entry on success", async () => {
		const mockData = { data: { qnaNumber: 42, subject: "Is this legal?" }, meta: {} };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await getQa("achieve", "42");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});
});

describe("getQaRss", () => {
	it("returns raw string when content-type is RSS", async () => {
		const rssBody = `<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>`;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(makeMockResponse(200, rssBody, "application/rss+xml")),
		);

		const result = await getQaRss("achieve");

		expect(result.status).toBe(200);
		expect(result.data).toBe(rssBody);
	});

	it("returns parsed object when content-type is JSON", async () => {
		const jsonBody = { items: [] };
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(makeMockResponse(200, jsonBody, "application/json")),
		);

		const result = await getQaRss("achieve");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(jsonBody);
	});

	it("returns parsed error data on 404", async () => {
		const mockError = { message: "Program not found" };
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(makeMockResponse(404, mockError, "application/json")),
		);

		const result = await getQaRss("achieve");

		expect(result.status).toBe(404);
		expect(result.data).toEqual(mockError);
	});
});

describe("listRuleQa", () => {
	it("returns rule Q&A list on success", async () => {
		const mockData = {
			data: {
				ruleStableKey: "R1",
				questions: [],
				pagination: { total: 0, limit: 25, offset: 0 },
			},
			meta: {},
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await listRuleQa("achieve", "R1");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});

	it("calls fetch with correct URL including rule key", async () => {
		const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
		vi.stubGlobal("fetch", mockFetch);

		await listRuleQa("achieve", "R1");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://games.recf.org/api/v1/programs/achieve/rules/R1/qa",
			expect.objectContaining({ method: "GET" }),
		);
	});
});
