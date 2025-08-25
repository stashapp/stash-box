// biome-ignore-all lint/performance/noAccumulatingSpread: Necessary for types
import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import querystring from "query-string";
import { isEqual } from "lodash-es";

interface ParamBase {
  name: string;
}
interface StringParamConfig extends ParamBase {
  type: "string";
  default?: string;
}
interface StringArrayParamConfig extends ParamBase {
  type: "string[]";
  default?: string[];
}
interface NumberParamConfig extends ParamBase {
  type: "number";
  default?: number;
}
interface NumberArrayParamConfig extends ParamBase {
  type: "number[]";
  default?: number[];
}
interface BooleanParamConfig extends ParamBase {
  type: "boolean";
  default?: boolean;
}
type ParamConfig =
  | StringParamConfig
  | StringArrayParamConfig
  | NumberParamConfig
  | NumberArrayParamConfig
  | BooleanParamConfig;
type QueryParamConfig = Record<string, ParamConfig>;

export type QueryParams<T extends QueryParamConfig> = {
  [Property in keyof T]: T[Property] extends StringParamConfig
    ? string
    : T[Property] extends StringArrayParamConfig
      ? string[]
      : T[Property] extends NumberParamConfig
        ? number
        : T[Property] extends NumberArrayParamConfig
          ? number[]
          : T[Property] extends BooleanParamConfig
            ? boolean
            : never;
};

type SetParams<T extends QueryParamConfig, K extends keyof T> = (
  name: K,
  value: QueryParams<T>[K] | undefined,
) => void;
export type SetParamsCallback<T extends QueryParamConfig> = SetParams<
  T,
  keyof T
>;

export const ensureArray = (param?: string | (string | null)[]): string[] => {
  if (!param) return [];
  return (Array.isArray(param) ? param : [param]).filter(
    (val) => val,
  ) as string[];
};

export const ensureNumberArray = (
  param?: string | (string | null)[],
): number[] => {
  return ensureArray(param).map((val) => Number.parseInt(val, 10));
};

const getParamValue = (
  config: ParamConfig,
  value: string | (string | null)[],
) => {
  if (config.default && !value) return config.default;
  if (config.type === "number[]") return ensureNumberArray(value);
  if (config.type === "string[]") return ensureArray(value);
  if (config.type === "number") return parseInt(value.toString(), 10);
  if (config.type === "boolean") return value.toString() === "true";
  return value;
};

export const useQueryParams = <T extends QueryParamConfig>(
  queryParams: T,
): [QueryParams<T>, SetParamsCallback<T>] => {
  const navigate = useNavigate();
  const location = useLocation();

  const allParams = useMemo(() => {
    const rawQueryParams = querystring.parse(location.search.replace("?", ""));
    const parsedParams = Object.keys(queryParams).reduce(
      (map, key) => {
        const config = queryParams[key];
        const rawValue = rawQueryParams[config.name];
        rawQueryParams[config.name] = null;
        const value = getParamValue(config, rawValue || "");
        return { ...map, [key]: value };
      },
      {} as QueryParams<T>,
    );

    return {
      ...rawQueryParams,
      ...parsedParams,
    };
  }, [location.search, queryParams]);

  const setParams: SetParamsCallback<T> = useCallback(
    (key, param) => {
      const rawQueryParams = querystring.parse(
        location.search.replace("?", ""),
      );
      const config = queryParams[key];
      const updatedParams = {
        ...rawQueryParams,
        page: undefined,
        [config.name]: param,
      };
      const finalParams = Object.keys(updatedParams).reduce(
        (params, paramKey) => {
          const paramConfig = queryParams[paramKey];
          const paramValue = updatedParams[paramKey];
          let isDefault = false;

          if (paramConfig) {
            const values = !Array.isArray(paramValue)
              ? [paramValue]
              : paramValue;
            const defaultValues = !Array.isArray(paramConfig.default)
              ? [paramConfig.default]
              : paramConfig.default;
            isDefault = isEqual(
              values.map((val) => val?.toString()?.toLowerCase()),
              defaultValues.map((val) => val?.toString()?.toLowerCase()),
            );
          }

          return {
            ...params,
            [paramConfig?.name || paramKey]: isDefault ? undefined : paramValue,
          };
        },
        {},
      );
      const hash = location.hash ?? "";
      navigate(
        `${location.pathname}?${querystring
          .stringify(finalParams)
          .toLowerCase()}${hash}`,
        { replace: true },
      );
    },
    [navigate, location.hash, location.pathname, location.search, queryParams],
  );

  return [allParams, setParams];
};
