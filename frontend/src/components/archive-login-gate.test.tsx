import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ArchiveLoginGate, archiveLoginHref, getArchiveLoginGateCopy } from "./archive-login-gate";

describe("ArchiveLoginGate", () => {
  test("links guests to auth for archive access", () => {
    expect(archiveLoginHref).toBe("/auth?next=%2Farchive");
  });

  test("explains that archive storage needs login", () => {
    expect(getArchiveLoginGateCopy().body.length).toBeGreaterThan(20);
    expect(getArchiveLoginGateCopy().buttonLabel.length).toBeGreaterThan(0);
  });

  test("renders the archive login CTA", () => {
    const markup = renderToStaticMarkup(<ArchiveLoginGate />);

    expect(markup).toContain('data-archive-login-gate="true"');
    expect(markup).toContain(archiveLoginHref.replace("&", "&amp;"));
    expect(markup).toContain(getArchiveLoginGateCopy().title);
    expect(markup).toContain(getArchiveLoginGateCopy().buttonLabel);
  });
});
