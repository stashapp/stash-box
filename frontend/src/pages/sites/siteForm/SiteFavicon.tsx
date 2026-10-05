import cx from "classnames";
import { type ChangeEvent, type FC, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useLazyFetchSiteFavicons } from "src/graphql";

const parseMimeType = (dataURL: string) =>
  dataURL.match(/^data:([^;,]+)/)?.[1] ?? "unknown";

interface SiteFaviconProps {
  /** The stored icon URL, shown as the preview while the favicon is unchanged. */
  currentIcon?: string;
  /** Returns the site URL to discover favicons from. */
  getUrl: () => string;
  /** null: unchanged, "": cleared, otherwise a base64 data URL to store. */
  value: string | null;
  onChange: (value: string) => void;
}

const SiteFavicon: FC<SiteFaviconProps> = ({
  currentIcon,
  getUrl,
  value,
  onChange,
}) => {
  const [candidates, setCandidates] = useState<
    { url: string; image: string }[]
  >([]);
  const [error, setError] = useState<string>();
  // Pixel dimensions per candidate, read from each image once it loads.
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const [fetchFavicons, { loading }] = useLazyFetchSiteFavicons();

  const preview = value === null ? (currentIcon ?? "") : value;

  const handleFetch = () => {
    setError(undefined);
    setCandidates([]);
    setDimensions({});
    fetchFavicons({ variables: { url: getUrl() } })
      .then((res) => {
        if (res.error) {
          setError(res.error.message);
          return;
        }
        const found = res.data?.fetchSiteFavicons ?? [];
        if (found.length === 0) setError("No favicons found");
        setCandidates(found.map(({ url, image }) => ({ url, image })));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) =>
        e.target?.result && onChange(e.target.result as string);
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Favicon</Form.Label>
      <div className="d-flex align-items-center gap-2 mb-2">
        {preview ? (
          <img src={preview} alt="" width={24} height={24} />
        ) : (
          <span className="text-muted">No favicon</span>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? "Fetching…" : "Fetch favicons"}
        </Button>
        {preview && (
          <Button
            type="button"
            size="sm"
            variant="outline-danger"
            onClick={() => {
              onChange("");
              setCandidates([]);
            }}
          >
            Remove
          </Button>
        )}
        <Form.Control
          type="file"
          size="sm"
          className="w-auto ms-auto"
          onChange={onFileChange}
          accept=".ico,.png,.jpg,.jpeg,.webp,.svg,.gif"
        />
      </div>

      {error && <div className="text-danger small mb-2">{error}</div>}

      {candidates.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-2">
          {candidates.map((candidate) => (
            <button
              type="button"
              key={candidate.url}
              className={cx(
                "btn btn-outline-secondary d-flex flex-column align-items-center p-2",
                { active: value === candidate.image },
              )}
              title={candidate.url}
              onClick={() => onChange(candidate.image)}
            >
              <img
                src={candidate.image}
                alt=""
                width={32}
                height={32}
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.currentTarget;
                  setDimensions((d) => ({
                    ...d,
                    [candidate.url]: `${naturalWidth}×${naturalHeight}`,
                  }));
                }}
              />
              <span className="small text-muted mt-1">
                {parseMimeType(candidate.image)}
                {dimensions[candidate.url]
                  ? ` · ${dimensions[candidate.url]}`
                  : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      <Form.Text>
        Fetch favicons from the site URL, or upload a custom icon.
      </Form.Text>
    </Form.Group>
  );
};

export default SiteFavicon;
