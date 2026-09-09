import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Badge, Form, Nav } from "react-bootstrap";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { Icon } from "src/components/fragments";
import Title from "src/components/title";
import { ROUTE_SEARCH } from "src/constants/route";
import { useSearchAll } from "src/graphql";
import { useDebouncedCallback } from "src/hooks";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;

export interface SearchLayoutOutletContext {
  setPerformerCount: (count: number | undefined) => void;
  setSceneCount: (count: number | undefined) => void;
}

export const SearchLayout: FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";
  const query = term ? `?q=${encodeURIComponent(term)}` : "";
  const isAllTab = pathname === ROUTE_SEARCH;
  const [performerCount, setPerformerCount] = useState<number>();
  const [sceneCount, setSceneCount] = useState<number>();

  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef(term);

  useEffect(() => {
    if (inputRef.current && term !== inputValueRef.current) {
      inputRef.current.value = term;
      inputValueRef.current = term;
    }
  }, [term]);

  const debouncedSearch = useDebouncedCallback(
    (searchTerm: string, pathname: string) => {
      const q = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : "";
      navigate(`${pathname}${q}`, { replace: true });
    },
    200,
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      inputValueRef.current = searchTerm;
      debouncedSearch(searchTerm, pathname);
    },
    [debouncedSearch, pathname],
  );

  const { data: searchData } = useSearchAll(
    { term, limit: 10 },
    !term || !isAllTab,
  );

  useEffect(() => {
    if (isAllTab) return;
    setPerformerCount(undefined);
    setSceneCount(undefined);
  }, [isAllTab]);

  const displayedPerformerCount = isAllTab
    ? searchData?.searchPerformers.count
    : performerCount;
  const displayedSceneCount = isAllTab
    ? searchData?.searchScenes.count
    : sceneCount;

  return (
    <div className={CLASSNAME}>
      <Title page={term || "Search"} />
      <Form.Group className={cx(CLASSNAME_INPUT, "mb-3")}>
        <Icon icon={faMagnifyingGlass} />
        <Form.Control
          ref={inputRef}
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
            {displayedPerformerCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {displayedPerformerCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to={`/search/scenes${query}`}>
            Scenes
            {displayedSceneCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {displayedSceneCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Outlet context={{ setPerformerCount, setSceneCount }} />
    </div>
  );
};
