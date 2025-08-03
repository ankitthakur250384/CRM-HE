declare module 'tailwind-merge' {
  export type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean | undefined | null } | ClassValue[];
  
  export function twMerge(...inputs: ClassValue[]): string;
  export { twMerge as default };
}

