declare module 'clsx' {
  export type ClassValue = 
    | string
    | number
    | boolean
    | undefined
    | null
    | { [key: string]: boolean | undefined | null }
    | ClassValue[];

  function clsx(...inputs: ClassValue[]): string;
  export { clsx };
  export default clsx;
}

