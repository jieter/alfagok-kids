// see the gzip-asset plugin in vite.config.ts
declare module "*?gzip" {
  const url: string;
  export default url;
}
