import React, { useState, useContext } from "react";
import { useMutation } from "@apollo/react-hooks";
import { Link, useHistory } from "react-router-dom";
import { Card, Table } from "react-bootstrap";

import DeletePerformer from "src/mutations/DeletePerformer.gql";
import AuthContext from "src/AuthContext";
import { Performer_findPerformer as Performer } from "src/definitions/Performer";
import {
  DeletePerformerMutation,
  DeletePerformerMutationVariables,
} from "src/definitions/DeletePerformerMutation";
import getFuzzyDate from "src/utils/date";
import { boobJobStatus, getBodyModification } from "src/utils/transforms";
import { EthnicityTypes, HairColorTypes, EyeColorTypes } from "src/constants";

import ImageCarousel from 'src/components/imageCarousel';
import Modal from 'src/components/modal';
import { GenderIcon } from 'src/components/fragments';
import { canEdit } from 'src/utils/auth';

const PerformerInfo: React.FC<{ performer: Performer }> = ({ performer }) => {
  const history = useHistory();
  const [showDelete, setShowDelete] = useState(false);
  const [deletePerformer, { loading: deleting }] = useMutation<
    DeletePerformerMutation,
    DeletePerformerMutationVariables
  >(DeletePerformer, { variables: { input: { id: performer.id } } });
  const auth = useContext(AuthContext);

  const toggleModal = () => {
    setShowDelete(true);
  };

  const handleDelete = (status: boolean): void => {
    if (status) deletePerformer().then(() => history.push("/performers"));
    setShowDelete(false);
  };

  const showModal = showDelete && (
    <Modal
      message={`Are you sure you want to delete '${performer.name}`}
      callback={handleDelete}
    />
  );
  const deleteButton = auth.user.roles.includes("ADMIN") && (
    <button
      type="button"
      disabled={showDelete || deleting}
      className="btn btn-danger"
      onClick={toggleModal}
    >
      Delete
    </button>
  );

  return (
    <>
      {showModal}
      <div className="row mb-4">
        <div className="col-6">
          <Card>
            <Card.Header>
              <div className="float-right">
                { canEdit(auth.user) && (
                    <Link to={`${performer.id}/edit`}>
                        <button type="button" className="btn btn-secondary">Edit</button>
                    </Link>
                )}
                {deleteButton}
              </div>
              <h2>
                <GenderIcon gender={performer.gender} />
                {performer.name}
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
                    <td>{getFuzzyDate(performer.birthdate)}</td>
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
                      <td>{boobJobStatus(performer.breast_type)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Nationality</td>
                    <td>{performer.country}</td>
                  </tr>
                  <tr>
                    <td>Ethnicity</td>
                    <td>{EthnicityTypes[performer.ethnicity]}</td>
                  </tr>
                  <tr>
                    <td>Eye color</td>
                    <td>{EyeColorTypes[performer.eye_color]}</td>
                  </tr>
                  <tr>
                    <td>Hair color</td>
                    <td>{HairColorTypes[performer.hair_color]}</td>
                  </tr>
                  <tr>
                    <td>Tattoos</td>
                    <td>{getBodyModification(performer.tattoos)}</td>
                  </tr>
                  <tr>
                    <td>Piercings</td>
                    <td>{getBodyModification(performer.piercings)}</td>
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
