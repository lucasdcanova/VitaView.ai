import { describe, expect, it } from "vitest";
import { getAllowedMimeTypes } from "./upload.middleware";

describe("getAllowedMimeTypes", () => {
  it("returns default mime types when only extension is provided", () => {
    const allowed = getAllowedMimeTypes("pdf");
    expect(allowed).toContain("application/pdf");
    expect(allowed).not.toContain("text/plain");
  });

  it("includes known category mime types such as medical-records", () => {
    const allowed = getAllowedMimeTypes("medical-records");
    expect(allowed).toEqual(
      expect.arrayContaining([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ]),
    );
  });

  it("falls back to default list for unknown categories", () => {
    const allowed = getAllowedMimeTypes("my-custom-type");
    expect(allowed).toEqual(
      expect.arrayContaining([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ]),
    );
  });
});
