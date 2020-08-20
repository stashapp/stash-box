import React, { useContext } from "react";
import { useMutation } from "@apollo/client";
import { Link, useHistory } from "react-router-dom";
import { Button, Card, Table } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Performer_findPerformer as Performer } from "src/definitions/Performer";
import {
  DeletePerformerMutation,
  DeletePerformerMutationVariables,
} from "src/definitions/DeletePerformerMutation";

import AuthContext from "src/AuthContext";
import { canEdit, isAdmin } from "src/utils/auth";
import { getFuzzyDate, getCountryByISO } from "src/utils";
import { boobJobStatus, getBodyModification } from "src/utils/transforms";
import { EthnicityTypes, HairColorTypes, EyeColorTypes } from "src/constants";

import { GenderIcon, PerformerName } from "src/components/fragments";
import ImageCarousel from "src/components/imageCarousel";
import DeleteButton from "src/components/deleteButton";

const DeletePerformer = loader("src/mutations/DeletePerformer.gql");

const PerformerInfo: React.FC<{ performer: Performer }> = ({ performer }) => {
  const history = useHistory();
  const auth = useContext(AuthContext);
  const [deletePerformer, { loading: deleting }] = useMutation<
    DeletePerformerMutation,
    DeletePerformerMutationVariables
  >(DeletePerformer, { variables: { input: { id: performer.id } } });

  const handleDelete = (): void => {
    deletePerformer().then(() => history.push("/performers"));
  };

  return (
    <>
      <div className="row mb-4">
        <div className="col-6">
          <Card>
            <Card.Header>
              <div className="float-right">
                {canEdit(auth?.user) && (
                  <Link to={`${performer.id}/edit`}>
                    <Button>Edit</Button>
                  </Link>
                )}
                {isAdmin(auth.user) && (
                  <DeleteButton
                    onClick={handleDelete}
                    disabled={deleting}
                    message="Do you want to delete performer? This cannot be undone."
                  />
                )}
              </div>
              <h2>
                <GenderIcon gender={performer?.gender} />
                <PerformerName performer={performer} />
              </h2>
            </Card.Header>
            <Card.Body className="performer-card-body">
              <Table striped className="performer-table">
                <tbody>
                  <tr>
                    <td>Career</td>
                    <td>
                      {performer.career_end_year
                        ? `Active ${performer.career_start_year || "????"}
                                                    -${
                                                      performer.career_end_year
                                                    }`
                        : performer.career_start_year
                        ? `Active from ${performer.career_start_year}`
                        : "Unknown Activity"}
                    </td>
                  </tr>
                  <tr>
                    <td>Birthdate</td>
                    <td>
                      {performer.birthdate
                        ? getFuzzyDate(performer.birthdate)
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Height</td>
                    <td>
                      <div>{performer.height && `${performer.height}cm`}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>Measurements</td>
                    <td>
                      {performer.measurements.cup_size &&
                      performer.measurements.band_size
                        ? `${performer.measurements.band_size}` +
                          `${performer.measurements.cup_size}-`
                        : "??-"}
                      {`${performer.measurements.waist || "??"}-`}
                      {performer.measurements.hip || "??"}
                    </td>
                  </tr>
                  {(performer.gender === "FEMALE" ||
                    performer.gender === "TRANSGENDER_FEMALE") && (
                    <tr>
                      <td>Breast type</td>
                      <td>
                        {performer.breast_type
                          ? boobJobStatus(performer.breast_type)
                          : ""}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>Nationality</td>
                    <td>{getCountryByISO(performer.country)}</td>
                  </tr>
                  <tr>
                    <td>Ethnicity</td>
                    <td>
                      {performer.ethnicity
                        ? EthnicityTypes[performer.ethnicity]
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Eye color</td>
                    <td>
                      {performer.eye_color
                        ? EyeColorTypes[performer.eye_color]
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Hair color</td>
                    <td>
                      {performer.hair_color
                        ? HairColorTypes[performer.hair_color]
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Tattoos</td>
                    <td>
                      {getBodyModification(performer?.tattoos ?? undefined)}
                    </td>
                  </tr>
                  <tr>
                    <td>Piercings</td>
                    <td>
                      {getBodyModification(performer?.piercings ?? undefined)}
                    </td>
                  </tr>
                  <tr>
                    <td>Aliases</td>
                    <td>{(performer.aliases || []).join(", ")}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
        <div className="col-6 performer-photo">
          <ImageCarousel images={performer.images} orientation="portrait" />
        </div>
      </div>
    </>
  );
};

export default PerformerInfo;
