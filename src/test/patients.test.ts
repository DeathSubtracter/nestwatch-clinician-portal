import { describe, expect, it } from "vitest";
import { getPatients, searchPatients } from "@/data/patients";
import { dashboard, snapshot } from "./dashboardFixture";

describe("patient directory and search", () => {
  const patients = getPatients(dashboard);
  it("contains only the exported patient", () => {
    expect(patients).toHaveLength(1);
    expect(patients[0]?.id).toBe(snapshot.patient.patient_id);
    expect(patients[0]?.name).toBe(snapshot.patient.display_name);
  });
  it("finds Maya by name", () =>
    expect(searchPatients(patients, "maya").map((p) => p.id)).toEqual(["maya"]));
  it("finds Maya by condition", () => expect(searchPatients(patients, "diabetes")).toHaveLength(1));
  it("returns nothing for unmatched text", () =>
    expect(searchPatients(patients, "zzz")).toHaveLength(0));
  it("does not create a directory while data is unavailable", () =>
    expect(getPatients(undefined)).toEqual([]));
});
