import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getGetProgramUrl,
	getListProgramsUrl,
	getProgram,
	listPrograms,
} from "../src/programs/programs";
import { makeMockResponse } from "./helpers";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("URL builders", () => {
	it("getListProgramsUrl", () => {
		expect(getListProgramsUrl()).toBe("https://games.recf.org/api/v1/programs");
	});

	it("getGetProgramUrl", () => {
		expect(getGetProgramUrl("achieve")).toBe(
			"https://games.recf.org/api/v1/programs/achieve",
		);
	});
});

describe("listPrograms", () => {
	it("returns program list on success", async () => {
		const mockData = { data: [{ slug: "achieve", name: "Achieve" }], meta: {} };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await listPrograms();

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});

	it("calls fetch with GET method", async () => {
		const mockFetch = vi.fn().mockResolvedValue(makeMockResponse(200, { data: [], meta: {} }));
		vi.stubGlobal("fetch", mockFetch);

		await listPrograms();

		expect(mockFetch).toHaveBeenCalledWith(
			"https://games.recf.org/api/v1/programs",
			expect.objectContaining({ method: "GET" }),
		);
	});
});

describe("getProgram", () => {
	it("returns program data on success", async () => {
		const mockData = { data: { slug: "achieve", name: "Achieve" }, meta: {} };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(200, mockData)));

		const result = await getProgram("achieve");

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockData);
	});

	it("returns error data on 404", async () => {
		const mockError = { message: "Program not found" };
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeMockResponse(404, mockError)));

		const result = await getProgram("unknown");

		expect(result.status).toBe(404);
		expect(result.data).toEqual(mockError);
	});
});
