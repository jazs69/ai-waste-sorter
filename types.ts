export enum WasteCategory {
  PLASTIC = "Plastic",
  PAPER = "Paper",
  CARDBOARD = "Cardboard",
  GLASS = "Glass",
  METAL = "Metal",
  UNKNOWN = "Unknown"
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added here if needed
}