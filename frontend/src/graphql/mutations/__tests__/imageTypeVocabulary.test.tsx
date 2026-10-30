import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument,
  ImageTypeScopeEnum,
  SetImageTypeEnabledDocument,
  UpdateImageTypeOrderDocument,
  useImageTypeGroups,
  useSetImageTypeEnabled,
  useUpdateImageTypeOrder,
} from "src/graphql";
import { describe, expect, it } from "vitest";

const group = (enabled: boolean, name: string) => ({
  __typename: "ImageTypeGroup" as const,
  key: ImageTypeGroupEnum.SHOT,
  name,
  description: null,
  enabled,
  types: [],
});
const admin = { includeDisabled: true };
const picker = { target: ImageTypeScopeEnum.PERFORMER, includeDisabled: false };
const inactive = { target: ImageTypeScopeEnum.SCENE, includeDisabled: true };

describe("image type vocabulary saves", () => {
  for (const action of ["enabled", "order"] as const) {
    it(`refreshes active variants and invalidates inactive variants after saving ${action}`, async () => {
      const cache = new InMemoryCache();
      for (const variables of [admin, picker, inactive]) {
        cache.writeQuery({
          query: ImageTypeGroupsDocument,
          variables,
          data: {
            __typename: "Query" as const,
            imageTypeGroups: [group(true, "Old settings")],
          },
        });
      }
      const input =
        action === "enabled"
          ? { disabled_groups: [ImageTypeGroupEnum.SHOT], disabled_types: [] }
          : { groups: [ImageTypeGroupEnum.SHOT], types: [] };
      const mocks = [
        {
          request: {
            query:
              action === "enabled"
                ? SetImageTypeEnabledDocument
                : UpdateImageTypeOrderDocument,
            variables: { input },
          },
          result: {
            data:
              action === "enabled"
                ? { imageTypeSetEnabled: [group(false, "Saved settings")] }
                : { imageTypeOrderUpdate: [group(false, "Saved settings")] },
          },
        },
        ...[admin, picker].map((variables) => ({
          request: { query: ImageTypeGroupsDocument, variables },
          delay: 30,
          result: {
            data: {
              __typename: "Query" as const,
              imageTypeGroups: [group(false, "Saved settings")],
            },
          },
        })),
      ];
      const { result } = renderHook(
        () => {
          const adminQuery = useImageTypeGroups(admin);
          const pickerQuery = useImageTypeGroups(picker);
          const [setEnabled] = useSetImageTypeEnabled();
          const [updateOrder] = useUpdateImageTypeOrder();
          return { adminQuery, pickerQuery, setEnabled, updateOrder };
        },
        {
          wrapper: ({ children }: { children: ReactNode }) => (
            <MockedProvider cache={cache} mocks={mocks}>
              {children}
            </MockedProvider>
          ),
        },
      );
      await waitFor(() =>
        expect(result.current.adminQuery.data?.imageTypeGroups[0].enabled).toBe(
          true,
        ),
      );
      await act(async () => {
        if (action === "enabled") {
          await result.current.setEnabled({
            variables: {
              input: {
                disabled_groups: [ImageTypeGroupEnum.SHOT],
                disabled_types: [],
              },
            },
          });
        } else {
          await result.current.updateOrder({
            variables: {
              input: {
                groups: [ImageTypeGroupEnum.SHOT],
                types: [],
              },
            },
          });
        }
      });
      for (const query of [
        result.current.adminQuery,
        result.current.pickerQuery,
      ]) {
        expect(query.data?.imageTypeGroups[0].enabled).toBe(false);
        expect(query.data?.imageTypeGroups[0].name).toBe("Saved settings");
      }
      expect(
        cache.readQuery({
          query: ImageTypeGroupsDocument,
          variables: inactive,
        }),
      ).toBeNull();
    });
  }
});
