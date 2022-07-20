import { FC, useRef, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { Control, useFieldArray, FieldError } from "react-hook-form";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

import { useSites, ValidSiteTypeEnum } from "src/graphql";
import { Site_findSite as Site } from "src/graphql/definitions/Site";

const CLASSNAME = "URLInput";

interface URLInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  type: ValidSiteTypeEnum;
  errors?: { url?: FieldError | undefined }[];
}

const URLInput: FC<URLInputProps> = ({ control, type, errors }) => {
  const {
    fields: urls,
    append,
    remove,
  } = useFieldArray<
    { urls: Array<{ url: string; site: { id: string; name: string } }> },
    "urls",
    "key"
  >({
    control,
    name: "urls",
    keyName: "key",
  });
  const [newURL, setNewURL] = useState("");
  const [selectedSite, setSelectedSite] = useState<Site>();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data, loading } = useSites();

  if (loading) return <></>;
  const sites = (data?.querySites.sites ?? []).filter((s) =>
    s.valid_types.includes(type)
  );

  const cleanURL = (
    regexStr: string | undefined | null,
    url: string
  ): string | undefined => {
    if (!regexStr) return;

    const regex = new RegExp(regexStr);
    const match = regex.exec(url);

    if (match.length > 1) {
      match.shift();
      return match.join("");
    } else {
      return match?.[1];
    }
  };

  const handleAdd = () => {
    if (!newURL || !selectedSite) return;
    const cleanedURL = cleanURL(selectedSite?.regex, newURL);

    const url = cleanedURL ?? newURL;
    if (!urls.some((u) => u.url === url))
      append({
        url,
        site: selectedSite,
      });

    if (selectRef.current) selectRef.current.value = "";
    if (inputRef.current) inputRef.current.value = "";
    setSelectedSite(undefined);
    setNewURL("");
  };

  const handleInput = (url: string) => {
    if (!inputRef.current || !selectRef.current) return;

    const site = sites.find((s) => s.regex && new RegExp(s.regex).test(url));

    if (site && selectedSite?.id !== site.id) {
      setSelectedSite(site);
      selectRef.current.value = site.id;
    } else if (url && !site && selectedSite?.regex) {
      setSelectedSite(undefined);
      selectRef.current.value = "";
    }

    if (site?.regex && url) {
      const updatedURL = cleanURL(site.regex, url);
      if (updatedURL) {
        inputRef.current.value = updatedURL;
        return true;
      }
    }
    return false;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const match = handleInput(e.clipboardData.getData("text/plain"));
    if (match) {
      e.preventDefault();
      setNewURL(e.currentTarget.value);
    }
  };

  const handleSiteSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const site = sites.find((s) => s.id === e.currentTarget.value);
    if (site) setSelectedSite(site);
  };

  return (
    <div className={CLASSNAME}>
      <ul>
        {urls.map((u, i) => (
          <li key={u.url}>
            <InputGroup>
              <Button variant="danger" onClick={() => remove(i)}>
                Remove
              </Button>
              <InputGroup.Text>
                <b>{u.site.name}</b>
              </InputGroup.Text>
              <InputGroup.Text className="overflow-hidden">
                {u.url}
              </InputGroup.Text>
              <Button variant="primary" href={u.url} target="_blank">
                <Icon icon={faExternalLinkAlt} />
              </Button>
            </InputGroup>
            {errors?.[i]?.url && (
              <div className="text-danger">{errors?.[i]?.url?.message}</div>
            )}
          </li>
        ))}
      </ul>
      <InputGroup>
        <InputGroup.Text>Add new link</InputGroup.Text>
        <Form.Control
          as="select"
          disabled={sites.length === 0}
          ref={selectRef}
          onChange={handleSiteSelect}
          defaultValue=""
        >
          <option disabled value="">
            Select site
          </option>
          {sites.length === 0 ? (
            <option>No valid sites</option>
          ) : (
            sites.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))
          )}
        </Form.Control>
        <Form.Control
          ref={inputRef}
          onBlur={(e) => handleInput(e.currentTarget.value)}
          placeholder="URL"
          onChange={(e) => setNewURL(e.currentTarget.value)}
          onPaste={handlePaste}
          className="w-50"
        />
        <Button onClick={handleAdd} disabled={!newURL || !selectedSite}>
          Add
        </Button>
      </InputGroup>
    </div>
  );
};

export default URLInput;
