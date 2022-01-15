import { FC, useContext } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Row, Table } from "react-bootstrap";

import { GenderEnum } from "src/graphql";
import { Performer_findPerformer as Performer } from "src/graphql/definitions/Performer";

import AuthContext from "src/AuthContext";
import {
  canEdit,
  formatFuzzyDate,
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
  ROUTE_PERFORMER_EDIT,
  ROUTE_PERFORMER_MERGE,
  ROUTE_PERFORMER_DELETE,
} from "src/constants/route";

import {
  FavoriteStar,
  GenderIcon,
  PerformerName,
  Tooltip,
} from "src/components/fragments";
import ImageCarousel from "src/components/imageCarousel";

const PerformerInfo: FC<{ performer: Performer }> = ({ performer }) => {
  const auth = useContext(AuthContext);

  return (
    <Row>
      <Col xs={6}>
        <Card>
          <Card.Header className="d-flex">
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
            {canEdit(auth?.user) && !performer.deleted && (
              <div className="ms-auto flex-shrink-0">
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
                      performer.career_end_year
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Birthdate</td>
                  <td>
                    {performer.birthdate &&
                      formatFuzzyDate(performer.birthdate)}
                  </td>
                </tr>
                <tr>
                  <td>Height</td>
                  <td>
                    <div>
                      {(performer?.height ?? 0) > 0 && `${performer.height}cm`}
                    </div>
                  </td>
                </tr>
                {performer.gender !== GenderEnum.MALE &&
                  performer.gender !== GenderEnum.TRANSGENDER_MALE && (
                    <>
                      <tr>
                        <td>Measurements</td>
                        <td>{formatMeasurements(performer.measurements)}</td>
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
                    {performer.ethnicity && EthnicityTypes[performer.ethnicity]}
                  </td>
                </tr>
                <tr>
                  <td>Eye color</td>
                  <td>
                    {performer.eye_color && EyeColorTypes[performer.eye_color]}
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
      </Col>
      <Col xs={6} className="performer-photo">
        <ImageCarousel images={performer.images} orientation="portrait" />
      </Col>
    </Row>
  );
};

export default PerformerInfo;
