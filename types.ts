
export enum ResourceType {
  WOOD = 'WOOD',
  STONE = 'STONE',
  COAL = 'COAL',
  COPPER = 'COPPER',
  IRON = 'IRON',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
  SILVINITA = 'SILVINITA',
  ASTRILITA = 'ASTRILITA',
  RUBY = 'RUBY',
  RUBY_CRYSTAL = 'RUBY_CRYSTAL',
  CLAY = 'CLAY',
  CACTUS = 'CACTUS',
  BUSH = 'BUSH',
  SWAMP_BUSH = 'SWAMP_BUSH',
  AUTUMN_BUSH = 'AUTUMN_BUSH',
  RUBY_WOOD = 'RUBY_WOOD'
}

export enum ToolTier {
  HAND = 0,
  WOOD = 1,
  STONE = 2,
  COPPER = 3,
  IRON = 4,
  GOLD = 5,
  DIAMOND = 6,
  SILVINITA = 7,
  ASTRILITA = 8,
  RUBY = 9
}

export enum Biome {
  PLAINS = 'PLAINS',
  FOREST = 'FOREST',
  DESERT = 'DESERT',
  SNOW = 'SNOW',
  LAVA = 'LAVA',
  WATER = 'WATER',
  SWAMP = 'SWAMP',
  AUTUMN_FOREST = 'AUTUMN_FOREST',
  SAVANNAH = 'SAVANNAH',
  BEACH = 'BEACH',
  OCEAN = 'OCEAN',
  RUBY = 'RUBY',
  RUBY_DARK = 'RUBY_DARK',
  RUBY_LIGHT = 'RUBY_LIGHT',
  CAVERN = 'CAVERN'
}

export enum Language {
  EN = 'EN',
  PT = 'PT'
}

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  INVENTORY = 'INVENTORY',
  WORKBENCH = 'WORKBENCH',
  CHEST_UI = 'CHEST_UI',
  FURNACE = 'FURNACE',
  VENDOR_SHOP = 'VENDOR_SHOP',
  QUEST_UI = 'QUEST_UI',
  ENCHANTING = 'ENCHANTING',
  PORTAL_UI = 'PORTAL_UI',
  CAVERN_CONFIRM = 'CAVERN_CONFIRM',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP',
  CREATIVE_INVENTORY = 'CREATIVE_INVENTORY',
  NAMING_PET = 'NAMING_PET'
}

export enum ZombieType {
  NORMAL = 'NORMAL',
  GIANT = 'GIANT',
  IMMORTAL = 'IMMORTAL',
  BOSS = 'BOSS',
  RUBY = 'RUBY',
  DESERT = 'DESERT',
  SNOW = 'SNOW',
  FOREST = 'FOREST',
  LAVA = 'LAVA',
  SWAMP = 'SWAMP',
  MEGA_BOSS = 'MEGA_BOSS'
}

export enum AnimalType {
  PIG = 'PIG',
  COW = 'COW',
  CHICKEN = 'CHICKEN',
  SHEEP = 'SHEEP',
  SCORPION = 'SCORPION',
  POLAR_BEAR = 'POLAR_BEAR',
  PENGUIN = 'PENGUIN'
}

export enum NPCType {
  VENDOR = 'VENDOR',
  QUEST_GIVER = 'QUEST_GIVER'
}

export enum ZombieState {
  WANDERING = 'WANDERING',
  PURSUING = 'PURSUING',
  INVESTIGATING = 'INVESTIGATING'
}

export enum DogState {
  WILD = 'WILD',
  HOSTILE = 'HOSTILE',
  FOLLOWING = 'FOLLOWING',
  SITTING = 'SITTING',
  ATTACKING = 'ATTACKING'
}

export enum Enchantment {
  EFFICIENCY = 'EFFICIENCY',
  SHARPNESS = 'SHARPNESS',
  PROTECTION = 'PROTECTION',
  HOMING = 'HOMING',
  THORNS = 'THORNS',
  MENDING = 'MENDING',
  LOOTING = 'LOOTING',
  UNBREAKING = 'UNBREAKING',
  KNOCKBACK = 'KNOCKBACK'
}

export interface GameObject {
  x: number;
  y: number;
  size: number;
}

export interface ItemEnchantment {
  type: Enchantment;
  level: number;
}

