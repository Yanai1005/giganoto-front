// ~/games/toba/utils/Constants.js

export const GAME_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    FPS: 60
};

export const PLAYER_CONFIG = {
    SPEED: 300,
    MAX_HP: 3,
    FIRE_RATE: 200, // ミリ秒
    BULLET_SPEED: 400,
    INITIAL_BULLET_COUNT: 1,
    MAX_BULLET_COUNT: 5,
    INITIAL_SPREAD_ANGLE: 0,
    MAX_SPREAD_ANGLE: 45
};

export const ENEMY_TYPES = {
    TYPE1: {
        key: 'enemy_type1',
        hp: 1,
        speed: 100,
        score: 10,
        color: 0xff0000,
        size: { width: 20, height: 20 },
        fireRate: 0.01 // 1%の確率で発射
    },
    TYPE2: {
        key: 'enemy_type2',
        hp: 2,
        speed: 80,
        score: 20,
        color: 0x00ff00,
        size: { width: 25, height: 25 },
        fireRate: 0.015
    },
    TYPE3: {
        key: 'enemy_type3',
        hp: 3,
        speed: 120,
        score: 30,
        color: 0x0000ff,
        size: { width: 22, height: 22 },
        fireRate: 0.02
    },
    TYPE4: {
        key: 'enemy_type4',
        hp: 1,
        speed: 200,
        score: 15,
        color: 0xffff00,
        size: { width: 18, height: 18 },
        fireRate: 0.025
    },
    TYPE5: {
        key: 'enemy_type5',
        hp: 4,
        speed: 60,
        score: 40,
        color: 0xff00ff,
        size: { width: 30, height: 30 },
        fireRate: 0.008
    }
};

export const BULLET_CONFIG = {
    PLAYER_BULLET: {
        key: 'player_bullet',
        speed: 400,
        color: 0xffffff,
        size: 6
    },
    ENEMY_BULLET: {
        key: 'enemy_bullet',
        speed: 150,
        color: 0xff0000,
        size: 8
    }
};

export const POWERUP_CONFIG = {
    SPAWN_RATE: 15000, // 15秒
    FALL_SPEED: 100,
    SCORE_VALUE: 50,
    TYPES: {
        SPEED: {
            key: 'speed',
            name: 'Bullet Speed UP!',
            color: 0xff6600
        },
        RATE: {
            key: 'rate',
            name: 'Fire Rate UP!',
            color: 0x00ff66
        },
        COUNT: {
            key: 'count',
            name: 'Multi Shot!',
            color: 0x6600ff
        },
        SPREAD: {
            key: 'spread',
            name: 'Spread Shot!',
            color: 0xffff00
        }
    }
};

export const SPAWN_CONFIG = {
    ENEMY_SPAWN_RATE: 2000, // 2秒
    ENEMY_SPAWN_Y: -30,
    ENEMY_SPAWN_X_MIN: 50,
    ENEMY_SPAWN_X_MAX: 750
};

export const SCORE_CONFIG = {
    ENEMY_KILL_BASE: 10,
    POWERUP_COLLECT: 50
};

export const EFFECTS_CONFIG = {
    DAMAGE_TINT_DURATION: 100,
    PLAYER_DAMAGE_TINT_DURATION: 200,
    DEATH_SCALE: 1.5,
    DEATH_DURATION: 50
};