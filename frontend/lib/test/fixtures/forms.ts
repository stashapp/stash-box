type UrlItem = {
  url: string;
  site: { id: string; name: string; icon: string };
};

export const STUB_URL_1: UrlItem = {
  url: "https://stub-a.example",
  site: { id: "site-stub-1", name: "StubA", icon: "icon-1" },
};
export const STUB_URL_2: UrlItem = {
  url: "https://stub-b.example",
  site: { id: "site-stub-2", name: "StubB", icon: "icon-2" },
};

export type BodyMod = { location: string; description?: string | null };

export const STUB_TATTOO_NEW: BodyMod = {
  location: "shoulder",
  description: "star",
};
export const STUB_PIERCING_NEW: BodyMod = {
  location: "nose",
  description: null,
};
