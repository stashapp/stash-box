import React, { useContext } from "react";
import { useMutation } from "@apollo/client";
import { Link, useHistory } from "react-router-dom";
import { Button, Card, Col, Row, Table } from "react-bootstrap";
import { loader } from "graphql.macro";

import { OperationEnum, GenderEnum } from "src/definitions/globalTypes";
import { Performer_findPerformer as Performer } from "src/definitions/Performer";
import {
  PerformerEditMutation as PerformerEdit,
  PerformerEditMutationVariables,
} from "src/definitions/PerformerEditMutation";

import AuthContext from "src/AuthContext";
import {
  canEdit,
  isAdmin,
  formatFuzzyDate,
  getCountryByISO,
  formatBodyModifications,
  formatMeasurements,
  formatCareer,
  createHref,
  editHref,
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
} from "src/constants/route";

import { GenderIcon, PerformerName } from "src/components/fragments";
import ImageCarousel from "src/components/imageCarousel";
import DeleteButton from "src/components/deleteButton";

const PerformerEditMutation = loader("src/mutations/PerformerEdit.gql");

const PerformerInfo: React.FC<{ performer: Performer }> = ({ performer }) => {
  const history = useHistory();
  const auth = useContext(AuthContext);
  const [deletePerformerEdit, { loading: deleting }] = useMutation<
    PerformerEdit,
    PerformerEditMutationVariables
  >(PerformerEditMutation, {
    onCompleted: (data) => {
      if (data.performerEdit.id) history.push(editHref(data.performerEdit));
    },
  });

  const handleDelete = (): void => {
    deletePerformerEdit({
      variables: {
        performerData: {
          edit: { operation: OperationEnum.DESTROY, id: performer.id },
        },
      },
    });
  };

  return (
    <Row className="mb-4">
      <Col xs={6}>
        <Card>
          <Card.Header className="d-flex">
            <h2>
              <GenderIcon gender={performer?.gender} />
              <PerformerName performer={performer} />
            </h2>
            {!performer.deleted && (
              <div className="ml-auto">
                {canEdit(auth?.user) && (
                  <Link to={createHref(ROUTE_PERFORMER_EDIT, performer)}>
                    <Button>Edit</Button>
                  </Link>
                )}
                <Link
                  to={createHref(ROUTE_PERFORMER_MERGE, performer)}
                  className="ml-2"
                >
                  <Button>Merge into</Button>
                </Link>
                {isAdmin(auth.user) && !performer.deleted && (
                  <DeleteButton
                    onClick={handleDelete}
                    disabled={deleting}
                    className="ml-2"
                    message="Do you want to delete performer?"
                  />
                )}
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
