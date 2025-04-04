// Augment ImportMeta interface for Node.js ESM
interface ImportMeta {
  url: string;
  env: Record<string, string | undefined>;
  
  // Add any other properties you need
  readonly resolve: (specifier: string) => string;
}