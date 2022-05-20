import { FC, useMemo } from "react";
import { useHistory, useParams, Link } from "react-router-dom";
import { Card, Col, Form, Row } from "react-bootstrap";
import { debounce } from "lodash-es";
import {
  faBirthdayCake,
  faFlag,
  faVideo,
  faCalendar,
  faUsers,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import {
  SearchAll_searchPerformer as Performer,
  SearchAll_searchScene as Scene,
} from "src/graphql/definitions/SearchAll";
import { useSearchAll } from "src/graphql";
import {
  Icon,
  FavoriteStar,
  GenderIcon,
  LoadingIndicator,
  PerformerName,
} from "src/components/fragments";
import Title from "src/components/title";
import {
  getImage,
  getCountryByISO,
  sceneHref,
  performerHref,
  createHref,
  formatDuration,
} from "src/utils";
import { ROUTE_SEARCH } from "src/constants/route";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_PERFORMER = `${CLASSNAME}-performer`;
const CLASSNAME_PERFORMER_IMAGE = `${CLASSNAME_PERFORMER}-image`;
const CLASSNAME_SCENE = `${CLASSNAME}-scene`;
const CLASSNAME_SCENE_IMAGE = `${CLASSNAME_SCENE}-image`;

const PerformerCard: FC<{ performer: Performer }> = ({ performer }) => (
  <Link to={performerHref(performer)} className={CLASSNAME_PERFORMER}>
    <Card>
      <img
        src={getImage(performer.images, "portrait")}
        className={CLASSNAME_PERFORMER_IMAGE}
        alt=""
      />
      <div className="ms-3">
        <h4>
          <GenderIcon gender={performer?.gender} />
          <PerformerName performer={performer} />
          <FavoriteStar
            entity={performer}
            entityType="performer"
            className="ps-2"
          />
          {performer.aliases.length > 0 && (
            <h6>
              <small>Aliases: {performer.aliases.join(", ")}</small>
            </h6>
          )}
        </h4>
        <div>
          {performer.birth_date && (
            <div>
              <Icon icon={faBirthdayCake} />
              {performer.birth_date}
            </div>
          )}
          {performer.country && (
            <div>
              <Icon icon={faFlag} />
              {getCountryByISO(performer.country)}
            </div>
          )}
          <div>
            <Icon icon={faVideo} />
            {performer.scene_count} scene{performer.scene_count > 1 && "s"}
          </div>
        </div>
      </div>
    </Card>
  </Link>
);

const SceneCard: FC<{ scene: Scene }> = ({ scene }) => (
  <Link to={sceneHref(scene)} className={CLASSNAME_SCENE}>
    <Card>
      <img
        src={getImage(scene.images, "landscape")}
        className={CLASSNAME_SCENE_IMAGE}
        alt=""
      />
      <div className="ms-3 w-100">
        <h5>
          {scene.title}
          <small className="text-muted ms-2">
            {formatDuration(scene.duration)}
          </small>
        </h5>
        <div>
          <div>
            <Icon icon={faCalendar} />
            {scene.release_date}
          </div>
          <div>
            <Icon icon={faVideo} />
            {scene.studio?.name ?? "Unknown"}
            <small className="text-muted ms-2">{scene.code}</small>
          </div>
          {scene.performers.length > 0 && (
            <div>
              <Icon icon={faUsers} />
              {scene.performers.map((p) => p.as ?? p.performer.name).join(", ")}
            </div>
          )}
        </div>
      </div>
    </Card>
  </Link>
);

interface IParams {
  term?: string;
}

const Search: FC = () => {
  const { term } = useParams<IParams>();
  const history = useHistory();
  const { loading, data } = useSearchAll(
    {
      term: term ?? "",
      limit: 10,
    },
    !term
  );

  const debouncedSearch = useMemo(
    () =>
      debounce(
        (searchTerm: string) =>
          history.replace(
            createHref(ROUTE_SEARCH, { term: searchTerm || undefined })
          ),
        200
      ),
    [history]
  );

  return (
    <div className={CLASSNAME}>
      <Title page={term} />
      <Form.Group className={cx(CLASSNAME_INPUT, "mb-3")}>
        <Icon icon={faMagnifyingGlass} />
        <Form.Control
          defaultValue={term}
          onChange={(e) => debouncedSearch(e.currentTarget.value)}
          placeholder="Search for performer or scene"
          autoFocus
        />
      </Form.Group>
      {term && loading && <LoadingIndicator message="Searching..." />}
      {term && !loading && data && (
        <Row>
          <Col xs={6}>
            <h3>Performers</h3>
            <div>
              {data.searchPerformer.map((p) => (
                <PerformerCard performer={p} key={p.id} />
              ))}
            </div>
          </Col>
          <Col xs={6}>
            <h3>Scenes</h3>
            {data.searchScene.map((s) => (
              <SceneCard scene={s} key={s.id} />
            ))}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Search;
