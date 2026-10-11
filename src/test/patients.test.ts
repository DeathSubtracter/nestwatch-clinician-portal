import { describe, expect, it } from "vitest";
import { getPatients, searchPatients } from "@/data/patients";
describe("patient search", () => {
  it("finds Maya by name", () => expect(searchPatients(getPatients(), "maya").map((p) => p.id)).toEqual(["maya"]));
  it("finds Maya by condition", () => expect(searchPatients(getPatients(), "diabetes")).toHaveLength(1));
  it("returns nothing for unmatched text", () => expect(searchPatients(getPatients(), "zzz")).toHaveLength(0));
});
