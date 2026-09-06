import { useCallback } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";

export const usePendingURLField = <T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  name: Path<T>,
) =>
  useCallback(
    (pendingURL: string) => {
      setValue(name, pendingURL as PathValue<T, Path<T>>, {
        shouldValidate: true,
      });
    },
    [name, setValue],
  );
