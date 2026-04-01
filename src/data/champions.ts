// Dungeon Master — 24 original champions
// Data sourced from Old_data/dungeon.json + game_db.json
// Stats are on the authentic 0–100 scale from the original game.
// id = portraitId (0–23) matching game_db.json championPortraits.

export type ChampionClass = 'Fighter' | 'Ninja' | 'Wizard' | 'Priest';

export interface ChampionSkills {
    fighter: [number, number, number, number];
    ninja:   [number, number, number, number];
    priest:  [number, number, number, number];
    wizard:  [number, number, number, number];
}

export interface Champion {
    id: number;             // = portraitId (0–23)
    name: string;
    title: string;
    gender: 'M' | 'F';
    class: ChampionClass;   // derived from highest skill total
    // Stats — authentic 0–100 scale
    health: number;
    stamina: number;
    mana: number;
    luck: number;
    strength: number;
    dexterity: number;
    wisdom: number;
    vitality: number;
    antiMagic: number;
    antiFire: number;
    // Skill levels in all four disciplines [sub1, sub2, sub3, sub4]
    skills: ChampionSkills;
    // UI colour (class-based, used for mirror borders)
    color: string;
    // Starting equipment (populated in Phase 3 from dungeon item objects)
    equipment: string[];
    // Portrait image path
    portrait: string;
}

// Class colours used by UI components
export const CLASS_COLORS: Record<ChampionClass, string> = {
    Fighter: '#c0392b',
    Ninja:   '#27ae60',
    Wizard:  '#8e44ad',
    Priest:  '#2980b9',
};

// ─── Portrait image paths ─────────────────────────────────────────────────────
const PORTRAITS: Record<number, string> = {
     0: '/portraits/elija.png',
     1: '/portraits/halk.png',
     2: '/portraits/syra.png',
     3: '/portraits/hissssa.png',
     4: '/portraits/zed.png',
     5: '/portraits/chani.png',
     6: '/portraits/hawk.png',
     7: '/portraits/boris.png',
     8: '/portraits/mophus.png',
     9: '/portraits/leif.png',
    10: '/portraits/wuTse.png',
    11: '/portraits/alex.png',
    12: '/portraits/linflas.png',
    13: '/portraits/azizi.png',
    14: '/portraits/iaido.png',
    15: '/portraits/gando.png',
    16: '/portraits/stamm.png',
    17: '/portraits/leyla.png',
    18: '/portraits/tiggy.png',
    19: '/portraits/sonja.png',
    20: '/portraits/nabi.png',
    21: '/portraits/gothmog.png',
    22: '/portraits/wuuf.png',
    23: '/portraits/daroou.png',
};

