/// <reference types="react" />
/// <reference types="vite/client" />

// Merge with React's JSX namespace and provide permissive fallback for intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    // Allow any element/component return types to avoid 'ReactNode' vs 'Element' mismatch errors
    type Element = any;
    type ElementClass = any;
    interface ElementAttributesProperty { props: any }
  }
}
