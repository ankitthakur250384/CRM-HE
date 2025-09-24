// Global JSX declarations to avoid missing JSX intrinsic elements errors
// This provides a permissive fallback so existing TSX files compile when
// @types/react is not present or there's a mismatch between React typings.

declare namespace JSX {
  // Allow any intrinsic element (div, span, label, etc.)
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  // Allow components to return any React node without strict mapping to JSX.Element
  type Element = any;
  type ElementClass = any;
  interface ElementAttributesProperty { props: any }
}
