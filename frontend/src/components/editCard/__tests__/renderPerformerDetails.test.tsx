import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { screen, within } from "@testing-library/react";
import {
  BreastTypeEnum,
  EthnicityEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  ImageCategorizationFragmentDoc,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument,
  ImageTypeScopeEnum,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it } from "vitest";
import {
  type OldPerformerDetails,
  type PerformerDetails,
  renderPerformerDetails,
} from "../ModifyEdit";

const render = (
  neu: PerformerDetails,
  old: OldPerformerDetails | undefined,
  showDiff: boolean,
  setModifyAliases = false,
) =>
  renderForm(
    <div data-testid="root">
      {renderPerformerDetails(neu, old, showDiff, setModifyAliases)}
    </div>,
  );

const rowFor = (label: string) =>
  screen.getByText(label).closest(".row") as HTMLElement;

const site = (id: string) => ({
  id,
  name: `site-${id}`,
  icon: `icon-${id}`,
});

describe("renderPerformerDetails", () => {
  describe("create flow", () => {
    it("renders every scalar field for a fully-populated new performer", () => {
      render(
        {
          name: "Jane Doe",
          disambiguation: "actress",
          gender: GenderEnum.FEMALE,
          birthdate: "1990-01-01",
          deathdate: "2024-09-09",
          career_start_year: 2010,
          career_end_year: 2024,
          height: 170,
          band_size: 32,
          cup_size: "C",
          waist_size: 24,
          hip_size: 34,
          breast_type: BreastTypeEnum.NATURAL,
          country: "US",
          ethnicity: EthnicityEnum.CAUCASIAN,
          eye_color: EyeColorEnum.BLUE,
          hair_color: HairColorEnum.BLONDE,
        },
        undefined,
        false,
      );
      expect(within(rowFor("Name")).getByText("Jane Doe")).toBeInTheDocument();
      expect(
        within(rowFor("Disambiguation")).getByText("actress"),
      ).toBeInTheDocument();
      // GenderTypes maps FEMALE -> "Female"
      expect(within(rowFor("Gender")).getByText("Female")).toBeInTheDocument();
      expect(
        within(rowFor("Birthdate")).getByText("1990-01-01"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Deathdate")).getByText("2024-09-09"),
      ).toBeInTheDocument();
      expect(within(rowFor("Eye Color")).getByText("Blue")).toBeInTheDocument();
      expect(
        within(rowFor("Hair Color")).getByText("Blond"),
      ).toBeInTheDocument();
      expect(within(rowFor("Height")).getByText("170")).toBeInTheDocument();
      // BreastTypes NATURAL -> "Natural"
      expect(
        within(rowFor("Breast Type")).getByText("Natural"),
      ).toBeInTheDocument();
      // Bra Size composes band + cup
      expect(within(rowFor("Bra Size")).getByText("32C")).toBeInTheDocument();
      expect(within(rowFor("Waist Size")).getByText("24")).toBeInTheDocument();
      expect(within(rowFor("Hip Size")).getByText("34")).toBeInTheDocument();
      // Country resolves ISO code to full name
      expect(
        within(rowFor("Nationality")).getByText("United States"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Ethnicity")).getByText("Caucasian"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Career Start")).getByText("2010"),
      ).toBeInTheDocument();
      expect(
        within(rowFor("Career End")).getByText("2024"),
      ).toBeInTheDocument();
    });

    it("renders added body modifications using location (description) format", () => {
      render(
        {
          name: "X",
          added_tattoos: [{ location: "arm", description: "rose" }],
          added_piercings: [{ location: "ear", description: null }],
        },
        undefined,
        false,
      );
      expect(
        within(rowFor("Tattoos")).getByText("arm (rose)"),
      ).toBeInTheDocument();
      expect(within(rowFor("Piercings")).getByText("ear")).toBeInTheDocument();
    });

    it("renders added URLs and added images", () => {
      render(
        {
          name: "X",
          added_urls: [{ url: "https://a.example", site: site("1") }],
          added_images: [{ id: "i-1", url: "u", width: 100, height: 200 }],
        },
        undefined,
        false,
      );
      expect(
        screen.getByRole("link", { name: "https://a.example" }),
      ).toBeInTheDocument();
      expect(screen.getByText("100 x 200")).toBeInTheDocument();
    });

    it("renders a draft-submitted indicator when draft_id is present", () => {
      render({ name: "X", draft_id: "draft-1" }, undefined, false);
      expect(screen.getByText("Submitted by draft")).toBeInTheDocument();
    });

    it("does not render the alias indicator when there's no old name", () => {
      render({ name: "X" }, undefined, false);
      expect(
        screen.queryByText("Set performance aliases to old name"),
      ).toBeNull();
    });
  });

  describe("modify flow", () => {
    it("renders both name and Bra Size as diff", () => {
      render(
        { name: "Janet", band_size: 34, cup_size: "D" },
        { name: "Jane", band_size: 32, cup_size: "C" },
        true,
      );
      const nameRow = rowFor("Name");
      expect(nameRow.querySelector(".bg-danger")).toHaveTextContent("Jane");
      expect(nameRow.querySelector(".bg-success")).toHaveTextContent("Janet");
      const bra = rowFor("Bra Size");
      expect(bra.querySelector(".bg-danger")).toHaveTextContent("32C");
      expect(bra.querySelector(".bg-success")).toHaveTextContent("34D");
    });

    it("formats enum values on both sides (gender, breast type, eye, hair, ethnicity)", () => {
      render(
        {
          gender: GenderEnum.MALE,
          breast_type: BreastTypeEnum.NA,
          eye_color: EyeColorEnum.BROWN,
          hair_color: HairColorEnum.BLACK,
          ethnicity: EthnicityEnum.ASIAN,
        },
        {
          gender: GenderEnum.FEMALE,
          breast_type: BreastTypeEnum.NATURAL,
          eye_color: EyeColorEnum.BLUE,
          hair_color: HairColorEnum.BLONDE,
          ethnicity: EthnicityEnum.CAUCASIAN,
        },
        true,
      );
      const gender = rowFor("Gender");
      expect(gender.querySelector(".bg-danger")).toHaveTextContent("Female");
      expect(gender.querySelector(".bg-success")).toHaveTextContent("Male");
      const breast = rowFor("Breast Type");
      expect(breast.querySelector(".bg-danger")).toHaveTextContent("Natural");
      expect(breast.querySelector(".bg-success")).toHaveTextContent("N/A");
      const eye = rowFor("Eye Color");
      expect(eye.querySelector(".bg-danger")).toHaveTextContent("Blue");
      expect(eye.querySelector(".bg-success")).toHaveTextContent("Brown");
      const hair = rowFor("Hair Color");
      expect(hair.querySelector(".bg-danger")).toHaveTextContent("Blond");
      expect(hair.querySelector(".bg-success")).toHaveTextContent("Black");
      const eth = rowFor("Ethnicity");
      expect(eth.querySelector(".bg-danger")).toHaveTextContent("Caucasian");
      expect(eth.querySelector(".bg-success")).toHaveTextContent("Asian");
    });

    it("renders tattoo/piercing add/remove side-by-side", () => {
      render(
        {
          added_tattoos: [{ location: "arm", description: "rose" }],
          removed_tattoos: [{ location: "leg" }],
          added_piercings: [{ location: "nose" }],
          removed_piercings: [{ location: "ear", description: "stud" }],
        },
        {},
        true,
      );
      const tats = rowFor("Tattoos");
      expect(tats.querySelector(".bg-danger")).toHaveTextContent("leg");
      expect(tats.querySelector(".bg-success")).toHaveTextContent("arm (rose)");
      const pierc = rowFor("Piercings");
      expect(pierc.querySelector(".bg-danger")).toHaveTextContent("ear (stud)");
      expect(pierc.querySelector(".bg-success")).toHaveTextContent("nose");
    });

    it("renders URL add and remove sections", () => {
      render(
        {
          added_urls: [{ url: "https://new.example", site: site("a") }],
          removed_urls: [{ url: "https://old.example", site: site("b") }],
        },
        {},
        true,
      );
      expect(screen.getByText("Removed")).toBeInTheDocument();
      expect(screen.getByText("Added")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "https://old.example" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "https://new.example" }),
      ).toBeInTheDocument();
    });

    it("formats nationality from ISO code on both sides", () => {
      render({ country: "JP" }, { country: "US" }, true);
      const row = rowFor("Nationality");
      expect(row.querySelector(".bg-danger")).toHaveTextContent(
        "United States",
      );
      expect(row.querySelector(".bg-success")).toHaveTextContent("Japan");
    });
  });

  describe("name-change alias indicator", () => {
    it("shows the indicator with a green check when setModifyAliases is true", () => {
      const { container } = render(
        { name: "Janet" },
        { name: "Jane" },
        true,
        true,
      );
      const text = screen.getByText("Set performance aliases to old name");
      const wrapper = text.closest(".d-flex") as HTMLElement;
      const icon = wrapper.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("color")).toBe("green");
      void container;
    });

    it("shows the indicator with a red xmark when setModifyAliases is false", () => {
      render({ name: "Janet" }, { name: "Jane" }, true, false);
      const text = screen.getByText("Set performance aliases to old name");
      const wrapper = text.closest(".d-flex") as HTMLElement;
      const icon = wrapper.querySelector("svg");
      expect(icon?.getAttribute("color")).toBe("red");
    });

    it("does not show the indicator when the name is unchanged", () => {
      render({ name: "Jane" }, { name: "Jane" }, true, true);
      expect(
        screen.queryByText("Set performance aliases to old name"),
      ).toBeNull();
    });
  });

  describe("no-op", () => {
    it("renders no rows when all fields are absent/empty", () => {
      const { container } = render({}, {}, true);
      const root = container.querySelector(
        '[data-testid="root"]',
      ) as HTMLElement;
      // No labels should appear because every ChangeRow checks newValue||oldValue
      for (const label of [
        "Name",
        "Disambiguation",
        "Gender",
        "Birthdate",
        "Deathdate",
        "Eye Color",
        "Hair Color",
        "Height",
        "Breast Type",
        "Waist Size",
        "Hip Size",
        "Nationality",
        "Ethnicity",
        "Career Start",
        "Career End",
        "Tattoos",
        "Piercings",
        "Links",
        "Images",
      ]) {
        expect(within(root).queryByText(label)).toBeNull();
      }
    });
  });
});

