import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import {
  ImageCategorizationFragmentDoc,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument,
  ImageTypeScopeEnum,
} from "src/graphql";
import { describe, expect, it } from "vitest";
import ImageLightbox from "../ImageLightbox";

describe("ImageLightbox cached labels", () => {
  it("observes applied cache changes, including removing all labels", async () => {
    const cache = new InMemoryCache();
    const write = (types: ImageTypeEnum[], date: string | null = null) =>
      cache.writeFragment({
        id: "Image:1",
        fragment: ImageCategorizationFragmentDoc,
        data: { __typename: "Image", id: "1", types, date, organized: false },
      });
    write([]);
    cache.writeQuery({
      query: ImageTypeGroupsDocument,
      variables: {
        target: ImageTypeScopeEnum.PERFORMER,
        includeDisabled: true,
      },
      data: {
        __typename: "Query",
        imageTypeGroups: [
          {
            __typename: "ImageTypeGroup",
            key: ImageTypeGroupEnum.CROP,
            name: "Crop",
            description: null,
            enabled: true,
            types: [
              {
                __typename: "ImageType",
                key: ImageTypeEnum.CROP_FACE,
                name: "Face",
                description: null,
                enabled: true,
                conflicts_with: [],
              },
            ],
          },
        ],
      },
    });
    render(
      <MockedProvider cache={cache}>
        <ImageLightbox
          images={[{ id: "1", url: "/1.jpg", width: 100, height: 100 }]}
          categorization
          labels={{ "1": ["Stale"] }}
          onClose={() => {}}
        />
      </MockedProvider>,
    );
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
    await act(async () => {
      write([ImageTypeEnum.CROP_FACE], "2020-01-01");
    });
    await waitFor(() => expect(screen.getAllByText("Face")).toHaveLength(2));
    expect(screen.getAllByText("2020-01-01")).toHaveLength(2);
    await act(async () => {
      write([]);
    });
    await waitFor(() =>
      expect(screen.queryByText("Face")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("2020-01-01")).not.toBeInTheDocument();
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
  });
});
