
import { Language, ResourceType, ToolTier, Biome, Quest, Enchantment, ItemEnchantment } from './types';
import type { Item, Tool, Armor, Consumable } from './types';

export const WORLD_WIDTH = 15000; // 5x larger
export const WORLD_HEIGHT = 15000; // 5x larger
export const TILE_SIZE = 50;

export const PLAYER_SIZE = 40;
export const PLAYER_SPEED = 4;
export const PLAYER_SPRINT_SPEED = 7;
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_MAX_ENERGY = 100;
export const STAMINA_REGEN_RATE = 0.5;
export const STAMINA_DRAIN_RATE = 1.5;
export const ENERGY_DRAIN_RATE = 0.2; // Energy drains much slower
export const ENERGY_REGEN_PASSIVE_RATE = 0;
export const ENERGY_DAMAGE_AMOUNT = 10;
export const INVENTORY_SLOTS = 32; // Increased for more items
export const HOTBAR_SLOTS = 5;
export const CHEST_INVENTORY_SLOTS = 16;
export const PORTAL_INVENTORY_SLOTS = 5; // Reduced to match UI visual for Ruby portal offering
export const FURNACE_INVENTORY_SLOTS = 3; // 0: input, 1: fuel, 2: output
export const PLAYER_LAUNCH_FORCE = 30;

export const DAY_DURATION_MS = 120000; // 2 minutes
export const NIGHT_DURATION_MS = 60000; // 1 minute
export const BLOOD_MOON_DURATION_MS = 180000; // 3 minutes
export const RAIN_DURATION_MS = 120000; // 2 minutes
export const RESOURCE_RESPAWN_MS = 20000; // 20 seconds as requested
export const LAVA_DAMAGE_THRESHOLD_MS = 60000; // 1 minute
export const LAVA_DAMAGE_PER_SECOND = 5;

export const SMELT_TIME = 10000; // 10 seconds per item
export const FUEL_DURATION: { [key: string]: number } = {
    'coal': 80000, // Smelts 8 items
    'wood': 20000,
    'gasoline': 500000,
};

export const TNT_RADIUS = 150;
export const TNT_DAMAGE = 100;
export const BAZOOKA_RADIUS = 120;
export const BAZOOKA_DAMAGE = 200;
export const CRATER_DURATION_MS = 120000; // 2 minutes

export const ZOMBIE_DETECTION_RADIUS = 350;
export const ZOMBIE_SOUND_INVESTIGATION_RADIUS = 600;

export const ZOMBIE_STATS: { [key: string]: { color: string; size: number; hp: number; damage: number; speed: number; spawnChance?: number; projectileDamage?: number; slowAttack?: { duration: number, factor: number } } } = {
    NORMAL: { color: '#2C5F2D', size: 40, hp: 50, damage: 5, speed: 2, spawnChance: 0.8 },
    GIANT: { color: '#1A3A1A', size: 60, hp: 150, damage: 15, speed: 1.5, spawnChance: 0.15 },
    IMMORTAL: { color: '#0A1A0A', size: 45, hp: 500, damage: 10, speed: 2.5, spawnChance: 0.05 },
    BOSS: { color: '#8B0000', size: 150, hp: 1000, damage: 30, speed: 1, projectileDamage: 20 },
    RUBY: { color: '#E0115F', size: 50, hp: 200, damage: 20, speed: 2.2, spawnChance: 1.0 },
    DESERT: { color: '#C2B280', size: 40, hp: 40, damage: 5, speed: 2.8 },
    SNOW: { color: '#ADD8E6', size: 45, hp: 70, damage: 7, speed: 1.8, slowAttack: { duration: 3000, factor: 0.5 } },
    FOREST: { color: '#556B2F', size: 40, hp: 50, damage: 5, speed: 2.2 },
    LAVA: { color: '#FF4500', size: 42, hp: 60, damage: 8, speed: 2 },
    SWAMP: { color: '#2F4F2F', size: 42, hp: 60, damage: 6, speed: 1.8 },
    MEGA_BOSS: { color: '#8B0000', size: 300, hp: 5000, damage: 50, speed: 1.0, projectileDamage: 30 },
};

export const ANIMAL_STATS = {
    PIG: { color: '#FFC0CB', size: 35, hp: 20, speed: 1.5 },
    COW: { color: '#FFFFFF', size: 50, hp: 40, speed: 1.2 },
    CHICKEN: { color: '#FFFFE0', size: 20, hp: 10, speed: 2 },
    SHEEP: { color: '#D3D3D3', size: 40, hp: 25, speed: 1.4 },
    SCORPION: { color: '#8B4513', size: 30, hp: 50, speed: 3.0, damage: 5, poisonDuration: 10000, poisonDamage: 2 }, // Fast, poisons
    POLAR_BEAR: { color: '#F0F8FF', size: 60, hp: 150, speed: 2.5, damage: 30 }, // Strong
    PENGUIN: { color: '#000000', size: 25, hp: 20, speed: 2.0 }, // Tamable
};

export const DOG_STATS = {
    color: '#4a2c2a',
    size: 38,
    hp: 40,
    speed: 4,
    damage: 8,
    attackCooldown: 800,
    tamingTime: 3000,
};

export const NPC_NAMES = ['Bob', 'Joe', 'Steve', 'Alex', 'Mike', 'Leo', 'Max'];

export const RESOURCE_DATA: { [key in ResourceType | string]: { color: string; requiredTier: ToolTier; baseCollectTime: number } } = {
    [ResourceType.WOOD]: { color: '#8B4513', requiredTier: ToolTier.HAND, baseCollectTime: 2000 },
    [ResourceType.RUBY_WOOD]: { color: '#5D2E5D', requiredTier: ToolTier.IRON, baseCollectTime: 4000 }, // Dark purple wood
    [ResourceType.STONE]: { color: '#696969', requiredTier: ToolTier.WOOD, baseCollectTime: 3000 },
    [ResourceType.COAL]: { color: '#1a1a1a', requiredTier: ToolTier.STONE, baseCollectTime: 3500 }, 
    [ResourceType.COPPER]: { color: '#ffa703', requiredTier: ToolTier.STONE, baseCollectTime: 3500 }, 
    [ResourceType.IRON]: { color: '#C0C0C0', requiredTier: ToolTier.COPPER, baseCollectTime: 4000 }, 
    [ResourceType.GOLD]: { color: '#fcd404', requiredTier: ToolTier.IRON, baseCollectTime: 5000 }, 
    [ResourceType.DIAMOND]: { color: '#81D4FA', requiredTier: ToolTier.GOLD, baseCollectTime: 8000 }, 
    [ResourceType.SILVINITA]: { color: '#FFFFFF', requiredTier: ToolTier.DIAMOND, baseCollectTime: 10000 }, 
    [ResourceType.ASTRILITA]: { color: '#00008B', requiredTier: ToolTier.SILVINITA, baseCollectTime: 15000 },
    [ResourceType.RUBY]: { color: '#DC143C', requiredTier: ToolTier.ASTRILITA, baseCollectTime: 12000 }, // Needs Astrilita now
    [ResourceType.RUBY_CRYSTAL]: { color: '#FF69B4', requiredTier: ToolTier.DIAMOND, baseCollectTime: 10000 },
    [ResourceType.CLAY]: { color: '#C19A6B', requiredTier: ToolTier.HAND, baseCollectTime: 2000 },
    [ResourceType.CACTUS]: { color: '#2E8B57', requiredTier: ToolTier.HAND, baseCollectTime: 1500 },
    [ResourceType.BUSH]: { color: '#228B22', requiredTier: ToolTier.HAND, baseCollectTime: 1000 },
    [ResourceType.SWAMP_BUSH]: { color: '#556B2F', requiredTier: ToolTier.HAND, baseCollectTime: 1000 },
    [ResourceType.AUTUMN_BUSH]: { color: '#D2691E', requiredTier: ToolTier.HAND, baseCollectTime: 1000 },
};

