import { FC, useContext } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Row, Table } from "react-bootstrap";
import { faCodeMerge } from "@fortawesome/free-solid-svg-icons";

import {
  GenderEnum,
  PerformerFragment as Performer,
  usePerformer,
} from "src/graphql";

import AuthContext from "src/AuthContext";
import {
  canEdit,
  getCountryByISO,
  formatBodyModifications,
  formatMeasurements,
  formatCareer,
  createHref,
} from "src/utils";
import {
  EthnicityTypes,
  HairColorTypes,
  EyeColorTypes,
  BreastTypes,
} from "src/constants";

import {
  ROUTE_PERFORMER,
  ROUTE_PERFORMER_EDIT,
  ROUTE_PERFORMER_MERGE,
  ROUTE_PERFORMER_DELETE,
} from "src/constants/route";

import {
  FavoriteStar,
  GenderIcon,
  PerformerName,
  Tooltip,
  Icon,
} from "src/components/fragments";
import ImageCarousel from "src/components/imageCarousel";

const CLASSNAME = "PerformerInfo";
const CLASSNAME_ACTIONS = "PerformerInfo-actions";

interface Props {
  performer: Performer;
}

const Actions: FC<Props> = ({ performer }) => {
  const auth = useContext(AuthContext);

  if (!canEdit(auth?.user) || performer.deleted) return null;

  return (
    <Row className={CLASSNAME_ACTIONS}>
      <Col xs={6}>
        <div className="text-end">
          <Link to={createHref(ROUTE_PERFORMER_EDIT, performer)}>
            <Button>Edit</Button>
          </Link>
          <Link
            to={createHref(ROUTE_PERFORMER_MERGE, performer)}
            className="ms-2"
          >
            <Tooltip
              text={
                <>
                  Merge other performers into <b>{performer.name}</b>
                </>
              }
            >
              <Button>Merge</Button>
            </Tooltip>
          </Link>
          <Link
            to={createHref(ROUTE_PERFORMER_DELETE, performer)}
            className="ms-2"
          >
            <Button variant="danger">Delete</Button>
          </Link>
        </div>
      </Col>
    </Row>
  );
};

export const PerformerInfo: FC<Props> = ({ performer }) => {
  const { data: mergedInto } = usePerformer(
    { id: performer.merged_into_id ?? "" },
    !performer.merged_into_id,
  );
  return (
    <div className={CLASSNAME}>
      <Actions performer={performer} />
      <Row>
        <Col xs={6}>
          <Card>
            <Card.Header>
              <h3>
                <GenderIcon gender={performer?.gender} />
                <PerformerName performer={performer} />
                <FavoriteStar
                  entity={performer}
                  entityType="performer"
                  interactable
                  className="ps-2"
                />
              </h3>
              {mergedInto?.findPerformer && (
                <h6 className="text-muted">
                  <Icon icon={faCodeMerge} className="me-2 text-danger" />
                  <span>Merged into </span>
                  <Link
                    to={createHref(ROUTE_PERFORMER, mergedInto.findPerformer)}
                  >
                    <PerformerName performer={mergedInto.findPerformer} />
                  </Link>
                </h6>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              <Table striped>
                <tbody>
                  <tr>
                    <td>Career</td>
                    <td>
                      {formatCareer(
                        performer.career_start_year,
                        performer.career_end_year,
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Birthdate</td>
                    <td>{performer.birth_date}</td>
                  </tr>
                  <tr>
                    <td>Height</td>
                    <td>
                      <div>
                        {(performer?.height ?? 0) > 0 &&
                          `${performer.height}cm`}
                      </div>
                    </td>
                  </tr>
                  {performer.gender !== GenderEnum.MALE &&
                    performer.gender !== GenderEnum.TRANSGENDER_MALE && (
                      <>
                        <tr>
                          <td>Measurements</td>
                          <td>{formatMeasurements(performer)}</td>
                        </tr>
                        <tr>
                          <td>Breast type</td>
                          <td>
                            {performer.breast_type &&
                              BreastTypes[performer.breast_type]}
                          </td>
                        </tr>
                      </>
                    )}
                  <tr>
                    <td>Nationality</td>
                    <td>{getCountryByISO(performer.country)}</td>
                  </tr>
                  <tr>
                    <td>Ethnicity</td>
                    <td>
                      {performer.ethnicity &&
                        EthnicityTypes[performer.ethnicity]}
                    </td>
                  </tr>
                  <tr>
                    <td>Eye color</td>
                    <td>
                      {performer.eye_color &&
                        EyeColorTypes[performer.eye_color]}
                    </td>
                  </tr>
                  <tr>
                    <td>Hair color</td>
                    <td>
                      {performer.hair_color &&
                        HairColorTypes[performer.hair_color]}
                    </td>
                  </tr>
                  <tr>
                    <td>Tattoos</td>
                    <td>{formatBodyModifications(performer?.tattoos)}</td>
                  </tr>
                  <tr>
                    <td>Piercings</td>
                    <td>{formatBodyModifications(performer?.piercings)}</td>
                  </tr>
                  <tr>
                    <td>Aliases</td>
                    <td>{(performer.aliases || []).join(", ")}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          <div className="float-end">
            {performer.urls.map((u) => (
              <a
                href={u.url}
                target="_blank"
                rel="noreferrer noopener"
                key={u.url}
              >
                <img src={u.site.icon} alt="" className="SiteLink-icon" />
              </a>
            ))}
          </div>
        </Col>
        <Col xs={6} className="performer-photo">
          <ImageCarousel images={performer.images} orientation="portrait" />
        </Col>
      </Row>
    </div>
  );
};
