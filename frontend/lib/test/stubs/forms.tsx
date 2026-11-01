import type { Lens } from "@hookform/lenses";
import { type BodyMod, STUB_URL_1, STUB_URL_2 } from "lib/test/fixtures/forms";
import type { FC } from "react";
import { useFieldArray } from "react-hook-form";

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
