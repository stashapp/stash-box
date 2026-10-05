import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Choose an option from a react-select. If `container` is provided, the input
 * is queried within it; otherwise the first react-select on the page is used.
 */
export const selectReactSelect = async (
  user: UserEvent,
  label: string,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const input = root.querySelector(
    ".react-select__input",
  ) as HTMLInputElement | null;
  if (!input) throw new Error("react-select input not found");
  await user.click(input);
  await user.type(input, label);
  const option = await screen.findByText(label, {
    selector: "[class*='react-select__option']",
  });
  await user.click(option);
};

/**
 * Find the react-select container that owns a given input element (used when
 * multiple selects exist on the page and queries need disambiguation).
 */
export const reactSelectFor = (input: HTMLElement) =>
  input.closest(".form-group") ?? input.parentElement ?? document.body;

/**
 * Type a value into a CreatableSelect (react-select/creatable) and press Enter
 * to commit it as a new option. Use this for free-form lists like aliases.
 */
export const addCreatableOption = async (
  user: UserEvent,
  value: string,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const input = root.querySelector(
    ".react-select__input",
  ) as HTMLInputElement | null;
  if (!input) throw new Error("react-select input not found");
  await user.click(input);
  await user.type(input, value);
  await user.keyboard("{Enter}");
};

/**
 * Click the "X" remove button on a react-select multi-value (the last one by
 * default, or the one matching the given label).
 */
export const removeMultiValue = async (
  user: UserEvent,
  label: string,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const value = Array.from(
    root.querySelectorAll(".react-select__multi-value"),
  ).find((el) => el.textContent?.includes(label));
  if (!value) throw new Error(`multi-value "${label}" not found`);
  const removeBtn = value.querySelector(
    ".react-select__multi-value__remove",
  ) as HTMLElement | null;
  if (!removeBtn) throw new Error(`remove button for "${label}" not found`);
  await user.click(removeBtn);
};
