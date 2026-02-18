import { type FC, useMemo, useCallback } from "react";
import {
  useNavigate,
  useSearchParams,
  Outlet,
  NavLink,
} from "react-router-dom";
import { Badge, Form, Nav } from "react-bootstrap";
import { debounce } from "lodash-es";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { Icon } from "src/components/fragments";
import Title from "src/components/title";
import { useSearchAll } from "src/graphql";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;

export const SearchLayout: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";
  const query = term ? `?q=${encodeURIComponent(term)}` : "";

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string, pathname: string) => {
        const q = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : "";
        navigate(`${pathname}${q}`, { replace: true });
      }, 200),
    [navigate],
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      debouncedSearch(searchTerm, location.pathname);
    },
    [debouncedSearch],
  );

  const { data: searchData } = useSearchAll({ term, limit: 10 }, !term);

  const performerCount = searchData?.searchPerformers.count;
  const sceneCount = searchData?.searchScenes.count;

  return (
    <div className={CLASSNAME}>
      <Title page={term || "Search"} />
      <Form.Group className={cx(CLASSNAME_INPUT, "mb-3")}>
        <Icon icon={faMagnifyingGlass} />
        <Form.Control
          key={term}
          defaultValue={term}
          onChange={(e) => handleSearch(e.currentTarget.value)}
          placeholder="Search for performer or scene"
          autoFocus
        />
      </Form.Group>

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link as={NavLink} to={`/search${query}`} end>
            All
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to={`/search/performers${query}`}>
            Performers
            {performerCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {performerCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to={`/search/scenes${query}`}>
            Scenes
            {sceneCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {sceneCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Outlet />
    </div>
  );
};
