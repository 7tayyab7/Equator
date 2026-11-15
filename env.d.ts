declare module 'virtual:react-router/server-build' {
  import type {ServerBuild} from 'react-router';
  const build: ServerBuild;
  export = build;
}
interface Env {
  PK_ONLY_ENABLED?: string;
  PK_ONLY_ALLOW_SEARCH_BOTS?: string;
}