export const BIOME_DATA: { [key in Biome]: { color: string; resourceMultipliers: { [key in ResourceType]?: number }; generationDensity?: number } } = {
    // Overworld
    [Biome.PLAINS]: { 
        color: '#8BC34A', 
        resourceMultipliers: { [ResourceType.WOOD]: 0.1, [ResourceType.BUSH]: 0.4 }, 
        generationDensity: 0.1 
    },
    [Biome.FOREST]: { 
        color: '#388E3C', 
        resourceMultipliers: { [ResourceType.WOOD]: 0.5, [ResourceType.BUSH]: 0.8 },
        generationDensity: 0.25 
    },
    [Biome.DESERT]: { 
        color: '#FFF59D', 
        resourceMultipliers: { [ResourceType.CACTUS]: 0.5, [ResourceType.CLAY]: 0.5 },
        generationDensity: 0.1 
    },
    [Biome.SNOW]: { 
        color: '#E0E0E0', 
        resourceMultipliers: { [ResourceType.WOOD]: 0.1, [ResourceType.BUSH]: 0.3 },
        generationDensity: 0.15
    },
    [Biome.LAVA]: { 
        color: '#FF7043', 
        resourceMultipliers: { [ResourceType.STONE]: 3.0 },
        generationDensity: 0.8 
    },
    [Biome.WATER]: { 
        color: '#4FC3F7', 
        resourceMultipliers: { [ResourceType.CLAY]: 1.0 },
        generationDensity: 0.05
    },
    // New Biomes
    [Biome.SWAMP]: { 
        color: '#2F4F4F', // Murky Green
        resourceMultipliers: { [ResourceType.WOOD]: 0.4, [ResourceType.SWAMP_BUSH]: 0.6 },
        generationDensity: 0.3
    },
    [Biome.AUTUMN_FOREST]: { 
        color: '#D2691E', // Orange/Brown
        resourceMultipliers: { [ResourceType.WOOD]: 0.5, [ResourceType.AUTUMN_BUSH]: 0.7 },
        generationDensity: 0.25
    },
    [Biome.SAVANNAH]: { 
        color: '#BDB76B', // Dark Khaki
        resourceMultipliers: { [ResourceType.WOOD]: 0.2 }, // Dead trees (just wood visual)
        generationDensity: 0.1
    },
    [Biome.BEACH]: { 
        color: '#F4A460', // Sandy Brown
        resourceMultipliers: { [ResourceType.CLAY]: 0.5, [ResourceType.CACTUS]: 0.1 },
        generationDensity: 0.05
    },
    [Biome.OCEAN]: { 
        color: '#000080', // Navy Blue
        resourceMultipliers: {}, // Deadly
        generationDensity: 0
    },
    
    // Dimensions - Ruby
    [Biome.RUBY]: { 
        color: '#6A0DAD', 
        resourceMultipliers: { [ResourceType.STONE]: 0.5, [ResourceType.DIAMOND]: 1.0, [ResourceType.RUBY]: 3.0, [ResourceType.RUBY_WOOD]: 0.3 }, 
        generationDensity: 0.5 
    },
    [Biome.RUBY_DARK]: { 
        color: '#300a30', // Very Dark Purple
        resourceMultipliers: { [ResourceType.RUBY_WOOD]: 1.0, [ResourceType.STONE]: 0.2 },
        generationDensity: 0.6
    },
    [Biome.RUBY_LIGHT]: { 
        color: '#b570b5', // Light Purple/Pink
        resourceMultipliers: { [ResourceType.RUBY_CRYSTAL]: 2.0, [ResourceType.RUBY]: 0.5 },
        generationDensity: 0.4
    },

    // Dimensions - Cavern
    [Biome.CAVERN]: { color: '#222222', resourceMultipliers: { 
        [ResourceType.STONE]: 3.0, 
        [ResourceType.COAL]: 4.0, 
        [ResourceType.COPPER]: 4.0, 
        [ResourceType.IRON]: 3.5, 
        [ResourceType.GOLD]: 2.5, 
        [ResourceType.DIAMOND]: 2.0, 
        [ResourceType.SILVINITA]: 1.8, 
        [ResourceType.ASTRILITA]: 1.0 
    }, generationDensity: 0.8 }, 
};

export const BLOCK_HP: { [key: string]: number } = {
    'wood': 20,
    'ruby_wood': 30,
    'stone': 40,
    'iron': 60,
    'gold': 80,
    'diamond': 90,
    'silvinita': 95,
    'astrilita': 150,
    'copper': 50,
    'mysterious_statue': 100,
    'minion_statue': 1000
};

