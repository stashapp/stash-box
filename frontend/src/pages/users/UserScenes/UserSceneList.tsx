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
  useSubmitFingerPrint,
  FingerprintAlgorithm,
  FingerprintSubmission,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum } from "src/utils";
import { ErrorMessage, Icon } from "src/components/fragments";
import List from "src/components/list/List";
import { Link } from "react-router-dom";
import { sceneHref, studioHref, formatDuration } from "src/utils";
import { MyFingerprints_myFingerprints_fingerprints as FingerprintInput } from "src/graphql/definitions/MyFingerprints";
import Modal from "src/components/modal";


const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: Partial<SceneQueryInput>;
  userFingerprints?: Array<FingerprintInput>;
}

const sortOptions = [
  { value: SceneSortEnum.DATE, label: "Release Date" },
  { value: SceneSortEnum.TRENDING, label: "Trending" },
  { value: SceneSortEnum.CREATED_AT, label: "Created At" },
  { value: SceneSortEnum.UPDATED_AT, label: "Updated At" },
];

const UserSceneList: FC<Props> = ({ perPage = PER_PAGE, filter , userFingerprints}) => {
  const [dataForDeletion, setDataForDeletion] = useState<FingerprintSubmission[]>([])
  const [showDelete, setShowDelete] = useState(false);
  const [deleteFingerprint, { loading: deleting }] = useSubmitFingerPrint();
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
    <tr key={scene.id}>
      <td><Link className="text-truncate w-100" to={sceneHref(scene)}>{scene.title}</Link></td>
      <td>{scene.studio && (
            <Link
              to={studioHref(scene.studio)}
              className="float-end text-truncate SceneCard-studio-name"
            >
              <Icon icon={faVideo} className="me-1" />
              {scene.studio.name}
            </Link>
          )}</td>
      <td>{scene.duration ? formatDuration(scene.duration) : ""}</td>
      <td>{scene.release_date}</td>
      <td><Button
        variant="danger"
        onClick={()=> {
          setDataForDeletion(data => {
            const linkedFingerprint = userFingerprints?.find(fing => fing.scene_id)

            return [...data, {
            scene_id: scene.id,
            fingerprint: {
              hash: linkedFingerprint?.hash ?? '',
              algorithm: linkedFingerprint?.algorithm ?? FingerprintAlgorithm.PHASH,
              duration: linkedFingerprint?.duration ?? 0
            },
            unmatch: true
          }]})
          setShowDelete(true)
        }}
        disabled={showDelete || deleting}
        >x</Button></td>
    </tr>
  ));

  const handleDelete = (status: boolean): void => {
    if (status)
    {
      dataForDeletion.forEach(deletion => {
        deleteFingerprint({ variables: { input: deletion } })
      })
      setDataForDeletion([])
      
    }
    else {
      setDataForDeletion([])
      // TODO: reload scenes list
    }
    setShowDelete(false);
  };

  const deleteModal = showDelete && (
    <Modal
      message={`Are you sure you want to delete ${dataForDeletion.length} fingerprints? This operation cannot be undone.`}
      callback={handleDelete}
    />
  );

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
