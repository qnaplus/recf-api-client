import { afterEach, describe, expect, it, vi } from "vitest";
import {
	exportManualPdf,
	getChangelog,
	getDefinition,
	getExportManualPdfUrl,
	getGetChangelogUrl,
	getGetDefinitionUrl,
	getGetLatestManualUrl,
	getGetManualBundleUrl,
	getGetManualUrl,
	getGetRuleUrl,
	getManual,
	getRule,
	getSearchManualUrl,
} from "../src/manual/manual";
import { makeMockResponse } from "./helpers";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("URL builders", () => {
	it("getGetLatestManualUrl", () => {
		expect(getGetLatestManualUrl("achieve")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual",
		);
	});

	it("getGetManualUrl", () => {
		expect(getGetManualUrl("achieve", "1.0")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0",
		);
	});

	it("getGetManualBundleUrl", () => {
		expect(getGetManualBundleUrl("achieve", "1.0")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/bundle",
		);
	});

	it("getGetChangelogUrl", () => {
		expect(getGetChangelogUrl("achieve", "1.0")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/changelog",
		);
	});

	it("getSearchManualUrl without params", () => {
		expect(getSearchManualUrl("achieve", "1.0")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/search",
		);
	});

	it("getSearchManualUrl with params", () => {
		const url = getSearchManualUrl("achieve", "1.0", { q: "robot skills" });
		expect(url).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/search?q=robot+skills",
		);
	});

	it("getSearchManualUrl skips undefined params", () => {
		const url = getSearchManualUrl("achieve", "1.0", {});
		expect(url).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/search",
		);
	});

	it("getExportManualPdfUrl without params", () => {
		expect(getExportManualPdfUrl("achieve", "1.0")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/export.pdf",
		);
	});

	it("getExportManualPdfUrl with params", () => {
		const url = getExportManualPdfUrl("achieve", "1.0", { includeQa: true });
		expect(url).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/export.pdf?includeQa=true",
		);
	});

	it("getGetRuleUrl", () => {
		expect(getGetRuleUrl("achieve", "1.0", "R1")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/rules/R1",
		);
	});

	it("getGetDefinitionUrl", () => {
		expect(getGetDefinitionUrl("achieve", "1.0", "D1")).toBe(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0/definitions/D1",
		);
	});
});

describe("getManual", () => {
	it("returns parsed data and status 200 on success", async () => {
		const mockData = { data: { versionLabel: "1.0" }, meta: {} };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await getManual("achieve", "1.0");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});

	it("returns parsed error and status 404", async () => {
		const mockError = { message: "Not found" };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(404, mockError)));

		const result = await getManual("achieve", "1.0");

		expect(result.status).toBe(404);
		expect(result.data).toEqual(mockError);
	});

	it("calls fetch with correct URL and GET method", async () => {
		const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
		vi.stubGlobal("fetch", mockFetch);

		await getManual("achieve", "1.0");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://games.recf.org/api/v1/programs/achieve/manual/1.0",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("passes through request options", async () => {
		const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, {}));
		vi.stubGlobal("fetch", mockFetch);

		await getManual("achieve", "1.0", { headers: { "x-custom": "value" } });

		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ headers: { "x-custom": "value" } }),
		);
	});
});

describe("getChangelog", () => {
	it("returns empty data for 304 (no-body) response", async () => {
		const mockRes = makeMockResponse(304, {});
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockRes));

		const result = await getChangelog("achieve", "1.0");

		expect(result.status).toBe(304);
		expect(mockRes.text).not.toHaveBeenCalled();
	});
});

describe("exportManualPdf", () => {
	it("calls res.blob() instead of res.text()", async () => {
		const mockRes = makeMockResponse(200, "");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockRes));

		await exportManualPdf("achieve", "1.0");

		expect(mockRes.blob).toHaveBeenCalled();
		expect(mockRes.text).not.toHaveBeenCalled();
	});

	it("returns status 200 with blob data", async () => {
		const mockRes = makeMockResponse(200, "");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockRes));

		const result = await exportManualPdf("achieve", "1.0");

		expect(result.status).toBe(200);
		expect(result.data).toBeInstanceOf(Blob);
	});
});

describe("getRule", () => {
	it("returns parsed rule on success", async () => {
		const mockData = { data: { key: "R1", content: "Rule content" }, meta: {} };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await getRule("achieve", "1.0", "R1");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});
});

describe("getDefinition", () => {
	it("returns parsed definition on success", async () => {
		const mockData = { data: { key: "D1", content: "Definition content" }, meta: {} };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await getDefinition("achieve", "1.0", "D1");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});

	it("returns error data on 404", async () => {
		const mockError = { message: "Not found" };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(404, mockError)));

		const result = await getDefinition("achieve", "1.0", "D1");

		expect(result.status).toBe(404);
		expect(result.data).toEqual(mockError);
	});
});
