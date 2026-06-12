import type { ShareRecordKind } from "./share-records";

export type ShareResultLink = {
  id: string;
  path: string;
  url: string;
};

export type CreateShareResultLinkInput = {
  kind: ShareRecordKind;
  payload: unknown;
};

export type SharePublicLinkResult = "shared" | "copied" | "cancelled" | "unsupported";

type FetchLike = typeof fetch;

type NavigatorLike = {
  clipboard?: {
    writeText?: (text: string) => Promise<void>;
  };
  share?: (data: ShareData) => Promise<void>;
};

type SharePublicLinkInput = {
  navigatorLike?: NavigatorLike;
  text?: string;
  title: string;
  url: string;
};

function isShareResultLink(value: unknown): value is ShareResultLink {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ShareResultLink).id === "string" &&
    typeof (value as ShareResultLink).path === "string" &&
    typeof (value as ShareResultLink).url === "string"
  );
}

export async function createShareResultLink(
  input: CreateShareResultLinkInput,
  fetcher: FetchLike = fetch,
): Promise<ShareResultLink> {
  const response = await fetcher("/api/share-results", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to create share link.");
  }

  const body = (await response.json()) as unknown;

  if (!isShareResultLink(body)) {
    throw new Error("Share link response is malformed.");
  }

  return body;
}

export async function sharePublicLink({
  navigatorLike = globalThis.navigator,
  text,
  title,
  url,
}: SharePublicLinkInput): Promise<SharePublicLinkResult> {
  if (navigatorLike.share) {
    try {
      await navigatorLike.share(text ? { text, title, url } : { title, url });

      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  if (navigatorLike.clipboard?.writeText) {
    await navigatorLike.clipboard.writeText(url);

    return "copied";
  }

  return "unsupported";
}
