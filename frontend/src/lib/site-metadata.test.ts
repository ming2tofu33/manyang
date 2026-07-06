import { describe, expect, test } from "vitest";

import { manyangAssets } from "./manyang-assets";
import { rootMetadata, socialShareImage } from "./site-metadata";

describe("site metadata", () => {
  test("uses the black cat image as the shared link preview", () => {
    expect(socialShareImage).toEqual({
      url: manyangAssets.social.sharePreview,
      width: 1200,
      height: 1200,
      alt: "마법 모자를 쓴 검은 고양이가 오브를 읽는 마냥 꿈해몽 대표 이미지",
    });

    expect(rootMetadata.openGraph).toMatchObject({
      images: [socialShareImage],
      locale: "ko_KR",
      type: "website",
    });
    expect(rootMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [socialShareImage],
    });
    expect(rootMetadata.other).toEqual({
      "aim-verification": "aim_verify_DyhIum5PLQGrXmHFh4GLKoKHgUQEIQcL",
    });
  });
});
