export type TileType = 'W' | 'F' | 'D' | 'S' | 'M' | 'E' | 'U'; // Wall, Floor, Door, Start, Mirror, Exit, UpStairs

export const LEVEL_1: TileType[][] = [
  ['W', 'U', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
  ['W', 'S', 'F', 'F', 'W', 'F', 'F', 'F', 'F', 'W'],
  ['W', 'F', 'W', 'F', 'W', 'F', 'W', 'W', 'F', 'W'],
  ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
  ['W', 'W', 'W', 'W', 'W', 'W', 'F', 'W', 'W', 'W'],
  ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
  ['W', 'F', 'W', 'W', 'W', 'W', 'W', 'W', 'F', 'W'],
  ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
  ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
];
