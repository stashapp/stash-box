import { type FC, useState } from "react";
import GalleryCard from "src/components/galleryCard";
import type PerformerCard from "src/components/performerCard";
import { type QueryGalleryFragment, usePairingGalleries } from "src/graphql";
import { PairingRowLayout } from "./pairingRowLayout";

interface Props {
  performerId: string;
  partner: React.ComponentProps<typeof PerformerCard>["performer"];
  galleryCount: number;
  firstPage: QueryGalleryFragment[];
  perPage: number;
}

export const GalleryPairingRow: FC<Props> = ({
  performerId,
  partner,
  galleryCount,
  firstPage,
  perPage,
}) => {
  const [page, setPage] = useState(1);
  const { data, loading } = usePairingGalleries(
    {
      performerId,
      partnerId: partner.id,
      page,
      per_page: perPage,
    },
    page === 1,
  );
  const galleries =
    page === 1
      ? firstPage
      : (data?.findPerformer?.queryGalleries.galleries ?? []);

  return (
    <PairingRowLayout
      partner={partner}
      count={galleryCount}
      items={galleries}
      loading={loading}
      page={page}
      perPage={perPage}
      setPage={setPage}
      noun="gallery"
      pluralNoun="galleries"
      renderItem={(gallery) => <GalleryCard gallery={gallery} />}
    />
  );
};
