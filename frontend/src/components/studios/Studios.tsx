import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  Studios,
  Studios_queryStudios_studios as Studio,
} from "src/definitions/Studios";

import { LoadingIndicator } from "src/components/fragments";

const StudiosQuery = loader("src/queries/Studios.gql");

interface ParentStudio {
  studio: Studio;
  subStudios: Studio[];
}

const StudiosComponent: React.FC = () => {
  const { loading: loadingData, data } = useQuery<Studios>(StudiosQuery, {
    variables: { filter: { page: 0, per_page: 10000 } },
  });

  if (loadingData) return <LoadingIndicator message="Loading studios..." />;

  const parentStudios = (data?.queryStudios?.studios ?? []).reduce<
    Record<string, ParentStudio>
  >((parents, studio) => {
    const newStudios = { ...parents };
    if (studio.parent)
      newStudios[studio.parent.id] = {
        ...newStudios[studio.parent.id],
        subStudios: [
          ...(newStudios?.[studio.parent.id]?.subStudios ?? []),
          studio,
        ],
      };
    else
      newStudios[studio.id] = {
        ...newStudios[studio.id],
        studio,
      };
    return newStudios;
  }, {});

  const studios = Object.keys(parentStudios)
    .map((id) => parentStudios[id])
    .sort((a, b) => {
      if (a.studio.name < b.studio.name) return -1;
      if (a.studio.name > b.studio.name) return 1;
      return 0;
    });

  const studioList = studios.map((parent) => (
    <li key={parent.studio.id}>
      <Link to={`/studios/${parent.studio.id}`}>{parent.studio.name}</Link>
      {parent.subStudios && (
        <ul>
          {parent.subStudios.map((sub) => (
            <li key={sub.id}>
              <Link to={`/studios/${sub.id}`}>{sub.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  ));

  return (
    <Card>
      <Card.Header>
        <h2>Studios</h2>
      </Card.Header>
      <Card.Body>
        <ul>{studioList}</ul>
      </Card.Body>
    </Card>
  );
};

export default StudiosComponent;
