import { FC } from "react";
import { Col, Form, Row } from "react-bootstrap";
import querystring from "query-string";
import { useHistory } from "react-router-dom";

import { useScenes, SceneFilterType } from "src/graphql";
import { usePagination } from "src/hooks";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage } from "src/components/fragments";
import List from "./List";

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: SceneFilterType;
}

const sortOptions = [
  { value: "", label: "Release Date" },
  { value: "trending", label: "Trending" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
];

const SceneList: FC<Props> = ({ perPage = PER_PAGE, filter }) => {
  const history = useHistory();
  const queries = querystring.parse(history.location.search);
  const sort = Array.isArray(queries.sort) ? queries.sort[0] : queries.sort;

  const { page, setPage } = usePagination();
  const { loading, data } = useScenes({
    filter: {
      page,
      per_page: perPage,
      sort,
    },
    sceneFilter: filter,
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const handleQuery = (name: string, value?: string) => {
    const qs = querystring.stringify({
      ...querystring.parse(history.location.search),
      [name]: value || undefined,
      page: undefined,
    });
    history.replace(`${history.location.pathname}?${qs}`);
  };

  const filters = (
    <Form.Control
      className="w-25"
      as="select"
      onChange={(e) => handleQuery("sort", e.currentTarget.value)}
      defaultValue={sort ?? "name"}
    >
      {sortOptions.map((s) => (
        <option value={s.value} key={s.value}>
          {s.label}
        </option>
      ))}
    </Form.Control>
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
