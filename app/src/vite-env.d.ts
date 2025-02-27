/// <reference types="vite/client" />
declare module "virtual:recommand-file-based-router" {
  interface Route {
    route: string;
    pageFilePath: string | null;
    PageComponent: React.ComponentType | null;
    layoutFilePath: string | null;
    LayoutComponent: React.ComponentType | null;
    children: Route[];
  }  
  export const routes: Route[];
  export const entrypoints: React.ComponentType<{ children?: React.ReactNode }>[];
  export default routes;
}