export const ITEMS: { [id: string]: Item | Tool | Armor | Consumable } = {
    // Basic Resources
    'wood': { id: 'wood', name: 'Wood', name_pt: 'Madeira', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'ruby_wood': { id: 'ruby_wood', name: 'Ruby Wood', name_pt: 'Madeira de Rubi', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'wood_planks': { id: 'wood_planks', name: 'Refined Wood', name_pt: 'Madeira Refinada', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'stone': { id: 'stone', name: 'Stone', name_pt: 'Pedra', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'sand': { id: 'sand', name: 'Sand', name_pt: 'Areia', type: 'resource', quantity: 1, stackable: true, maxStack: 64, smeltResult: 'glass' },
    'clay': { id: 'clay', name: 'Clay', name_pt: 'Argila', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'cactus': { id: 'cactus', name: 'Cactus', name_pt: 'Cacto', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'leather': { id: 'leather', name: 'Leather', name_pt: 'Couro', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'resin': { id: 'resin', name: 'Resin', name_pt: 'Resina', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'special_resin': { id: 'special_resin', name: 'Special Resin', name_pt: 'Resina Especial', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'flax': { id: 'flax', name: 'Flax', name_pt: 'Linho', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'green_dye': { id: 'green_dye', name: 'Green Dye', name_pt: 'Corante Verde', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'red_dye': { id: 'red_dye', name: 'Red Dye', name_pt: 'Corante Vermelho', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'blue_dye': { id: 'blue_dye', name: 'Blue Dye', name_pt: 'Corante Azul', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'stick': { id: 'stick', name: 'Stick', name_pt: 'Graveto', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    
    // Components
    'copper_cable': { id: 'copper_cable', name: 'Copper Cable', name_pt: 'Cabo de Cobre', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'board_basic': { id: 'board_basic', name: 'Basic Board', name_pt: 'Placa Básica', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'board_mid': { id: 'board_mid', name: 'Intermediate Board', name_pt: 'Placa Intermediária', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'board_advanced': { id: 'board_advanced', name: 'Advanced Board', name_pt: 'Placa Avançada', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'circuit_basic': { id: 'circuit_basic', name: 'Basic Circuit', name_pt: 'Circuito Básico', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'circuit_mid': { id: 'circuit_mid', name: 'Intermediate Circuit', name_pt: 'Circuito Intermediário', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'circuit_adv': { id: 'circuit_adv', name: 'Advanced Circuit', name_pt: 'Circuito Avançado', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'processor_basic': { id: 'processor_basic', name: 'Basic Processor', name_pt: 'Processador Básico', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'processor_mid': { id: 'processor_mid', name: 'Intermediate Processor', name_pt: 'Processador Intermediário', type: 'component', quantity: 1, stackable: true, maxStack: 64 },
    'processor_adv': { id: 'processor_adv', name: 'Advanced Processor', name_pt: 'Processador Avançado', type: 'component', quantity: 1, stackable: true, maxStack: 64 },

    // Ores & Minerals
    'coal': { id: 'coal', name: 'Coal', name_pt: 'Carvão', type: 'fuel', fuelTime: 80000, quantity: 1, stackable: true, maxStack: 64 },
    'copper': { id: 'copper', name: 'Copper Ore', name_pt: 'Minério de Cobre', type: 'smeltable', smeltResult: 'copper_ingot', quantity: 1, stackable: true, maxStack: 64 },
    'iron_ore': { id: 'iron_ore', name: 'Iron Ore', name_pt: 'Minério de Ferro', type: 'smeltable', smeltResult: 'iron_ingot', quantity: 1, stackable: true, maxStack: 64 },
    'gold_ore': { id: 'gold_ore', name: 'Gold Ore', name_pt: 'Minério de Ouro', type: 'smeltable', smeltResult: 'gold_ingot', quantity: 1, stackable: true, maxStack: 64 },
    'diamond': { id: 'diamond', name: 'Diamond', name_pt: 'Diamante', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'ruby': { id: 'ruby', name: 'Ruby', name_pt: 'Rubi', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'ruby_crystal': { id: 'ruby_crystal', name: 'Ruby Crystal', name_pt: 'Cristal de Rubi', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'silvinita_ore': { id: 'silvinita_ore', name: 'Silvinita Ore', name_pt: 'Minério de Silvinita', type: 'smeltable', smeltResult: 'silvinita_ingot', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_ore': { id: 'astrilita_ore', name: 'Astrilita Ore', name_pt: 'Minério de Astrilita', type: 'smeltable', smeltResult: 'astrilita_ingot', quantity: 1, stackable: true, maxStack: 64 },

    // Ingots / Processed
    'glass': { id: 'glass', name: 'Glass', name_pt: 'Vidro', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'copper_ingot': { id: 'copper_ingot', name: 'Copper Ingot', name_pt: 'Barra de Cobre', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'iron_ingot': { id: 'iron_ingot', name: 'Iron Ingot', name_pt: 'Barra de Ferro', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'gold_ingot': { id: 'gold_ingot', name: 'Gold Ingot', name_pt: 'Barra de Ouro', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'silvinita_ingot': { id: 'silvinita_ingot', name: 'Silvinita Ingot', name_pt: 'Barra de Silvinita', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_ingot': { id: 'astrilita_ingot', name: 'Astrilita Ingot', name_pt: 'Barra de Astrilita', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },

    // Tools - Wood, Stone
    'wood_pickaxe': { id: 'wood_pickaxe', name: 'Wood Pickaxe', name_pt: 'Picareta de Madeira', type: 'tool', toolType: 'pickaxe', tier: ToolTier.WOOD, quantity: 1, stackable: false, maxStack: 1, durability: 60, maxDurability: 60, collectSpeed: 1.5 },
    'stone_pickaxe': { id: 'stone_pickaxe', name: 'Stone Pickaxe', name_pt: 'Picareta de Pedra', type: 'tool', toolType: 'pickaxe', tier: ToolTier.STONE, quantity: 1, stackable: false, maxStack: 1, durability: 130, maxDurability: 130, collectSpeed: 2 },
    'wood_axe': { id: 'wood_axe', name: 'Wood Axe', name_pt: 'Machado de Madeira', type: 'tool', toolType: 'axe', tier: ToolTier.WOOD, quantity: 1, stackable: false, maxStack: 1, durability: 60, maxDurability: 60, collectSpeed: 1.5 },
    'stone_axe': { id: 'stone_axe', name: 'Stone Axe', name_pt: 'Machado de Pedra', type: 'tool', toolType: 'axe', tier: ToolTier.STONE, quantity: 1, stackable: false, maxStack: 1, durability: 130, maxDurability: 130, collectSpeed: 2 },
    'wood_sword': { id: 'wood_sword', name: 'Wood Sword', name_pt: 'Espada de Madeira', type: 'weapon', toolType: 'sword', tier: ToolTier.WOOD, quantity: 1, stackable: false, maxStack: 1, durability: 60, maxDurability: 60, damage: 4 },
    'stone_sword': { id: 'stone_sword', name: 'Stone Sword', name_pt: 'Espada de Pedra', type: 'weapon', toolType: 'sword', tier: ToolTier.STONE, quantity: 1, stackable: false, maxStack: 1, durability: 130, maxDurability: 130, damage: 5 },

    // Tools - Copper (New)
    'copper_pickaxe': { id: 'copper_pickaxe', name: 'Copper Pickaxe', name_pt: 'Picareta de Cobre', type: 'tool', toolType: 'pickaxe', tier: ToolTier.COPPER, quantity: 1, stackable: false, maxStack: 1, durability: 180, maxDurability: 180, collectSpeed: 2.5 },
    'copper_axe': { id: 'copper_axe', name: 'Copper Axe', name_pt: 'Machado de Cobre', type: 'tool', toolType: 'axe', tier: ToolTier.COPPER, quantity: 1, stackable: false, maxStack: 1, durability: 180, maxDurability: 180, collectSpeed: 2.5 },
    'copper_sword': { id: 'copper_sword', name: 'Copper Sword', name_pt: 'Espada de Cobre', type: 'weapon', toolType: 'sword', tier: ToolTier.COPPER, quantity: 1, stackable: false, maxStack: 1, durability: 180, maxDurability: 180, damage: 5.5 },

    // Tools - Iron, Gold, Diamond
    'iron_pickaxe': { id: 'iron_pickaxe', name: 'Iron Pickaxe', name_pt: 'Picareta de Ferro', type: 'tool', toolType: 'pickaxe', tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 250, maxDurability: 250, collectSpeed: 3 },
    'gold_pickaxe': { id: 'gold_pickaxe', name: 'Gold Pickaxe', name_pt: 'Picareta de Ouro', type: 'tool', toolType: 'pickaxe', tier: ToolTier.GOLD, quantity: 1, stackable: false, maxStack: 1, durability: 32, maxDurability: 32, collectSpeed: 5 },
    'diamond_pickaxe': { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', name_pt: 'Picareta de Diamante', type: 'tool', toolType: 'pickaxe', tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 1560, maxDurability: 1560, collectSpeed: 4 },
    'iron_axe': { id: 'iron_axe', name: 'Iron Axe', name_pt: 'Machado de Ferro', type: 'tool', toolType: 'axe', tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 250, maxDurability: 250, collectSpeed: 3 },
    'gold_axe': { id: 'gold_axe', name: 'Gold Axe', name_pt: 'Machado de Ouro', type: 'tool', toolType: 'axe', tier: ToolTier.GOLD, quantity: 1, stackable: false, maxStack: 1, durability: 32, maxDurability: 32, collectSpeed: 5 },
    'diamond_axe': { id: 'diamond_axe', name: 'Diamond Axe', name_pt: 'Machado de Diamante', type: 'tool', toolType: 'axe', tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 1560, maxDurability: 1560, collectSpeed: 4 },
    'iron_sword': { id: 'iron_sword', name: 'Iron Sword', name_pt: 'Espada de Ferro', type: 'weapon', toolType: 'sword', tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 250, maxDurability: 250, damage: 6 },
    'gold_sword': { id: 'gold_sword', name: 'Gold Sword', name_pt: 'Espada de Ouro', type: 'weapon', toolType: 'sword', tier: ToolTier.GOLD, quantity: 1, stackable: false, maxStack: 1, durability: 32, maxDurability: 32, damage: 5 },
    'diamond_sword': { id: 'diamond_sword', name: 'Diamond Sword', name_pt: 'Espada de Diamante', type: 'weapon', toolType: 'sword', tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 1560, maxDurability: 1560, damage: 8 },

    // Tools - Silvinita, Astrilita, Ruby (New)
    'silvinita_pickaxe': { id: 'silvinita_pickaxe', name: 'Silvinita Pickaxe', name_pt: 'Picareta de Silvinita', type: 'tool', toolType: 'pickaxe', tier: ToolTier.SILVINITA, quantity: 1, stackable: false, maxStack: 1, durability: 2000, maxDurability: 2000, collectSpeed: 5 },
    'silvinita_axe': { id: 'silvinita_axe', name: 'Silvinita Axe', name_pt: 'Machado de Silvinita', type: 'tool', toolType: 'axe', tier: ToolTier.SILVINITA, quantity: 1, stackable: false, maxStack: 1, durability: 2000, maxDurability: 2000, collectSpeed: 5 },
    'silvinita_sword': { id: 'silvinita_sword', name: 'Silvinita Sword', name_pt: 'Espada de Silvinita', type: 'weapon', toolType: 'sword', tier: ToolTier.SILVINITA, quantity: 1, stackable: false, maxStack: 1, durability: 2000, maxDurability: 2000, damage: 10 },

    'astrilita_pickaxe': { id: 'astrilita_pickaxe', name: 'Astrilita Pickaxe', name_pt: 'Picareta de Astrilita', type: 'tool', toolType: 'pickaxe', tier: ToolTier.ASTRILITA, quantity: 1, stackable: false, maxStack: 1, durability: 3000, maxDurability: 3000, collectSpeed: 6 },
    'astrilita_axe': { id: 'astrilita_axe', name: 'Astrilita Axe', name_pt: 'Machado de Astrilita', type: 'tool', toolType: 'axe', tier: ToolTier.ASTRILITA, quantity: 1, stackable: false, maxStack: 1, durability: 3000, maxDurability: 3000, collectSpeed: 6 },
    'astrilita_sword': { id: 'astrilita_sword', name: 'Astrilita Sword', name_pt: 'Espada de Astrilita', type: 'weapon', toolType: 'sword', tier: ToolTier.ASTRILITA, quantity: 1, stackable: false, maxStack: 1, durability: 3000, maxDurability: 3000, damage: 12 },

    'ruby_pickaxe': { id: 'ruby_pickaxe', name: 'Ruby Pickaxe', name_pt: 'Picareta de Rubi', type: 'tool', toolType: 'pickaxe', tier: ToolTier.RUBY, quantity: 1, stackable: false, maxStack: 1, durability: 4000, maxDurability: 4000, collectSpeed: 8 },
    'ruby_axe': { id: 'ruby_axe', name: 'Ruby Axe', name_pt: 'Machado de Rubi', type: 'tool', toolType: 'axe', tier: ToolTier.RUBY, quantity: 1, stackable: false, maxStack: 1, durability: 4000, maxDurability: 4000, collectSpeed: 8 },
    'ruby_sword': { id: 'ruby_sword', name: 'Ruby Sword', name_pt: 'Espada de Rubi', type: 'weapon', toolType: 'sword', tier: ToolTier.RUBY, quantity: 1, stackable: false, maxStack: 1, durability: 4000, maxDurability: 4000, damage: 15 },

    // Guns
    'pistol': { id: 'pistol', name: 'Pistol', name_pt: 'Pistola', type: 'weapon', toolType: 'pistol', tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 200, maxDurability: 200, damage: 15 },
    'rifle': { id: 'rifle', name: 'Rifle', name_pt: 'Rifle', type: 'weapon', toolType: 'rifle', tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 300, maxDurability: 300, damage: 25 },
    'ak47': { id: 'ak47', name: 'AK-47', name_pt: 'AK-47', type: 'weapon', toolType: 'ak47', tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 400, maxDurability: 400, damage: 12 },
    'bazooka': { id: 'bazooka', name: 'Bazooka', name_pt: 'Bazuca', type: 'weapon', toolType: 'bazooka', tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 50, maxDurability: 50, damage: 100 },
    'bow': { id: 'bow', name: 'Bow', name_pt: 'Arco', type: 'weapon', toolType: 'bow', tier: ToolTier.WOOD, quantity: 1, stackable: false, maxStack: 1, durability: 384, maxDurability: 384, damage: 10 },

    // Ammo
    'ammo': { id: 'ammo', name: 'Ammo', name_pt: 'Munição', type: 'ammo', quantity: 1, stackable: true, maxStack: 64 },
    'arrow': { id: 'arrow', name: 'Arrow', name_pt: 'Flecha', type: 'ammo', quantity: 1, stackable: true, maxStack: 64 },
    'rocket': { id: 'rocket', name: 'Rocket', name_pt: 'Foguete', type: 'ammo', quantity: 1, stackable: true, maxStack: 16 },

    // Armor
    'leather_armor': { id: 'leather_armor', name: 'Leather Armor', name_pt: 'Armadura de Couro', type: 'armor', material: 'leather', defense: 0.2, quantity: 1, stackable: false, maxStack: 1, durability: 100, maxDurability: 100 },
    'copper_armor': { id: 'copper_armor', name: 'Copper Armor', name_pt: 'Armadura de Cobre', type: 'armor', material: 'copper', defense: 0.3, quantity: 1, stackable: false, maxStack: 1, durability: 160, maxDurability: 160 },
    'iron_armor': { id: 'iron_armor', name: 'Iron Armor', name_pt: 'Armadura de Ferro', type: 'armor', material: 'iron', defense: 0.4, quantity: 1, stackable: false, maxStack: 1, durability: 240, maxDurability: 240 },
    'gold_armor': { id: 'gold_armor', name: 'Gold Armor', name_pt: 'Armadura de Ouro', type: 'armor', material: 'gold', defense: 0.5, quantity: 1, stackable: false, maxStack: 1, durability: 112, maxDurability: 112 },
    'diamond_armor': { id: 'diamond_armor', name: 'Diamond Armor', name_pt: 'Armadura de Diamante', type: 'armor', material: 'diamond', defense: 0.7, quantity: 1, stackable: false, maxStack: 1, durability: 528, maxDurability: 528 },
    'silvinita_armor': { id: 'silvinita_armor', name: 'Silvinita Armor', name_pt: 'Armadura de Silvinita', type: 'armor', material: 'silvinita', defense: 0.75, quantity: 1, stackable: false, maxStack: 1, durability: 800, maxDurability: 800 },
    'astrilita_armor': { id: 'astrilita_armor', name: 'Astrilita Armor', name_pt: 'Armadura de Astrilita', type: 'armor', material: 'astrilita', defense: 0.85, quantity: 1, stackable: false, maxStack: 1, durability: 1200, maxDurability: 1200 },
    'ruby_armor': { id: 'ruby_armor', name: 'Ruby Armor', name_pt: 'Armadura de Rubi', type: 'armor', material: 'ruby', defense: 0.9, quantity: 1, stackable: false, maxStack: 1, durability: 1500, maxDurability: 1500 },
    
    'shield': { id: 'shield', name: 'Shield', name_pt: 'Escudo', type: 'shield', quantity: 1, stackable: false, maxStack: 1, durability: 336, maxDurability: 336 },

    // Consumables
    'food': { id: 'food', name: 'Raw Meat', name_pt: 'Carne Crua', type: 'consumable', heals: 5, stamina: 10, quantity: 1, stackable: true, maxStack: 64 },
    'cooked_meat': { id: 'cooked_meat', name: 'Cooked Meat', name_pt: 'Carne Cozida', type: 'consumable', heals: 15, stamina: 30, quantity: 1, stackable: true, maxStack: 64 },
    'cherry': { id: 'cherry', name: 'Cherry', name_pt: 'Cereja', type: 'consumable', heals: 2, stamina: 5, quantity: 1, stackable: true, maxStack: 64 },
    'dirty_berry': { id: 'dirty_berry', name: 'Dirty Berry', name_pt: 'Fruta Suja', type: 'consumable', heals: -10, stamina: 0, quantity: 1, stackable: true, maxStack: 64 },
    'orange_berry': { id: 'orange_berry', name: 'Orange Berry', name_pt: 'Fruta Laranja', type: 'consumable', heals: 5, stamina: 10, quantity: 1, stackable: true, maxStack: 64 },
    'fish': { id: 'fish', name: 'Fish', name_pt: 'Peixe', type: 'consumable', heals: 5, stamina: 10, quantity: 1, stackable: true, maxStack: 64 },
    'wool': { id: 'wool', name: 'Wool', name_pt: 'Lã', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'vigor_potion': { id: 'vigor_potion', name: 'Vigor Potion', name_pt: 'Poção de Vigor', type: 'consumable', heals: 0, stamina: 100, quantity: 1, stackable: true, maxStack: 16 },

    // Blocks & Furniture
    'workbench': { id: 'workbench', name: 'Workbench', name_pt: 'Bancada', type: 'workbench', quantity: 1, stackable: true, maxStack: 64 },
    'chest': { id: 'chest', name: 'Chest', name_pt: 'Baú', type: 'chest', quantity: 1, stackable: true, maxStack: 64 },
    'furnace': { id: 'furnace', name: 'Furnace', name_pt: 'Fornalha', type: 'furnace', quantity: 1, stackable: true, maxStack: 64 },
    'enchanting_table': { id: 'enchanting_table', name: 'Enchanting Table', name_pt: 'Mesa de Encantamento', type: 'enchanting_table', quantity: 1, stackable: true, maxStack: 64 },
    'bed': { id: 'bed', name: 'Bed', name_pt: 'Cama', type: 'bed', quantity: 1, stackable: true, maxStack: 1 },
    'tnt': { id: 'tnt', name: 'TNT', name_pt: 'Dinamite', type: 'tnt', quantity: 1, stackable: true, maxStack: 64 },
    'wood_block': { id: 'wood_block', name: 'Wood Block', name_pt: 'Bloco de Madeira', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'stone_block': { id: 'stone_block', name: 'Stone Block', name_pt: 'Bloco de Pedra', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'wood_door': { id: 'wood_door', name: 'Wood Door', name_pt: 'Porta de Madeira', type: 'door', quantity: 1, stackable: true, maxStack: 64 },
    'auto_door': { id: 'auto_door', name: 'Automatic Door', name_pt: 'Porta Automática', type: 'door', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_block': { id: 'astrilita_block', name: 'Astrilita Block', name_pt: 'Bloco de Astrilita', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'ruby_block': { id: 'ruby_block', name: 'Ruby Block', name_pt: 'Bloco de Rubi', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'mysterious_statue': { id: 'mysterious_statue', name: 'Mysterious Statue', name_pt: 'Estátua Misteriosa', type: 'block', quantity: 1, stackable: false, maxStack: 1 },
    'minion_statue': { id: 'minion_statue', name: 'Minion Statue', name_pt: 'Estátua de Servo', type: 'block', quantity: 1, stackable: false, maxStack: 1 },
    
    // Furniture - Astrilita
    'astrilita_safe': { id: 'astrilita_safe', name: 'Astrilita Safe', name_pt: 'Cofre de Astrilita', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_lamp': { id: 'astrilita_lamp', name: 'Astrilita Lamp', name_pt: 'Lâmpada de Astrilita', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'energized_shelf': { id: 'energized_shelf', name: 'Energized Shelf', name_pt: 'Estante Energizada', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_tech_table': { id: 'astrilita_tech_table', name: 'Tech Table', name_pt: 'Mesa Tecnológica', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_panel': { id: 'astrilita_panel', name: 'Astrilita Panel', name_pt: 'Painel Decorativo', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'astrilita_chair': { id: 'astrilita_chair', name: 'Astrilita Chair', name_pt: 'Cadeira de Astrilita', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },

    // Furniture - Copper/Wood/Stone
    'copper_tv': { id: 'copper_tv', name: 'Copper TV', name_pt: 'Televisão de Cobre', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'router_basic': { id: 'router_basic', name: 'Basic Router', name_pt: 'Roteador Simples', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'radio_basic': { id: 'radio_basic', name: 'Basic Radio', name_pt: 'Rádio Básico', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'wood_table': { id: 'wood_table', name: 'Wood Table', name_pt: 'Mesa de Madeira', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'simple_bed': { id: 'simple_bed', name: 'Simple Bed', name_pt: 'Cama Simples', type: 'bed', quantity: 1, stackable: true, maxStack: 1 },
    'wood_closet': { id: 'wood_closet', name: 'Wood Closet', name_pt: 'Armário de Madeira', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'wood_shelf': { id: 'wood_shelf', name: 'Wood Shelf', name_pt: 'Estante Simples', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'stone_furnace': { id: 'stone_furnace', name: 'Stone Furnace', name_pt: 'Forno de Pedra', type: 'furnace', quantity: 1, stackable: true, maxStack: 64 },
    'modern_stove': { id: 'modern_stove', name: 'Modern Stove', name_pt: 'Fogão Moderno', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'electric_fridge': { id: 'electric_fridge', name: 'Electric Fridge', name_pt: 'Geladeira Elétrica', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'copper_fan': { id: 'copper_fan', name: 'Copper Fan', name_pt: 'Ventilador de Cobre', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'wood_lamp': { id: 'wood_lamp', name: 'Wood Lamp', name_pt: 'Abajur de Madeira', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'basic_pc': { id: 'basic_pc', name: 'Basic PC', name_pt: 'PC Básico', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },

    // Electronics
    'tv_panel': { id: 'tv_panel', name: 'TV Panel', name_pt: 'Painel de TV', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'digital_button': { id: 'digital_button', name: 'Digital Button', name_pt: 'Botão Digital', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'motion_sensor': { id: 'motion_sensor', name: 'Motion Sensor', name_pt: 'Sensor de Movimento', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'alarm_siren': { id: 'alarm_siren', name: 'Alarm Siren', name_pt: 'Sirene de Alarme', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'solar_panel_small': { id: 'solar_panel_small', name: 'Small Solar Panel', name_pt: 'Painel Solar Pequeno', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'comm_antenna': { id: 'comm_antenna', name: 'Comm Antenna', name_pt: 'Antena de Comunicação', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'mini_generator': { id: 'mini_generator', name: 'Mini Generator', name_pt: 'Mini Gerador', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'access_terminal': { id: 'access_terminal', name: 'Access Terminal', name_pt: 'Terminal de Acesso', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'radio_communicator': { id: 'radio_communicator', name: 'Radio Communicator', name_pt: 'Rádio Comunicador', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'secret_door_panel': { id: 'secret_door_panel', name: 'Secret Door Panel', name_pt: 'Painel de Porta Secreta', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'digital_display': { id: 'digital_display', name: 'Digital Display', name_pt: 'Display Digital', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'auto_light': { id: 'auto_light', name: 'Auto Light', name_pt: 'Luz Automática', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'electronic_safe': { id: 'electronic_safe', name: 'Electronic Safe', name_pt: 'Cofre Eletrônico', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'password_panel': { id: 'password_panel', name: 'Password Panel', name_pt: 'Painel de Senha', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'small_electric_motor': { id: 'small_electric_motor', name: 'Small Electric Motor', name_pt: 'Motor Elétrico Pequeno', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'advanced_fabricator': { id: 'advanced_fabricator', name: 'Advanced Fabricator', name_pt: 'Máquina de Fabricação Avançada', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'digital_telescope': { id: 'digital_telescope', name: 'Digital Telescope', name_pt: 'Telescópio Digital', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'home_energy_panel': { id: 'home_energy_panel', name: 'Home Energy Panel', name_pt: 'Painel de Energia Residencial', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },
    'door_security_lock': { id: 'door_security_lock', name: 'Door Security Lock', name_pt: 'Trava de Segurança de Porta', type: 'furniture', quantity: 1, stackable: true, maxStack: 64 },

    
    // Misc
    'money': { id: 'money', name: 'Coins', name_pt: 'Moedas', type: 'currency', quantity: 1, stackable: true, maxStack: 9999 },
    'car': { id: 'car', name: 'Car', name_pt: 'Carro', type: 'vehicle', quantity: 1, stackable: false, maxStack: 1 },
    'torch': { id: 'torch', name: 'Torch', name_pt: 'Tocha', type: 'light_source', quantity: 1, stackable: true, maxStack: 64 },
    'totem_ruby': { id: 'totem_ruby', name: 'Ruby Totem', name_pt: 'Totem de Rubi', type: 'totem', quantity: 1, stackable: false, maxStack: 1 },
};

export const CRAFTING_RECIPES: { [itemId: string]: { [resourceId: string]: number } } = {
    'wood_planks': { 'wood': 1 },
    'stick': { 'wood': 1 },
    'workbench': { 'wood': 10 },
    'chest': { 'wood': 8 },
    'furnace': { 'stone': 8 },
    
    // Tools & Weapons
    'wood_pickaxe': { 'wood': 5 },
    'wood_axe': { 'wood': 5 },
    'wood_sword': { 'wood': 3 },
    
    'stone_pickaxe': { 'wood': 2, 'stone': 3 },
    'stone_axe': { 'wood': 2, 'stone': 3 },
    'stone_sword': { 'wood': 1, 'stone': 2 },
    
    'copper_pickaxe': { 'wood': 2, 'copper_ingot': 3 },
    'copper_axe': { 'wood': 2, 'copper_ingot': 3 },
    'copper_sword': { 'wood': 1, 'copper_ingot': 2 },

    'iron_pickaxe': { 'wood': 2, 'iron_ingot': 3 },
    'iron_axe': { 'wood': 2, 'iron_ingot': 3 },
    'iron_sword': { 'wood': 1, 'iron_ingot': 2 },
    
    'gold_pickaxe': { 'wood': 2, 'gold_ingot': 3 },
    'gold_axe': { 'wood': 2, 'gold_ingot': 3 },
    'gold_sword': { 'wood': 1, 'gold_ingot': 2 },
    
    'diamond_pickaxe': { 'wood': 2, 'diamond': 3 },
    'diamond_axe': { 'wood': 2, 'diamond': 3 },
    'diamond_sword': { 'wood': 1, 'diamond': 2 },

    'silvinita_pickaxe': { 'wood': 2, 'silvinita_ingot': 3 },
    'silvinita_axe': { 'wood': 2, 'silvinita_ingot': 3 },
    'silvinita_sword': { 'wood': 1, 'silvinita_ingot': 2 },

    'astrilita_pickaxe': { 'wood': 2, 'astrilita_ingot': 3 },
    'astrilita_axe': { 'wood': 2, 'astrilita_ingot': 3 },
    'astrilita_sword': { 'wood': 1, 'astrilita_ingot': 2 },

    'ruby_pickaxe': { 'wood': 2, 'ruby': 3 },
    'ruby_axe': { 'wood': 2, 'ruby': 3 },
    'ruby_sword': { 'wood': 1, 'ruby': 2 },
    
    'pistol': { 'iron_ingot': 5, 'wood': 2 },
    'rifle': { 'iron_ingot': 8, 'wood': 4 },
    'ak47': { 'iron_ingot': 10, 'wood': 5 }, 
    'bazooka': { 'diamond': 5, 'iron_ingot': 10 }, 
    'bow': { 'wood': 3, 'flax': 3 },
    
    // Ammo
    'ammo': { 'iron_ingot': 1, 'wood': 1 }, 
    'arrow': { 'wood': 1, 'stone': 1 },
    'rocket': { 'iron_ingot': 2, 'tnt': 1 },
    
    // Armor
    'leather_armor': { 'leather': 10 },
    'copper_armor': { 'copper_ingot': 15 },
    'iron_armor': { 'iron_ingot': 15 },
    'gold_armor': { 'gold_ingot': 15 },
    'diamond_armor': { 'diamond': 20 },
    'silvinita_armor': { 'silvinita_ingot': 20 },
    'astrilita_armor': { 'astrilita_ingot': 25 },
    'ruby_armor': { 'ruby': 25 },

    'shield': { 'wood': 6, 'iron_ingot': 1 },
    
    'torch': { 'wood': 1, 'coal': 1 },
    'wood_door': { 'wood': 6 },
    'bed': { 'wood': 3, 'wool': 3 },
    'tnt': { 'sand': 4, 'coal': 5 },
    'wood_block': { 'wood': 2 },
    'stone_block': { 'stone': 2 },
    'astrilita_block': { 'astrilita_ingot': 4 },
    'ruby_block': { 'ruby_wood': 2 },
    'car': { 'iron_ingot': 20, 'coal': 10 },

    // New Components Recipes
    'copper_cable': { 'copper_ingot': 1 },
    'board_basic': { 'wood': 1, 'copper_ingot': 1 },
    'board_mid': { 'board_basic': 1, 'iron_ingot': 1 },
    'board_advanced': { 'board_mid': 1, 'gold_ingot': 1 },
    'circuit_basic': { 'copper_cable': 1, 'stone': 1 },
    'circuit_mid': { 'circuit_basic': 1, 'iron_ingot': 1 },
    'circuit_adv': { 'circuit_mid': 1, 'gold_ingot': 1 },
    'processor_basic': { 'circuit_basic': 1, 'board_basic': 1 },
    'processor_mid': { 'circuit_mid': 1, 'board_mid': 1 },
    'processor_adv': { 'circuit_adv': 1, 'board_advanced': 1, 'diamond': 1 },
    'resin': { 'wood': 2 },
    'special_resin': { 'resin': 2 },
    'flax': { 'wood': 1 }, // Simplified
    'green_dye': { 'cactus': 1 },
    'red_dye': { 'cherry': 2 },
    'blue_dye': { 'cherry': 1, 'coal': 1 },

    // Astrilita Furniture
    'astrilita_safe': { 'astrilita_ingot': 4, 'board_advanced': 2, 'copper_cable': 1, 'processor_adv': 1 },
    'astrilita_lamp': { 'astrilita_ingot': 2, 'circuit_basic': 1, 'copper_cable': 1 },
    'energized_shelf': { 'astrilita_ingot': 2, 'wood': 3, 'circuit_mid': 1, 'copper_cable': 1 },
    'astrilita_tech_table': { 'astrilita_ingot': 3, 'stone': 2, 'processor_mid': 1, 'copper_cable': 2 },
    'astrilita_panel': { 'astrilita_ingot': 1, 'wood': 2, 'copper_cable': 1 },
    'astrilita_chair': { 'astrilita_ingot': 2, 'wood': 3, 'circuit_basic': 1 },

    // Other Furniture
    'copper_tv': { 'copper_ingot': 3, 'board_mid': 1, 'processor_mid': 1, 'circuit_basic': 1, 'copper_cable': 1 },
    'router_basic': { 'copper_ingot': 2, 'board_basic': 1, 'circuit_basic': 1, 'copper_cable': 1 },
    'radio_basic': { 'wood': 2, 'copper_ingot': 1, 'circuit_basic': 1, 'copper_cable': 1 },
    'wood_table': { 'wood': 4 },
    'simple_bed': { 'wood': 3, 'flax': 2 },
    'wood_closet': { 'wood': 5 },
    'wood_shelf': { 'wood': 3 },
    'stone_furnace': { 'stone': 8 },
    'modern_stove': { 'stone': 3, 'copper_ingot': 2, 'circuit_basic': 1 },
    'electric_fridge': { 'stone': 4, 'copper_ingot': 2, 'processor_basic': 1, 'copper_cable': 1 },
    'copper_fan': { 'copper_ingot': 2, 'wood': 1, 'circuit_basic': 1, 'copper_cable': 1 },
    'wood_lamp': { 'wood': 2, 'circuit_basic': 1, 'copper_cable': 1 },
    'basic_pc': { 'wood': 2, 'copper_ingot': 2, 'board_mid': 1, 'processor_mid': 1, 'copper_cable': 1 },
    'auto_door': { 'wood': 4, 'board_advanced': 1, 'circuit_mid': 1, 'copper_cable': 1 },

    // Electronics
    'tv_panel': { 'board_mid': 1, 'circuit_basic': 1, 'processor_mid': 1, 'copper_cable': 1 },
    'digital_button': { 'board_advanced': 1 },
    'motion_sensor': { 'circuit_adv': 1 },
    'alarm_siren': { 'circuit_mid': 1 },
    'solar_panel_small': { 'circuit_basic': 1 },
    'comm_antenna': { 'board_mid': 1 },
    'mini_generator': { 'circuit_adv': 1 },
    'access_terminal': { 'board_advanced': 1, 'circuit_adv': 1, 'processor_adv': 1 },
    'radio_communicator': { 'circuit_mid': 1 },
    'secret_door_panel': { 'circuit_adv': 1 },
    'digital_display': { 'circuit_mid': 1 },
    'auto_light': { 'circuit_basic': 1 },
    'electronic_safe': { 'processor_adv': 1 },
    'password_panel': { 'circuit_mid': 1 },
    'small_electric_motor': { 'circuit_mid': 1 },
    'advanced_fabricator': { 'circuit_adv': 1, 'board_advanced': 1, 'processor_adv': 1 },
    'digital_telescope': { 'circuit_adv': 1 },
    'home_energy_panel': { 'circuit_mid': 1 },
    'door_security_lock': { 'board_basic': 1, 'circuit_basic': 1, 'processor_basic': 1 },
};

export const INVENTORY_CRAFTING_RECIPES = new Map<string, { result: Item, quantity: number }>();
// Helper to key map
const key = (ids: string[]) => JSON.stringify(ids.sort());
INVENTORY_CRAFTING_RECIPES.set(key(['wood']), { result: ITEMS['wood_planks'], quantity: 4 });
INVENTORY_CRAFTING_RECIPES.set(key(['wood', 'coal']), { result: ITEMS['torch'], quantity: 4 });
INVENTORY_CRAFTING_RECIPES.set(key(['wood_planks', 'wood_planks', 'wood_planks', 'wood_planks']), { result: ITEMS['workbench'], quantity: 1 });
INVENTORY_CRAFTING_RECIPES.set(key(['ruby_crystal', 'ruby_crystal', 'ruby_crystal', 'ruby_crystal']), { result: ITEMS['enchanting_table'], quantity: 1 });

export const QUEST_LIST: Quest[] = [
    { id: 'q1', type: 'collect', itemId: 'wood', requiredAmount: 10, rewardMin: 10, rewardMax: 20, description_en: 'Collect 10 Wood', description_pt: 'Colete 10 Madeiras' },
    { id: 'q2', type: 'collect', itemId: 'stone', requiredAmount: 10, rewardMin: 15, rewardMax: 25, description_en: 'Collect 10 Stone', description_pt: 'Colete 10 Pedras' },
    { id: 'q3', type: 'collect', itemId: 'iron_ore', requiredAmount: 5, rewardMin: 30, rewardMax: 50, description_en: 'Collect 5 Iron Ore', description_pt: 'Colete 5 Minérios de Ferro' },
];

export const translations = {
    [Language.EN]: {
        day: 'Day',
        creative: '(Creative)',
        biome: 'Biome',
        bloodMoon: 'BLOOD MOON',
        rain: 'RAIN',
        returnToOverworld: 'Press E to Return',
        objective: 'Objective',
        gameSaved: 'Game Saved',
        hp: 'HP',
        stamina: 'Stamina',
        energy: 'Energy',
        shield: 'Shield',
        yourCoins: 'Coins',
        ammo: 'Ammo',
        shop: 'Shop',
        creativeTools: 'Creative Tools',
        itemMenu: 'Item Menu',
        flyNoclip: 'Fly/Noclip (V)',
        invisibility: 'Invisibility (H)',
        on: 'ON',
        off: 'OFF',
        worldControls: 'World Controls',
        skipDay: 'Skip Day',
        toggleDayNight: 'Toggle Day/Night',
        playerCheats: 'Player Cheats',
        heal: 'Heal',
        maxStats: 'Max Stats',
        giveMoney: 'Give Money',
        giveAmmo: 'Give Ammo',
        teleport: 'Teleport',
        center: 'Center',
        border: 'Border',
        inventory: 'Creative Inventory',
        close: 'Close',
        cavernConfirm: 'Enter Cavern?',
        cavernReturnConfirm: 'Return to Overworld?',
        yes: 'Yes',
        no: 'No',
        youDied: 'YOU DIED',
        respawn: 'Respawn',
        returnToMenu: 'Return to Menu',
        restart: 'Restart Game',
        skipNight: 'Sleep through the night?',
        claudio: 'Claudio',
        hitler: 'Claudio',
        newGame: 'New Game',
        continue: 'Continue',
        play: 'Play'
    },
    [Language.PT]: {
        day: 'Dia',
        creative: '(Criativo)',
        biome: 'Bioma',
        bloodMoon: 'LUA DE SANGUE',
        rain: 'CHUVA',
        returnToOverworld: 'Pressione E para Voltar',
        objective: 'Objetivo',
        gameSaved: 'Jogo Salvo',
        hp: 'Vida',
        stamina: 'Estamina',
        energy: 'Energia',
        shield: 'Escudo',
        yourCoins: 'Moedas',
        ammo: 'Munição',
        shop: 'Loja',
        creativeTools: 'Ferramentas Criativas',
        itemMenu: 'Menu de Itens',
        flyNoclip: 'Voar/Noclip (V)',
        invisibility: 'Invisibilidade (H)',
        on: 'LIGADO',
        off: 'DESLIGADO',
        worldControls: 'Controles do Mundo',
        skipDay: 'Pular Dia',
        toggleDayNight: 'Alternar Dia/Noite',
        playerCheats: 'Cheats do Jogador',
        heal: 'Curar',
        maxStats: 'Max Status',
        giveMoney: 'Dar Dinheiro',
        giveAmmo: 'Dar Munição',
        teleport: 'Teleporte',
        center: 'Centro',
        border: 'Borda',
        inventory: 'Inventário Criativo',
        close: 'Fechar',
        cavernConfirm: 'Entrar na Caverna?',
        cavernReturnConfirm: 'Voltar para o Mundo Superior?',
        yes: 'Sim',
        no: 'Não',
        youDied: 'VOCÊ MORREU',
        respawn: 'Renascer',
        returnToMenu: 'Voltar ao Menu',
        restart: 'Reiniciar Jogo',
        skipNight: 'Dormir durante a noite?',
        claudio: 'Claudio',
        hitler: 'Claudio',
        newGame: 'Novo Jogo',
        continue: 'Continuar',
        play: 'Jogar'
    },
};

export const ENCHANTMENT_DATA: { [key in Enchantment]: { name_en: string; name_pt: string; description_en: string; description_pt: string; maxLevel: number } } = {
    [Enchantment.EFFICIENCY]: { name_en: 'Efficiency', name_pt: 'Eficiência', description_en: 'Mines faster', description_pt: 'Minera mais rápido', maxLevel: 5 },
    [Enchantment.SHARPNESS]: { name_en: 'Sharpness', name_pt: 'Afiação', description_en: 'Deals more damage', description_pt: 'Causa mais dano', maxLevel: 5 },
    [Enchantment.PROTECTION]: { name_en: 'Protection', name_pt: 'Proteção', description_en: 'Reduces damage taken', description_pt: 'Reduz dano recebido', maxLevel: 4 },
    [Enchantment.HOMING]: { name_en: 'Homing', name_pt: 'Perseguição', description_en: 'Projectiles seek targets', description_pt: 'Projéteis seguem alvos', maxLevel: 1 },
    [Enchantment.THORNS]: { name_en: 'Thorns', name_pt: 'Espinhos', description_en: 'Attackers take damage', description_pt: 'Atacantes recebem dano', maxLevel: 3 },
    [Enchantment.MENDING]: { name_en: 'Mending', name_pt: 'Remendo', description_en: 'Repairs with XP/Time', description_pt: 'Repara com o tempo', maxLevel: 1 },
    [Enchantment.LOOTING]: { name_en: 'Looting', name_pt: 'Saque', description_en: 'Mobs drop more loot', description_pt: 'Mobs dropam mais itens', maxLevel: 3 },
    [Enchantment.UNBREAKING]: { name_en: 'Unbreaking', name_pt: 'Inquebrável', description_en: 'Increases durability', description_pt: 'Aumenta durabilidade', maxLevel: 3 },
    [Enchantment.KNOCKBACK]: { name_en: 'Knockback', name_pt: 'Repulsão', description_en: 'Knocks back enemies', description_pt: 'Empurra inimigos', maxLevel: 2 },
};

export const CREATIVE_ITEMS = Object.values(ITEMS);

export const VENDOR_ITEMS: { [itemId: string]: { price: number } } = {
    'wood': { price: 5 },
    'stone': { price: 2 },
    'iron_ingot': { price: 20 },
    'gold_ingot': { price: 50 },
    'diamond': { price: 100 },
    'ammo': { price: 10 },
    'food': { price: 5 },
    'cooked_meat': { price: 10 },
    'pistol': { price: 500 },
    'rifle': { price: 1200 },
    'ak47': { price: 2500 },
    'bazooka': { price: 10000 },
    'shield': { price: 300 },
    'totem_ruby': { price: 5000 },
    'vigor_potion': { price: 500 },
    'car': { price: 5000 },
    'copper_cable': { price: 50 },
};

export const PORTAL_REQUIREMENTS: { [key: string]: { [itemId: string]: number } } = {
    'RUBY': { 'copper_ingot': 5, 'iron_ingot': 5, 'gold_ingot': 5, 'diamond': 7 },
    'CAVERN': { 'stone': 50, 'iron_ingot': 10 }
};
