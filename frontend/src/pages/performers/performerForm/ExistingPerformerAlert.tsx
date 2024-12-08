import { FC, useCallback, useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { debounce } from "lodash-es";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import {
  useQueryExistingPerformer,
  QueryExistingPerformerInput,
} from "src/graphql";
import { Icon, PerformerName } from "src/components/fragments";
import { performerHref, editHref } from "src/utils";

interface Props {
  name: string;
  disambiguation?: string | null;
  urls?: { url: string }[];
}

const ExistingPerformerAlert: FC<Props> = ({
  name,
  disambiguation,
  urls = [],
}) => {
  const [input, setInput] = useState<QueryExistingPerformerInput>({
    name: "",
    urls: [],
  });
  const { data: existingData } = useQueryExistingPerformer(
    { input },
    input.urls.length === 0 && input.name?.length === 0,
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setInputData = useCallback(
    debounce((input: QueryExistingPerformerInput) => setInput(input), 1000),
    [],
  );

  useEffect(() => {
    setInputData({
      name,
      disambiguation,
      urls: urls.map((u) => u.url),
    });
  }, [name, disambiguation, urls, setInputData]);

  const existingPerformer =
    existingData?.queryExistingPerformer.performers ?? [];
  const existingEdits = existingData?.queryExistingPerformer.edits ?? [];

  if (existingPerformer.length === 0 && existingEdits.length === 0) return null;

  return (
    <Alert variant="warning">
      <div className="mb-2">
        <b>Warning: Performer match found</b>
      </div>

      {existingPerformer.length > 0 && (
        <div className="mb-2">
          <span>Existing performers that have the same name or link:</span>
          {existingPerformer.map((p) => (
            <div key={p.id}>
              <Icon icon={faExclamationTriangle} color="red" />
              <Link to={performerHref(p)} className="ms-2">
                <b>
                  <PerformerName performer={p} />
                </b>
              </Link>
            </div>
          ))}
        </div>
      )}

      {existingEdits.length > 0 && (
        <div className="mb-2">
          <span>
            Pending edits that submit performers with the same name or links:
          </span>
          {existingEdits.map(
            (e) =>
              e.details?.__typename === "PerformerEdit" && (
                <div key={e.id}>
                  <Icon icon={faExclamationTriangle} color="red" />
                  <Link to={editHref(e)} className="ms-2">
                    <b>
                      <PerformerName
                        performer={{
                          name: e.details.name ?? "",
                          disambiguation: e.details.disambiguation,
                          deleted: false,
                        }}
                      />
                    </b>
                  </Link>
                </div>
              ),
          )}
        </div>
      )}

      <div>
        Please verify your draft is not already in the database before
        submitting.
      </div>
    </Alert>
  );
};

export default ExistingPerformerAlert;
