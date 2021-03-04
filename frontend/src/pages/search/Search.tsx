import React, { useMemo } from "react";
import { useHistory, useParams, Link } from "react-router-dom";
import { Card, Col, Form, Row } from "react-bootstrap";
import { debounce } from "lodash";

import {
  SearchAll_searchPerformer as Performer,
  SearchAll_searchScene as Scene,
} from "src/graphql/definitions/SearchAll";
import { useSearchAll } from "src/graphql";
import {
  Icon,
  GenderIcon,
  LoadingIndicator,
  PerformerName,
} from "src/components/fragments";
import {
  formatFuzzyDate,
  getImage,
  getCountryByISO,
  sceneHref,
  performerHref,
  createHref,
} from "src/utils";
import { ROUTE_SEARCH } from "src/constants/route";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_PERFORMER = `${CLASSNAME}-performer`;
const CLASSNAME_PERFORMER_IMAGE = `${CLASSNAME_PERFORMER}-image`;
const CLASSNAME_SCENE = `${CLASSNAME}-scene`;
const CLASSNAME_SCENE_IMAGE = `${CLASSNAME_SCENE}-image`;

const PerformerCard: React.FC<{ performer: Performer }> = ({ performer }) => (
  <Link to={performerHref(performer)} className={CLASSNAME_PERFORMER}>
    <Card>
      <img
        src={getImage(performer.images, "portrait")}
        className={CLASSNAME_PERFORMER_IMAGE}
        alt=""
      />
      <div className="ml-3">
        <h4>
          <GenderIcon gender={performer?.gender} />
          <PerformerName performer={performer} />
          {performer.aliases.length > 0 && (
            <h6>
              <small>Aliases: {performer.aliases.join(", ")}</small>
            </h6>
          )}
        </h4>
        <div>
          {performer.birthdate?.date && (
            <div>
              <Icon icon="birthday-cake" />
              {formatFuzzyDate(performer.birthdate)}
            </div>
          )}
          {performer.country && (
            <div>
              <Icon icon="flag" />
              {getCountryByISO(performer.country)}
            </div>
          )}
          <div>
            <Icon icon="video" />
            {performer.scene_count} scene{performer.scene_count > 1 && "s"}
          </div>
        </div>
      </div>
    </Card>
  </Link>
);

const SceneCard: React.FC<{ scene: Scene }> = ({ scene }) => (
  <Link to={sceneHref(scene)} className={CLASSNAME_SCENE}>
    <Card>
      <img
        src={getImage(scene.images, "landscape")}
        className={CLASSNAME_SCENE_IMAGE}
        alt=""
      />
      <div className="ml-3">
        <h5>{scene.title}</h5>
        <div>
          <div>
            <Icon icon="calendar" />
            {scene.date}
          </div>
          <div>
            <Icon icon="video" />
            {scene.studio?.name ?? "Unknown"}
          </div>
          {scene.performers.length > 0 && (
            <div>
              <Icon icon="users" />
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

const Search: React.FC = () => {
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
      <Form.Group className={CLASSNAME_INPUT}>
        <Icon icon="search" />
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
