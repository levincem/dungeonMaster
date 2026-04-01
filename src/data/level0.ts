import type { TileType } from './level1';

export type Level0TileType = TileType | 'G';

// Hall of Champions — Level 0
// 7-wide corridor: walls at 0 & 6, mirrors at 1 & 5, floor at 2-3-4 (3 wide)
// Single gate at center column 3.
//
//  W W W W W W W   row  0
//  W M F F F M W   rows 1–12  (M = champion mirror)
//  W W W G W W W   row 13     (G = iron gate, center only)
//  W W W E W W W   row 14     (E = exit stairs)
//  W W W W W W W   row 15

export const HALL_OF_CHAMPIONS: Level0TileType[][] = [
    //         0    1    2    3    4    5    6
    /* 00 */ ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
    /* 01 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 02 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 03 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 04 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 05 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 06 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 07 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 08 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 09 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 10 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 11 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 12 */ ['W', 'M', 'F', 'F', 'F', 'M', 'W'],
    /* 13 */ ['W', 'W', 'W', 'G', 'W', 'W', 'W'],
    /* 14 */ ['W', 'W', 'W', 'E', 'W', 'W', 'W'],
    /* 15 */ ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
];

// Player starts at center of the 3-wide corridor, facing south
export const HALL_START_POSITION: [number, number] = [1, 3];
export const HALL_START_DIRECTION = 'SOUTH';

// Mirror (row, col) → champion index 0–23
// Left wall (col 1): champions 0–11
// Right wall (col 5): champions 12–23
export const MIRROR_CHAMPION_MAP: { [key: string]: number } = {
    '1,1':  0,  '2,1':  1,  '3,1':  2,  '4,1':  3,
    '5,1':  4,  '6,1':  5,  '7,1':  6,  '8,1':  7,
    '9,1':  8,  '10,1': 9,  '11,1': 10, '12,1': 11,
    '1,5':  12, '2,5':  13, '3,5':  14, '4,5':  15,
    '5,5':  16, '6,5':  17, '7,5':  18, '8,5':  19,
    '9,5':  20, '10,5': 21, '11,5': 22, '12,5': 23,
};