describe("added/removed images", () => {
  const image = (id: string, types: string[] = []) => ({
    id,
    url: `url-${id}`,
    width: 400,
    height: 600,
    types,
  });

  it("shows an added image, grouped as added", () => {
    const added = image("img-new", ["SHOT_PORTRAIT"]);
    render({ added_images: [added] }, undefined, true);

    const row = rowFor("Images");

    expect(row.querySelectorAll(".ImageChangeRow-image")).toHaveLength(1);
    expect(within(row).getByText("Added")).toBeInTheDocument();
  });

  it("renders nothing when nothing about the images changed", () => {
    render({ added_images: [], removed_images: [] }, undefined, true);
    expect(screen.queryByText("Images")).not.toBeInTheDocument();
  });

  it("gives every cell its own image's aspect ratio", () => {
    const wide = {
      id: "img-wide",
      url: "u-wide",
      width: 1600,
      height: 900,
      types: [],
    };
    const tall = {
      id: "img-tall",
      url: "u-tall",
      width: 400,
      height: 600,
      types: [],
    };
    render({ added_images: [wide, tall] }, undefined, true);

    const row = rowFor("Images");
    const frames = row.querySelectorAll<HTMLElement>("button.Image");
    expect(frames).toHaveLength(2);
    expect(frames[0].style.aspectRatio).toBe("1600/900");
    expect(frames[1].style.aspectRatio).toBe("400/600");
  });
});