// ─── Champions — authentic DM data ────────────────────────────────────────────
export const CHAMPIONS: Champion[] = [
    {
        id: 0, name: 'ELIJA', title: 'LION OF YAITOPYA', gender: 'M',
        class: 'Priest',
        health: 60, stamina: 58, mana: 22, luck: 50,
        strength: 42, dexterity: 40, wisdom: 42, vitality: 36, antiMagic: 53, antiFire: 40,
        skills: { fighter: [1,1,2,0], ninja: [0,0,0,0], priest: [2,1,4,2], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Priest, equipment: [], portrait: PORTRAITS[0],
    },
    {
        id: 1, name: 'HALK', title: 'THE BARBARIAN', gender: 'M',
        class: 'Fighter',
        health: 90, stamina: 75, mana: 0, luck: 40,
        strength: 55, dexterity: 43, wisdom: 30, vitality: 46, antiMagic: 38, antiFire: 48,
        skills: { fighter: [4,0,4,0], ninja: [0,0,0,0], priest: [0,0,0,0], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[1],
    },
    {
        id: 2, name: 'SYRA', title: 'CHILD OF NATURE', gender: 'F',
        class: 'Wizard',
        health: 53, stamina: 72, mana: 15, luck: 55,
        strength: 38, dexterity: 35, wisdom: 43, vitality: 45, antiMagic: 42, antiFire: 40,
        skills: { fighter: [0,0,0,0], ninja: [0,0,0,0], priest: [0,3,1,1], wizard: [0,2,3,3] },
        color: CLASS_COLORS.Wizard, equipment: [], portrait: PORTRAITS[2],
    },
    {
        id: 3, name: 'HISSSSA', title: 'LIZAR OF MAKAN', gender: 'M',
        class: 'Fighter',
        health: 80, stamina: 61, mana: 5, luck: 40,
        strength: 58, dexterity: 48, wisdom: 35, vitality: 35, antiMagic: 43, antiFire: 55,
        skills: { fighter: [4,3,0,0], ninja: [0,3,1,0], priest: [0,0,0,0], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[3],
    },
    {
        id: 4, name: 'ZED', title: 'DUKE OF BANVILLE', gender: 'M',
        class: 'Fighter',
        health: 60, stamina: 60, mana: 10, luck: 58,
        strength: 40, dexterity: 40, wisdom: 40, vitality: 50, antiMagic: 40, antiFire: 40,
        skills: { fighter: [2,1,1,2], ninja: [2,1,2,1], priest: [1,2,1,1], wizard: [1,2,1,1] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[4],
    },
    {
        id: 5, name: 'CHANI', title: 'SAYYADINA SIHAYA', gender: 'F',
        class: 'Wizard',
        health: 47, stamina: 67, mana: 17, luck: 57,
        strength: 37, dexterity: 47, wisdom: 57, vitality: 37, antiMagic: 47, antiFire: 37,
        skills: { fighter: [1,3,0,2], ninja: [0,0,0,0], priest: [0,0,0,0], wizard: [3,2,3,1] },
        color: CLASS_COLORS.Wizard, equipment: [], portrait: PORTRAITS[5],
    },
    {
        id: 6, name: 'HAWK', title: 'THE FEARLESS', gender: 'M',
        class: 'Priest',
        health: 70, stamina: 85, mana: 10, luck: 40,
        strength: 45, dexterity: 35, wisdom: 38, vitality: 55, antiMagic: 35, antiFire: 35,
        skills: { fighter: [2,0,0,2], ninja: [0,0,0,0], priest: [0,3,0,3], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Priest, equipment: [], portrait: PORTRAITS[6],
    },
    {
        id: 7, name: 'BORIS', title: 'WIZARD OF BALDOR', gender: 'M',
        class: 'Wizard',
        health: 35, stamina: 65, mana: 28, luck: 25,
        strength: 35, dexterity: 45, wisdom: 55, vitality: 40, antiMagic: 45, antiFire: 40,
        skills: { fighter: [0,0,0,0], ninja: [3,2,1,0], priest: [0,0,0,0], wizard: [2,3,3,3] },
        color: CLASS_COLORS.Wizard, equipment: [], portrait: PORTRAITS[7],
    },
    {
        id: 8, name: 'MOPHUS', title: 'THE HEALER', gender: 'M',
        class: 'Priest',
        health: 55, stamina: 55, mana: 19, luck: 40,
        strength: 42, dexterity: 35, wisdom: 40, vitality: 48, antiMagic: 40, antiFire: 45,
        skills: { fighter: [0,0,0,0], ninja: [0,0,0,0], priest: [2,4,3,2], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Priest, equipment: [], portrait: PORTRAITS[8],
    },
    {
        id: 9, name: 'LEIF', title: 'THE VALIANT', gender: 'M',
        class: 'Fighter',
        health: 75, stamina: 70, mana: 7, luck: 35,
        strength: 46, dexterity: 40, wisdom: 39, vitality: 50, antiMagic: 45, antiFire: 45,
        skills: { fighter: [3,2,2,0], ninja: [0,0,0,0], priest: [0,2,1,1], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[9],
    },
    {
        id: 10, name: 'WU TSE', title: 'SON OF HEAVEN', gender: 'F',
        class: 'Priest',
        health: 45, stamina: 47, mana: 20, luck: 40,
        strength: 38, dexterity: 35, wisdom: 53, vitality: 45, antiMagic: 47, antiFire: 40,
        skills: { fighter: [0,0,0,0], ninja: [1,2,0,3], priest: [2,1,4,3], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Priest, equipment: [], portrait: PORTRAITS[10],
    },
    {
        id: 11, name: 'ALEX', title: 'ANDER', gender: 'M',
        class: 'Ninja',
        health: 50, stamina: 57, mana: 13, luck: 47,
        strength: 44, dexterity: 55, wisdom: 45, vitality: 40, antiMagic: 35, antiFire: 40,
        skills: { fighter: [0,0,0,0], ninja: [3,2,3,2], priest: [0,0,0,0], wizard: [2,2,1,2] },
        color: CLASS_COLORS.Ninja, equipment: [], portrait: PORTRAITS[11],
    },
    {
        id: 12, name: 'LINFLAS', title: '', gender: 'M',
        class: 'Fighter',
        health: 65, stamina: 50, mana: 12, luck: 45,
        strength: 45, dexterity: 45, wisdom: 47, vitality: 35, antiMagic: 50, antiFire: 35,
        skills: { fighter: [0,1,2,4], ninja: [0,0,1,0], priest: [0,1,0,0], wizard: [0,1,2,2] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[12],
    },
    {
        id: 13, name: 'AZIZI', title: 'JOHARI', gender: 'F',
        class: 'Ninja',
        health: 61, stamina: 77, mana: 7, luck: 47,
        strength: 47, dexterity: 48, wisdom: 42, vitality: 45, antiMagic: 30, antiFire: 35,
        skills: { fighter: [2,1,3,0], ninja: [2,2,3,3], priest: [0,0,0,0], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Ninja, equipment: [], portrait: PORTRAITS[13],
    },
    {
        id: 14, name: 'IAIDO', title: 'RUYITO CHIBURI', gender: 'M',
        class: 'Fighter',
        health: 48, stamina: 65, mana: 11, luck: 40,
        strength: 43, dexterity: 55, wisdom: 40, vitality: 35, antiMagic: 45, antiFire: 50,
        skills: { fighter: [2,3,0,2], ninja: [0,0,0,0], priest: [1,1,1,2], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[14],
    },
    {
        id: 15, name: 'GANDO', title: 'THURFOOT', gender: 'M',
        class: 'Ninja',
        health: 39, stamina: 63, mana: 26, luck: 50,
        strength: 39, dexterity: 45, wisdom: 47, vitality: 33, antiMagic: 48, antiFire: 43,
        skills: { fighter: [0,0,0,0], ninja: [3,0,2,3], priest: [0,0,0,0], wizard: [1,2,1,2] },
        color: CLASS_COLORS.Ninja, equipment: [], portrait: PORTRAITS[15],
    },
    {
        id: 16, name: 'STAMM', title: 'BLADECASTER', gender: 'M',
        class: 'Fighter',
        health: 75, stamina: 80, mana: 0, luck: 35,
        strength: 52, dexterity: 43, wisdom: 35, vitality: 50, antiMagic: 35, antiFire: 55,
        skills: { fighter: [3,4,2,2], ninja: [0,0,0,0], priest: [0,0,0,0], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[16],
    },
    {
        id: 17, name: 'LEYLA', title: 'SHADOWSEEK', gender: 'F',
        class: 'Ninja',
        health: 48, stamina: 60, mana: 3, luck: 50,
        strength: 40, dexterity: 53, wisdom: 45, vitality: 47, antiMagic: 45, antiFire: 35,
        skills: { fighter: [0,0,0,0], ninja: [3,3,3,4], priest: [0,0,0,0], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Ninja, equipment: [], portrait: PORTRAITS[17],
    },
    {
        id: 18, name: 'TIGGY', title: 'TAMAL', gender: 'F',
        class: 'Wizard',
        health: 25, stamina: 45, mana: 35, luck: 45,
        strength: 30, dexterity: 45, wisdom: 50, vitality: 35, antiMagic: 59, antiFire: 40,
        skills: { fighter: [0,0,0,0], ninja: [1,3,1,1], priest: [1,0,0,0], wizard: [2,3,3,2] },
        color: CLASS_COLORS.Wizard, equipment: [], portrait: PORTRAITS[18],
    },
    {
        id: 19, name: 'SONJA', title: 'SHE DEVIL', gender: 'F',
        class: 'Fighter',
        health: 65, stamina: 70, mana: 2, luck: 40,
        strength: 54, dexterity: 45, wisdom: 39, vitality: 49, antiMagic: 40, antiFire: 40,
        skills: { fighter: [3,4,2,3], ninja: [0,0,0,0], priest: [0,0,0,0], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[19],
    },
    {
        id: 20, name: 'NABI', title: 'THE PROPHET', gender: 'M',
        class: 'Priest',
        health: 55, stamina: 65, mana: 13, luck: 40,
        strength: 41, dexterity: 36, wisdom: 45, vitality: 45, antiMagic: 55, antiFire: 55,
        skills: { fighter: [0,0,0,0], ninja: [0,0,0,0], priest: [1,1,4,2], wizard: [1,1,1,1] },
        color: CLASS_COLORS.Priest, equipment: [], portrait: PORTRAITS[20],
    },
    {
        id: 21, name: 'GOTHMOG', title: '', gender: 'M',
        class: 'Wizard',
        health: 60, stamina: 55, mana: 18, luck: 30,
        strength: 40, dexterity: 35, wisdom: 48, vitality: 34, antiMagic: 50, antiFire: 59,
        skills: { fighter: [0,0,0,0], ninja: [0,0,0,0], priest: [0,0,0,0], wizard: [4,3,2,2] },
        color: CLASS_COLORS.Wizard, equipment: [], portrait: PORTRAITS[21],
    },
    {
        id: 22, name: 'WUUF', title: 'THE BIKA', gender: 'F',
        class: 'Ninja',
        health: 40, stamina: 50, mana: 30, luck: 60,
        strength: 33, dexterity: 57, wisdom: 45, vitality: 40, antiMagic: 35, antiFire: 40,
        skills: { fighter: [0,0,0,0], ninja: [1,2,3,4], priest: [0,3,2,1], wizard: [0,0,0,0] },
        color: CLASS_COLORS.Ninja, equipment: [], portrait: PORTRAITS[22],
    },
    {
        id: 23, name: 'DAROOU', title: '', gender: 'M',
        class: 'Fighter',
        health: 100, stamina: 65, mana: 6, luck: 35,
        strength: 50, dexterity: 30, wisdom: 35, vitality: 45, antiMagic: 30, antiFire: 45,
        skills: { fighter: [3,0,3,0], ninja: [0,0,0,0], priest: [0,0,0,0], wizard: [0,0,1,1] },
        color: CLASS_COLORS.Fighter, equipment: [], portrait: PORTRAITS[23],
    },
];

// Lookup by id
export const CHAMPION_BY_ID: Record<number, Champion> = Object.fromEntries(
    CHAMPIONS.map(c => [c.id, c])
);