export interface Item {
  id: string;
  name: string;
  name_pt: string;
  type: string;
  quantity: number;
  stackable: boolean;
  maxStack: number;
  durability?: number;
  maxDurability?: number;
  enchantments?: ItemEnchantment[];
  // Union properties to avoid strict type checks failing in generic item handling
  toolType?: string; 
  tier?: ToolTier;
  collectSpeed?: number;
  damage?: number;
  material?: string;
  defense?: number;
  heals?: number;
  stamina?: number;
  smeltResult?: string;
  fuelTime?: number;
}

export interface Tool extends Item {
  toolType: string;
  tier: ToolTier;
  collectSpeed?: number;
  damage?: number;
}

export interface Armor extends Item {
  material: 'leather' | 'copper' | 'iron' | 'gold' | 'diamond' | 'silvinita' | 'astrilita' | 'ruby';
  defense: number;
}

export interface Consumable extends Item {
  heals: number;
  stamina: number;
}

export interface InventorySlot {
  item: Item | null;
}

export interface Quest {
  id: string;
  type: 'collect';
  itemId: string;
  requiredAmount: number;
  rewardMin: number;
  rewardMax: number;
  description_en: string;
  description_pt: string;
}

export interface Player extends GameObject {
  id: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  money: number;
  ammo: number;
  inventory: InventorySlot[];
  craftingGrid: InventorySlot[];
  craftingOutput: InventorySlot;
  enchantingSlots: InventorySlot[];
  activeSlot: number;
  armor: Armor | null;
  weapon: Tool | null;
  tool: Tool | null;
  offHand: InventorySlot;
  speed: number;
  sprinting: boolean;
  lastAttackTime: number;
  lavaDamageTimer: number;
  lastDamageTime: number;
  lastEnergyDamageTime: number;
  dimension: 'OVERWORLD' | 'RUBY' | 'CAVERN';
  overworldX: number;
  overworldY: number;
  activeQuest: Quest | null;
  poisonEffect?: { endTime: number; damagePerTick: number; lastTick: number };
  discountEffect?: { endTime: number; factor: number };
  slowEffect?: { endTime: number; factor: number };
}

export interface ResourceNode extends GameObject {
  id: string;
  type: ResourceType;
  hp: number;
  maxHp: number;
  respawnTimer: number;
  biome?: Biome;
}

export interface Zombie extends GameObject {
  id: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  type: ZombieType;
  targetId: number | string | null;
  isBoss: boolean;
  attackCooldown: number;
  lastAttackTime: number;
  state: ZombieState;
  targetX: number;
  targetY: number;
  stateTimer: number;
  shieldActive?: boolean;
  isInvulnerable?: boolean;
  summonTimer?: number;
  shootTimer?: number;
}

export interface Animal extends GameObject {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  type: AnimalType;
  vx: number;
  vy: number;
  changeDirectionTimer: number;
  state: string;
  targetId?: number | string | null;
  huntCount?: number;
  ownerId?: number | null;
  inventory?: InventorySlot[];
  lastAttackTime?: number;
  name?: string | null;
}

export interface Dog extends GameObject {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  state: DogState;
  name: string | null;
  ownerId: number | null;
  vx: number;
  vy: number;
  stateTimer: number;
  targetId: number | string | null;
  lastAttackTime: number;
}

export interface NPC extends GameObject {
  id: string;
  type: NPCType;
  name: string;
}

export interface Projectile extends GameObject {
  id: string;
  vx: number;
  vy: number;
  damage: number;
  owner: 'player' | 'enemy';
  lifespan: number;
  isArrow?: boolean;
  isRocket?: boolean;
  homingTargetId?: string;
}

export interface Building extends GameObject {
  id: string;
  type: string;
  material: string;
  hp: number;
  maxHp: number;
  isOpen?: boolean;
  inventory?: InventorySlot[];
  smeltProgress?: number;
  fuelLeft?: number;
}

export interface Portal extends GameObject {
  id: string;
  type: 'portal';
  sizeX?: number;
  sizeY?: number;
  inventory: InventorySlot[];
  isActive: boolean;
  targetDimension: 'OVERWORLD' | 'RUBY' | 'CAVERN';
}

export interface Particle extends GameObject {
  id: string;
  vx: number;
  vy: number;
  lifespan: number;
  maxLifespan: number;
  color: string;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  createdAt: number;
}

export interface ItemDrop extends GameObject {
  id: string;
  item: Item;
}

export interface CollectingState {
  nodeId: string;
  progress: number;
}

export interface TamingState {
  dogId?: string;
  animalId?: string;
  progress: number;
}

export interface EnchantmentOption {
  enchantment: ItemEnchantment;
  description: string;
}
