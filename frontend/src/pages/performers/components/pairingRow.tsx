import { type FC, useState } from "react";
import type PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import { type PairingSceneFragment, usePairingScenes } from "src/graphql";
import { PairingRowLayout } from "./pairingRowLayout";

interface Props {
  performerId: string;
  partner: React.ComponentProps<typeof PerformerCard>["performer"];
  sceneCount: number;
  firstPage: PairingSceneFragment[];
  perPage: number;
}

// The first page arrives with the partner list, so only later pages query
export const PairingRow: FC<Props> = ({
  performerId,
  partner,
  sceneCount,
  firstPage,
  perPage,
}) => {
  const [page, setPage] = useState(1);

  const { data, loading } = usePairingScenes(
    {
      performerId,
      partnerId: partner.id,
      page,
      per_page: perPage,
    },
    page === 1,
  );

  const scenes =
    page === 1 ? firstPage : (data?.findPerformer?.queryScenes.scenes ?? []);

  return (
    <PairingRowLayout
      partner={partner}
      count={sceneCount}
      items={scenes}
      loading={loading}
      page={page}
      perPage={perPage}
      setPage={setPage}
      noun="scene"
      renderItem={(scene) => <SceneCard scene={scene} />}
    />
  );
};
