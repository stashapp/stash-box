import { FC, useRef, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Control, useFieldArray } from "react-hook-form";

import { useSites, ValidSiteTypeEnum } from "src/graphql";
import { Site_findSite as Site } from "src/graphql/definitions/Site";

const CLASSNAME = "URLInput";

interface URLInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  type: ValidSiteTypeEnum;
}

const URLInput: FC<URLInputProps> = ({ control, type }) => {
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

    return match?.[1];
  };

  const handleAdd = () => {
    if (!newURL || !selectedSite) return;
    const cleanedURL = cleanURL(selectedSite?.regex, newURL);

    append({
      url: cleanedURL ?? newURL,
      site: selectedSite,
    });

    if (selectRef.current) selectRef.current.value = "";
    if (inputRef.current) inputRef.current.value = "";
    setSelectedSite(undefined);
    setNewURL("");
  };

  const handleBlur = () => {
    if (!inputRef.current || !selectRef.current) return;

    const url = inputRef.current.value;
    const site =
      selectedSite ??
      sites.find((s) => s.regex && new RegExp(s.regex).test(url));

    if (site?.regex && url) {
      const updatedURL = cleanURL(site.regex, url);
      if (updatedURL) inputRef.current.value = updatedURL;
    }

    if (site && selectedSite?.id !== site.id) {
      setSelectedSite(site);
      selectRef.current.value = site.id;
    }
  };

  const handleRemove = (url: string) => {
    const index = urls.findIndex((u) => u.url === url);
    if (index !== -1) remove(index);
  };

  const handleSiteSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const site = sites.find((s) => s.id === e.currentTarget.value);
    if (site) setSelectedSite(site);
  };

  return (
    <div className={CLASSNAME}>
      <ul>
        {urls.map((u) => (
          <li key={u.url}>
            <InputGroup>
              <Button variant="danger" onClick={() => handleRemove(u.url)}>
                Remove
              </Button>
              <InputGroup.Text>
                <b>{u.site.name}</b>
              </InputGroup.Text>
              <InputGroup.Text className="overflow-hidden">
                {u.url}
              </InputGroup.Text>
            </InputGroup>
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
          onBlur={handleBlur}
          placeholder="URL"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewURL(e.currentTarget.value)
          }
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
