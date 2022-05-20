import { FC } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import querystring from "query-string";
import { useHistory } from "react-router-dom";
import {
  faSortAmountUp,
  faSortAmountDown,
} from "@fortawesome/free-solid-svg-icons";

import {
  useScenes,
  SceneQueryInput,
  SortDirectionEnum,
  SceneSortEnum,
} from "src/graphql";
import { usePagination } from "src/hooks";
import { resolveEnum } from "src/utils";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage, Icon } from "src/components/fragments";
import List from "./List";

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: Partial<SceneQueryInput>;
}

const sortOptions = [
  { value: "", label: "Release Date" },
  { value: SceneSortEnum.TRENDING, label: "Trending" },
  { value: SceneSortEnum.CREATED_AT, label: "Created At" },
  { value: SceneSortEnum.UPDATED_AT, label: "Updated At" },
];

const SceneList: FC<Props> = ({ perPage = PER_PAGE, filter }) => {
  const history = useHistory();
  const queries = querystring.parse(history.location.search);
  const sort = resolveEnum(
    SceneSortEnum,
    Array.isArray(queries.sort) ? queries.sort[0] : queries.sort
  );
  const direction =
    (Array.isArray(queries.dir) ? queries.dir[0] : queries.dir) ===
    SortDirectionEnum.ASC
      ? SortDirectionEnum.ASC
      : SortDirectionEnum.DESC;

  const { page, setPage } = usePagination();
  const { loading, data } = useScenes({
    input: {
      page,
      per_page: perPage,
      sort: sort ?? SceneSortEnum.DATE,
      direction,
      ...filter,
    },
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const handleQuery = (name: string, value?: string) => {
    const qs = querystring.stringify({
      ...querystring.parse(history.location.search),
      [name]: value || undefined,
      page: undefined,
    });
    const hash = history.location.hash ?? "";
    history.replace(`${history.location.pathname}?${qs}${hash}`);
  };

  const filters = (
    <InputGroup className="scene-sort w-auto">
      <Form.Select
        className="w-auto"
        onChange={(e) =>
          handleQuery("sort", e.currentTarget.value.toLowerCase())
        }
        defaultValue={sort ?? "name"}
      >
        {sortOptions.map((s) => (
          <option value={s.value} key={s.value}>
            {s.label}
          </option>
        ))}
      </Form.Select>
      <Button
        variant="secondary"
        onClick={() =>
          handleQuery(
            "dir",
            direction === SortDirectionEnum.DESC
              ? SortDirectionEnum.ASC
              : undefined
          )
        }
      >
        <Icon
          icon={
            direction === SortDirectionEnum.DESC
              ? faSortAmountDown
              : faSortAmountUp
          }
        />
      </Button>
    </InputGroup>
  );

  const scenes = (data?.queryScenes.scenes ?? []).map((scene) => (
    <Col xs={3} key={scene.id}>
      <SceneCard performance={scene} />
    </Col>
  ));

  return (
    <List
      page={page}
      setPage={setPage}
      perPage={perPage}
      listCount={data?.queryScenes.count}
      loading={loading}
      filters={filters}
      entityName="scenes"
    >
      <Row>{scenes}</Row>
    </List>
  );
};

export default SceneList;
