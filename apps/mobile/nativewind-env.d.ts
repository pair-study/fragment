/// <reference types="nativewind/types" />

declare module "*.png" {
  const value: number;
  export default value;
}

declare module "nativewind/preset" {
  const preset: object;
  export default preset;
}
