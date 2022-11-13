import { FC, useState } from "react";
import { Button, Form, InputGroup, Row, Table } from "react-bootstrap";
import {
  faSortAmountUp,
  faSortAmountDown,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";

import {
  useScenes,
  SceneQueryInput,
  SortDirectionEnum,
  SceneSortEnum,
  useUnmatchFingerprint,
  FingerprintAlgorithm,
  FingerprintSubmission,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum } from "src/utils";
import { ErrorMessage, Icon } from "src/components/fragments";
import List from "src/components/list/List";
import { Link } from "react-router-dom";
import { sceneHref, studioHref, formatDuration } from "src/utils";
import Modal from "src/components/modal";
import UserSceneLine from "./UserSceneLine";


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

const UserSceneList: FC<Props> = ({ perPage = PER_PAGE, filter}) => {
  const [dataForDeletion, setDataForDeletion] = useState<FingerprintSubmission[]>([])
  const [showDelete, setShowDelete] = useState(false);
  const [deleteFingerprint, { loading: deleting }] = useUnmatchFingerprint();
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

  const deleteOne = (sceneId: string, hash: string, algo: FingerprintAlgorithm, duration: number) => {
    dataForDeletion.push({
      fingerprint: {
        hash: hash,
        algorithm: algo,
        duration: duration
      },
      scene_id: sceneId
    })
    setShowDelete(true)
  }

  const handleDelete = (status: boolean): void => {
    if (status)
    {
      dataForDeletion.forEach(deletion => {
        deleteFingerprint({ variables: {
          hash: deletion.fingerprint.hash,
          scene_id: deletion.scene_id,
          algorithm: deletion.fingerprint.algorithm,
          duration: deletion.fingerprint.duration
        } })
      })
      setDataForDeletion([])
      
    }
    else {
      setDataForDeletion([])
    }
    setShowDelete(false);
  };

  const deleteModal = showDelete && (
    <Modal
      message={`Are you sure you want to delete ${dataForDeletion.length} fingerprints? This operation cannot be undone.`}
      callback={handleDelete}
    />
  );

  // Temporary fix while the API endpoint returns dupes
  const scenes_dupe = data?.queryScenes.scenes ?? []
  const dedupScenes = scenes_dupe.filter((value, index) => scenes_dupe.indexOf(value) === index)

  const scenes = dedupScenes.map((scene) => (
    <UserSceneLine key={scene.id} sceneId={scene.id} deleteFingerprint={deleteOne} ></UserSceneLine>
  ));

  return (
    <>
      {deleteModal}
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
                <th>PHASH</th>
                <th>OSHASH</th>
                <th>MD5</th>
              </tr>
            </thead>
            <tbody>
            {scenes}
            </tbody>
          </Table>
        </Row>
      </List>
    </>
  );
};

export default UserSceneList;