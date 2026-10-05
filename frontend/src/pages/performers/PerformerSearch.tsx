import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBan,
  faCircleCheck,
  faCircleMinus,
  faEquals,
  faGreaterThan,
  faLessThan,
  faMagnifyingGlass,
  faNotEqual,
} from "@fortawesome/free-solid-svg-icons";
import Countries from "i18n-iso-countries";
import english from "i18n-iso-countries/langs/en.json";
import { sortBy } from "lodash-es";
import { type FC, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  InputGroup,
  Row,
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import { ErrorMessage, Icon } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import {
  BreastTypes,
  EthnicityFilterTypes,
  EyeColorTypes,
  GenderFilterTypes,
  HairColorTypes,
} from "src/constants";
import {
  BreastTypeEnum,
  CriterionModifier,
  EthnicityFilterEnum,
  EyeColorEnum,
  GenderFilterEnum,
  HairColorEnum,
  type PerformerQueryInput,
  PerformerSortEnum,
  SortDirectionEnum,
  usePerformers,
} from "src/graphql";
import { PerformerSort } from "./components";

const PER_PAGE = 25;
type Values = Record<string, string>;

Countries.registerLocale(english);
const countryOptions = [
  { label: "Unknown", value: "" },
  ...sortBy(
    Object.entries(Countries.getNames("en", { select: "alias" })).map(
      ([, countryName]) => ({
        label: countryName,
        value: Countries.getAlpha2Code(countryName, "en") ?? "",
      }),
    ),
    "label",
  ),
];

const comparableModifiers = [
  CriterionModifier.EQUALS,
  CriterionModifier.NOT_EQUALS,
  CriterionModifier.GREATER_THAN,
  CriterionModifier.LESS_THAN,
  CriterionModifier.IS_NULL,
  CriterionModifier.NOT_NULL,
];
const stringModifiers = [
  CriterionModifier.INCLUDES,
  CriterionModifier.EQUALS,
  CriterionModifier.NOT_EQUALS,
  CriterionModifier.IS_NULL,
  CriterionModifier.NOT_NULL,
];
const enumModifiers = [
  CriterionModifier.EQUALS,
  CriterionModifier.NOT_EQUALS,
  CriterionModifier.IS_NULL,
  CriterionModifier.NOT_NULL,
];

const modifierLabels: Record<CriterionModifier, string> = {
  [CriterionModifier.EQUALS]: "equals",
  [CriterionModifier.NOT_EQUALS]: "does not equal",
  [CriterionModifier.GREATER_THAN]: "greater than",
  [CriterionModifier.LESS_THAN]: "less than",
  [CriterionModifier.IS_NULL]: "unpopulated",
  [CriterionModifier.NOT_NULL]: "populated",
  [CriterionModifier.INCLUDES]: "contains",
  [CriterionModifier.INCLUDES_ALL]: "contains all",
  [CriterionModifier.EXCLUDES]: "does not contain",
};

const modifierIcons: Record<CriterionModifier, IconDefinition> = {
  [CriterionModifier.EQUALS]: faEquals,
  [CriterionModifier.NOT_EQUALS]: faNotEqual,
  [CriterionModifier.GREATER_THAN]: faGreaterThan,
  [CriterionModifier.LESS_THAN]: faLessThan,
  [CriterionModifier.IS_NULL]: faCircleMinus,
  [CriterionModifier.NOT_NULL]: faCircleCheck,
  [CriterionModifier.INCLUDES]: faMagnifyingGlass,
  [CriterionModifier.INCLUDES_ALL]: faMagnifyingGlass,
  [CriterionModifier.EXCLUDES]: faBan,
};

interface CriterionFieldProps {
  label: string;
  name: string;
  type?: string;
  values: Values;
  setValue: (name: string, value: string) => void;
  modifiers?: CriterionModifier[];
}

interface ModifierDropdownProps {
  label: string;
  modifier: CriterionModifier;
  modifiers: CriterionModifier[];
  onChange: (modifier: CriterionModifier) => void;
}

const ModifierDropdown: FC<ModifierDropdownProps> = ({
  label,
  modifier,
  modifiers,
  onChange,
}) => (
  <Dropdown>
    <Dropdown.Toggle
      variant="secondary"
      aria-label={`${label} comparison: ${modifierLabels[modifier]}`}
      title={modifierLabels[modifier]}
    >
      <Icon icon={modifierIcons[modifier]} />
    </Dropdown.Toggle>
    <Dropdown.Menu>
      {modifiers.map((option) => (
        <Dropdown.Item
          key={option}
          active={option === modifier}
          onClick={() => onChange(option)}
        >
          {modifierLabels[option]}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  </Dropdown>
);

const CriterionField: FC<CriterionFieldProps> = ({
  label,
  name,
  type = "text",
  values,
  setValue,
  modifiers = comparableModifiers,
}) => {
  const modifier =
    (values[`${name}_modifier`] as CriterionModifier) || modifiers[0];
  const noValue =
    modifier === CriterionModifier.IS_NULL ||
    modifier === CriterionModifier.NOT_NULL;
  return (
    <Form.Group as={Col} sm={6} md={4} lg={3} className="mb-3">
      <Form.Label>{label}</Form.Label>
      <InputGroup>
        <ModifierDropdown
          label={label}
          modifier={modifier}
          modifiers={modifiers}
          onChange={(option) => setValue(`${name}_modifier`, option)}
        />
        <Form.Control
          aria-label={label}
          type={type}
          value={values[name] ?? ""}
          disabled={noValue}
          onChange={(event) => setValue(name, event.currentTarget.value)}
        />
      </InputGroup>
    </Form.Group>
  );
};

const toCriterion = (
  values: Values,
  name: string,
  numeric = false,
  defaultModifier = numeric
    ? CriterionModifier.EQUALS
    : CriterionModifier.INCLUDES,
): { value: never; modifier: CriterionModifier } | undefined => {
  const modifier =
    (values[`${name}_modifier`] as CriterionModifier) || defaultModifier;
  const isNull =
    modifier === CriterionModifier.IS_NULL ||
    modifier === CriterionModifier.NOT_NULL;
  if (!isNull && !values[name]) return undefined;
  const value = numeric ? Number(values[name] || 0) : values[name] || "";
  return { value: value as never, modifier };
};

const toEnumCriterion = (values: Values, name: string) => {
  const modifier =
    (values[`${name}_modifier`] as CriterionModifier) ||
    CriterionModifier.EQUALS;
  const isNull =
    modifier === CriterionModifier.IS_NULL ||
    modifier === CriterionModifier.NOT_NULL;
  if (!isNull && !values[name]) return undefined;
  return { value: values[name] || undefined, modifier };
};

const buildInput = (values: Values): PerformerQueryInput => {
  return {
    names: values.names || undefined,
    disambiguation: toCriterion(values, "disambiguation"),
    gender: (values.gender as GenderFilterEnum) || undefined,
    birthdate: toCriterion(
      values,
      "birthdate",
      false,
      CriterionModifier.EQUALS,
    ),
    deathdate: toCriterion(
      values,
      "deathdate",
      false,
      CriterionModifier.EQUALS,
    ),
    birth_year: toCriterion(values, "birth_year", true),
    age: toCriterion(values, "age", true),
    ethnicity: (values.ethnicity as EthnicityFilterEnum) || undefined,
    country: toCriterion(values, "country", false, CriterionModifier.EQUALS),
    eye_color: toEnumCriterion(
      values,
      "eye_color",
    ) as PerformerQueryInput["eye_color"],
    hair_color: toEnumCriterion(
      values,
      "hair_color",
    ) as PerformerQueryInput["hair_color"],
    height: toCriterion(values, "height", true),
    cup_size: toCriterion(values, "cup_size", false, CriterionModifier.EQUALS),
    band_size: toCriterion(values, "band_size", true),
    waist_size: toCriterion(values, "waist_size", true),
    hip_size: toCriterion(values, "hip_size", true),
    breast_type: toEnumCriterion(
      values,
      "breast_type",
    ) as PerformerQueryInput["breast_type"],
    career_start_year: toCriterion(values, "career_start_year", true),
    career_end_year: toCriterion(values, "career_end_year", true),
    is_favorite:
      values.is_favorite === "" || values.is_favorite === undefined
        ? undefined
        : values.is_favorite === "true",
    page: Number(values.page || 1),
    per_page: PER_PAGE,
    sort: (values.sort as PerformerSortEnum) || PerformerSortEnum.NAME,
    direction: (values.direction as SortDirectionEnum) || SortDirectionEnum.ASC,
  };
};

const PerformerSearch: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const urlValues = useMemo(
    () => Object.fromEntries(new URLSearchParams(paramsString)),
    [paramsString],
  );
  const [values, setValues] = useState<Values>(urlValues);
  const input = useMemo(() => buildInput(urlValues), [urlValues]);
  const page = input.page ?? 1;

  useEffect(() => setValues(urlValues), [urlValues]);

  const setPage = (pageNumber: number) => {
    const next = new URLSearchParams(searchParams);
    if (pageNumber === 1) next.delete("page");
    else next.set("page", pageNumber.toString());
    setSearchParams(next);
  };
  const setValue = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const { loading, data } = usePerformers({
    input,
  });

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setSearchParams(
      Object.fromEntries(
        Object.entries(values).filter(
          ([key, value]) =>
            key !== "page" &&
            !["name", "alias", "url"].includes(key) &&
            !key.startsWith("tattoos") &&
            !key.startsWith("piercings") &&
            (!key.endsWith("_modifier") ||
              value === CriterionModifier.IS_NULL ||
              value === CriterionModifier.NOT_NULL ||
              Boolean(values[key.slice(0, -"_modifier".length)])) &&
            value !== "",
        ),
      ),
    );
  };

  const clearFilters = () => {
    setValues({});
    setSearchParams({});
  };

  const setResultOption = (name: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (value === undefined) next.delete(name);
    else next.set(name, value);
    setSearchParams(next);
  };

  const sort = (urlValues.sort as PerformerSortEnum) || PerformerSortEnum.NAME;
  const direction =
    (urlValues.direction as SortDirectionEnum) || SortDirectionEnum.ASC;
  const resultControls = (
    <>
      <PerformerSort
        sort={sort}
        direction={direction}
        onSortChange={(value) => setResultOption("sort", value)}
        onDirectionChange={(value) => setResultOption("direction", value)}
      />
      <Form.Group controlId="advanced-performer-favorite">
        <Form.Check
          className="mt-2"
          type="switch"
          label="Only favorites"
          checked={urlValues.is_favorite === "true"}
          onChange={(event) =>
            setResultOption(
              "is_favorite",
              event.currentTarget.checked ? "true" : undefined,
            )
          }
        />
      </Form.Group>
    </>
  );

  if (!loading && !data)
    return <ErrorMessage error="Failed to load performers" />;

  return (
    <div className="AdvancedPerformerSearch">
      <h3>Advanced Performer Search</h3>
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={applyFilters}>
            <h5>Text and identity</h5>
            <Row>
              <Form.Group as={Col} sm={6} md={4} lg={3} className="mb-3">
                <Form.Label>Name or disambiguation</Form.Label>
                <Form.Control
                  value={values.names ?? ""}
                  onChange={(event) =>
                    setValue("names", event.currentTarget.value)
                  }
                />
              </Form.Group>
              <CriterionField
                label="Disambiguation"
                name="disambiguation"
                values={values}
                setValue={setValue}
                modifiers={stringModifiers}
              />
              <Form.Group as={Col} sm={6} md={4} lg={3} className="mb-3">
                <Form.Label>Country</Form.Label>
                <InputGroup className="country-criterion">
                  <ModifierDropdown
                    label="Country"
                    modifier={
                      (values.country_modifier as CriterionModifier) ||
                      CriterionModifier.EQUALS
                    }
                    modifiers={enumModifiers}
                    onChange={(modifier) =>
                      setValue("country_modifier", modifier)
                    }
                  />
                  <Select
                    className="country-select flex-grow-1"
                    classNamePrefix="react-select"
                    isClearable
                    options={countryOptions}
                    placeholder="Any country"
                    value={
                      countryOptions.find(
                        (country) =>
                          country.value ===
                          (values.country_modifier === CriterionModifier.IS_NULL
                            ? ""
                            : values.country),
                      ) ?? null
                    }
                    onChange={(option) => {
                      setValue("country", option?.value ?? "");
                      if (option?.value === "") {
                        setValue("country_modifier", CriterionModifier.IS_NULL);
                      } else if (!option) {
                        setValue("country_modifier", CriterionModifier.EQUALS);
                      } else if (
                        values.country_modifier === CriterionModifier.IS_NULL ||
                        values.country_modifier === CriterionModifier.NOT_NULL
                      ) {
                        setValue("country_modifier", CriterionModifier.EQUALS);
                      }
                    }}
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group as={Col} sm={6} md={4} lg={3} className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  value={values.gender ?? ""}
                  onChange={(e) => setValue("gender", e.currentTarget.value)}
                >
                  <option value="">Any</option>
                  {Object.values(GenderFilterEnum).map((value) => (
                    <option key={value} value={value}>
                      {GenderFilterTypes[value]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} sm={6} md={4} lg={3} className="mb-3">
                <Form.Label>Ethnicity</Form.Label>
                <Form.Select
                  value={values.ethnicity ?? ""}
                  onChange={(e) => setValue("ethnicity", e.currentTarget.value)}
                >
                  <option value="">Any</option>
                  {Object.values(EthnicityFilterEnum).map((value) => (
                    <option key={value} value={value}>
                      {EthnicityFilterTypes[value]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Row>

            <h5>Dates and measurements</h5>
            <Row>
              <CriterionField
                label="Birthdate"
                name="birthdate"
                type="date"
                values={values}
                setValue={setValue}
              />
              <CriterionField
                label="Deathdate"
                name="deathdate"
                type="date"
                values={values}
                setValue={setValue}
              />
              {[
                "birth_year",
                "age",
                "band_size",
                "cup_size",
                "waist_size",
                "hip_size",
                "height",
                "career_start_year",
                "career_end_year",
              ].map((name) => (
                <CriterionField
                  key={name}
                  label={name.replaceAll("_", " ")}
                  name={name}
                  type={name === "cup_size" ? "text" : "number"}
                  values={values}
                  setValue={setValue}
                />
              ))}
            </Row>

            <h5>Appearance</h5>
            <Row>
              {(
                [
                  ["Eye color", "eye_color", EyeColorEnum, EyeColorTypes],
                  ["Hair color", "hair_color", HairColorEnum, HairColorTypes],
                  ["Breast type", "breast_type", BreastTypeEnum, BreastTypes],
                ] as const
              ).map(([label, name, enumType, labels]) => (
                <Form.Group
                  as={Col}
                  sm={6}
                  md={4}
                  lg={3}
                  className="mb-3"
                  key={name}
                >
                  <Form.Label>{label}</Form.Label>
                  <InputGroup>
                    <ModifierDropdown
                      label={label}
                      modifier={
                        (values[`${name}_modifier`] as CriterionModifier) ||
                        CriterionModifier.EQUALS
                      }
                      modifiers={enumModifiers}
                      onChange={(modifier) =>
                        setValue(`${name}_modifier`, modifier)
                      }
                    />
                    <Form.Select
                      value={values[name] ?? ""}
                      onChange={(e) => setValue(name, e.currentTarget.value)}
                    >
                      <option value="">Any</option>
                      {Object.values(enumType).map((value) => (
                        <option key={value} value={value}>
                          {(labels as Record<string, string>)[value]}
                        </option>
                      ))}
                    </Form.Select>
                  </InputGroup>
                </Form.Group>
              ))}
            </Row>

            <div className="d-flex gap-2">
              <Button type="submit">Search</Button>
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <List
        entityName="performers"
        page={page}
        filters={resultControls}
        setPage={setPage}
        perPage={PER_PAGE}
        loading={loading}
        listCount={data?.queryPerformers.count}
      >
        <Row>
          {(data?.queryPerformers.performers ?? []).map((performer) => (
            <Col xs="auto" key={performer.id}>
              <PerformerCard performer={performer} />
            </Col>
          ))}
        </Row>
      </List>
    </div>
  );
};

export default PerformerSearch;
