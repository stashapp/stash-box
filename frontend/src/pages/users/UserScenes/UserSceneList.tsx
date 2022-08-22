import { FC } from "react";
import { Button, Col, Form, InputGroup, Row, Table } from "react-bootstrap";
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
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum } from "src/utils";
import UserSceneRow from "./UserSceneRow";
import { ErrorMessage, Icon } from "src/components/fragments";
import List from "src/components/list/List";

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: Partial<SceneQueryInput>;
}

const sortOptions = [
  { value: SceneSortEnum.DATE, label: "Release Date" },
  { value: SceneSortEnum.TRENDING, label: "Trending" },
  { value: SceneSortEnum.CREATED_AT, label: "Created At" },
  { value: SceneSortEnum.UPDATED_AT, label: "Updated At" },
];

const UserSceneList: FC<Props> = ({ perPage = PER_PAGE, filter }) => {
  const [params, setParams] = useQueryParams({
    sort: { name: "sort", type: "string", default: SceneSortEnum.DATE },
    dir: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
  });
  const sort = ensureEnum(SceneSortEnum, params.sort);
  const direction = ensureEnum(SortDirectionEnum, params.dir);

  const { page, setPage } = usePagination();
  const { loading, data } = useScenes({
    input: {
      page,
      per_page: perPage,
      sort,
      direction,
      ...filter,
    },
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const filters = (
    <InputGroup className="scene-sort w-auto">
      <Form.Select
        className="w-auto"
        onChange={(e) => setParams("sort", e.currentTarget.value.toLowerCase())}
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
          setParams(
            "dir",
            direction === SortDirectionEnum.DESC
              ? SortDirectionEnum.ASC
              : SortDirectionEnum.DESC
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
    <UserSceneRow performance={scene} />
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
      <Row>
        <Table striped variant="dark">
          <thead>
            <tr>
              <th>Title</th>
              <th>Studio</th>
              <th>Duration</th>
              <th>Release Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {scenes}
          </tbody>
        </Table>
      </Row>
    </List>
  );
};

export default UserSceneList;
