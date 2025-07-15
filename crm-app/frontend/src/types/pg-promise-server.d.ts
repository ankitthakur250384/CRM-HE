/**
 * Type definitions for pg-promise-server.js
 */

declare module '../../lib/pg-promise-server.js' {
  import pgPromiseOriginal from 'pg-promise';
  const pgPromise: typeof pgPromiseOriginal;
  export default pgPromise;
}

declare module './pg-promise-server.js' {
  import pgPromiseOriginal from 'pg-promise';
  const pgPromise: typeof pgPromiseOriginal;
  export default pgPromise;
}
