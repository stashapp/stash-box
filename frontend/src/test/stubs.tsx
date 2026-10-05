import type { Lens } from "@hookform/lenses";
import type { FC } from "react";
import { useFieldArray } from "react-hook-form";

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

interface LensProp {
  // biome-ignore lint/suspicious/noExplicitAny: lens shape varies across forms
  lens: Lens<any>;
}

export const URLInputStub: FC<LensProp> = ({ lens }) => {
  const { control, name } = lens.interop();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    keyName: "key",
  });
  return (
    <div data-testid="url-input-stub">
      <button
        type="button"
        data-testid="url-add-1"
        onClick={() => append(STUB_URL_1)}
      >
        Add URL 1
      </button>
      <button
        type="button"
        data-testid="url-add-2"
        onClick={() => append(STUB_URL_2)}
      >
        Add URL 2
      </button>
      {fields.map((f, i) => (
        <button
          key={(f as { key: string }).key}
          type="button"
          data-testid={`url-remove-${i}`}
          onClick={() => remove(i)}
        >
          Remove URL {i}
        </button>
      ))}
    </div>
  );
};

type BodyMod = { location: string; description?: string | null };

export const STUB_TATTOO_NEW: BodyMod = {
  location: "shoulder",
  description: "star",
};
export const STUB_PIERCING_NEW: BodyMod = {
  location: "nose",
  description: null,
};

export const makeBodyModStub =
  (newItem: BodyMod): FC<LensProp & { name?: string }> =>
  ({ lens }) => {
    const { control, name } = lens.interop();
    const { fields, append, remove } = useFieldArray({
      control,
      name,
      keyName: "key",
    });
    return (
      <div data-testid={`bodymod-stub-${name}`}>
        <button
          type="button"
          data-testid={`${name}-add`}
          onClick={() => append(newItem)}
        >
          Add {name}
        </button>
        {fields.map((f, i) => (
          <button
            key={(f as { key: string }).key}
            type="button"
            data-testid={`${name}-remove-${i}`}
            onClick={() => remove(i)}
          >
            Remove {name} {i}
          </button>
        ))}
      </div>
    );
  };
