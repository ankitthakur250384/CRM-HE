/**
 * TypeScript declaration for noServerModules plugin
 */
declare function noServerModules(): {
  name: string;
  resolveId(id: string): { id: string; external: boolean } | null;
  load(id: string): string | null;
};

export default noServerModules;
