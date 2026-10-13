// Sound files bundled by Metro resolve to an asset id.
declare module "*.mp3" {
  const asset: number;
  export default asset;
}