describe("the lightbox opened from an edit diff", () => {
  const vocabulary = {
    request: {
      query: ImageTypeGroupsDocument,
      variables: {
        target: ImageTypeScopeEnum.PERFORMER,
        includeDisabled: true,
      },
    },
    result: { data: { imageTypeGroups: [] } },
  };

  it.each([
    "added",
    "removed",
  ] as const)("keeps the %s gallery separate from the other side", async (side) => {
    const image = (id: string) => ({
      id,
      url: `url-${id}`,
      width: 400,
      height: 600,
    });
    const { user } = renderForm(
      <div>
        {renderPerformerDetails(
          {
            added_images: [image("added-1"), image("added-2")],
            removed_images: [image("removed-1"), image("removed-2")],
          },
          undefined,
          true,
        )}
      </div>,
      { mocks: [vocabulary] },
    );
    const frames = document.querySelectorAll(".ImageChangeRow-image button");
    await user.click(frames[side === "removed" ? 0 : 2] as HTMLElement);
    const dialog = screen.getByRole("dialog");
    const thumbnails = dialog.querySelectorAll(".ImageLightbox-thumb img");
    expect([...thumbnails].map((image) => image.getAttribute("src"))).toEqual([
      `url-${side}-1?size=300`,
      `url-${side}-2?size=300`,
    ]);
    expect(dialog.querySelector(".ImageLightbox-caption")).toHaveTextContent(
      "1/2",
    );
    await user.click(
      dialog.querySelectorAll(".ImageLightbox-thumb")[1] as HTMLElement,
    );
    expect(dialog.querySelector(".ImageLightbox-main img")).toHaveAttribute(
      "src",
      `url-${side}-2?size=full`,
    );
  });

  it("shows categorization tags without the categorization section", async () => {
    const cache = new InMemoryCache();
    cache.writeFragment({
      id: "Image:img-new",
      fragment: ImageCategorizationFragmentDoc,
      data: {
        __typename: "Image",
        id: "img-new",
        types: [ImageTypeEnum.CROP_FACE],
        date: "2019-06-15",
        organized: false,
      },
    });
    cache.writeQuery({
      query: ImageTypeGroupsDocument,
      variables: vocabulary.request.variables,
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
    const { user } = renderForm(
      <MockedProvider cache={cache}>
        {renderPerformerDetails(
          {
            added_images: [
              {
                id: "img-new",
                url: "url-new",
                width: 400,
                height: 600,
                types: [ImageTypeEnum.CROP_FACE],
                date: "2019-06-15",
              },
            ],
          },
          undefined,
          true,
        )}
      </MockedProvider>,
    );
    await user.click(
      document.querySelector(".ImageChangeRow-image button") as HTMLElement,
    );
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("400×600")).toBeInTheDocument();
    expect(
      within(modal).queryByRole("button", { name: "Categorization" }),
    ).toBeNull();
    expect(within(modal).getByText("Face")).toBeInTheDocument();
    expect(modal.querySelector(".ImageLightbox-editor")).toBeNull();
    expect(within(modal).getByText("2019-06-15")).toBeInTheDocument();
  });
});
