declare module "*.md" {
  export default string;
}
declare module "*.gql" {
  import { DocumentNode } from "graphql";

  const value: DocumentNode;
  export default value;
}

interface ImportMetaEnv extends Readonly<Record<string, string>> {
  readonly VITE_APIKEY?: string;
  readonly VITE_SERVER_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
