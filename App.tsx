
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, ResourceType, ToolTier, ZombieType, Language, AnimalType, Biome, NPCType, ZombieState, DogState, Enchantment } from './types';
import type { Player, ResourceNode, Zombie, Projectile, InventorySlot, Item, Tool, CollectingState, Building, Armor, Animal, ItemDrop, Consumable, Portal, Particle, NPC, Quest, TamingState, Dog, EnchantmentOption, ItemEnchantment, Explosion } from './types';
import {
  WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_MAX_HP, PLAYER_MAX_STAMINA, STAMINA_REGEN_RATE, STAMINA_DRAIN_RATE, DAY_DURATION_MS, NIGHT_DURATION_MS, BLOOD_MOON_DURATION_MS, RAIN_DURATION_MS, RESOURCE_RESPAWN_MS, ZOMBIE_STATS, ANIMAL_STATS, DOG_STATS, RESOURCE_DATA, ITEMS, INVENTORY_SLOTS, HOTBAR_SLOTS, INVENTORY_CRAFTING_RECIPES, CRAFTING_RECIPES, BIOME_DATA, LAVA_DAMAGE_THRESHOLD_MS, LAVA_DAMAGE_PER_SECOND, BLOCK_HP, PORTAL_INVENTORY_SLOTS, CHEST_INVENTORY_SLOTS, PLAYER_MAX_ENERGY, ENERGY_DRAIN_RATE, ENERGY_REGEN_PASSIVE_RATE, ENERGY_DAMAGE_AMOUNT, SMELT_TIME, FUEL_DURATION, FURNACE_INVENTORY_SLOTS, NPC_NAMES, QUEST_LIST, ZOMBIE_DETECTION_RADIUS, ZOMBIE_SOUND_INVESTIGATION_RADIUS, translations, ENCHANTMENT_DATA, TNT_RADIUS, TNT_DAMAGE, BAZOOKA_RADIUS, BAZOOKA_DAMAGE, CRATER_DURATION_MS, PLAYER_LAUNCH_FORCE
} from './constants';
import GameUI from './components/GameUI';
import { playSound, stopSound, stopAllSounds } from './audioManager';
import { SOUNDS } from './sounds';

const SAVE_KEY = 'zombieCraftSave';

const createInitialPlayer = (): Player => {
  return {
    id: 1,
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    size: PLAYER_SIZE,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    stamina: PLAYER_MAX_STAMINA,
    maxStamina: PLAYER_MAX_STAMINA,
    energy: PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
    money: 0,
    ammo: 10,
    inventory: Array.from({ length: INVENTORY_SLOTS }, () => ({ item: null })),
    craftingGrid: Array.from({ length: 4 }, () => ({ item: null })),
    craftingOutput: { item: null },
    enchantingSlots: Array.from({ length: 2 }, () => ({ item: null })),
    activeSlot: 0,
    armor: null,
    weapon: null,
    tool: null,
    offHand: { item: null },
    speed: PLAYER_SPEED,
    sprinting: false,
    lastAttackTime: 0,
    lavaDamageTimer: 0,
    lastDamageTime: 0,
    lastEnergyDamageTime: 0,
    dimension: 'OVERWORLD',
    overworldX: WORLD_WIDTH / 2,
    overworldY: WORLD_HEIGHT / 2,
    activeQuest: null,
  };
}

// Biome generation logic
const centerX = WORLD_WIDTH / 2;
const centerY = WORLD_HEIGHT / 2;
const beachRadius = Math.min(WORLD_WIDTH, WORLD_HEIGHT) / 2 - 800; // Beach starts here
const oceanRadius = Math.min(WORLD_WIDTH, WORLD_HEIGHT) / 2 - 200; // Ocean starts here

const getBiomeAt = (x: number, y: number, dimension: 'OVERWORLD' | 'RUBY' | 'CAVERN' = 'OVERWORLD'): Biome => {
    if (dimension === 'RUBY') {
        const cx = WORLD_WIDTH / 2;
        const cy = WORLD_HEIGHT / 2;
        // Remastered Ruby Layout:
        // Top Left: Dark
        // Bottom Right: Dark
        // Bottom Left: Light (Pink)
        // Rest (Top Right/Center): Base Ruby
        if (x < cx && y < cy) return Biome.RUBY_DARK;
        if (x > cx && y > cy) return Biome.RUBY_DARK;
        if (x < cx && y > cy) return Biome.RUBY_LIGHT;
        return Biome.RUBY;
    }
    if (dimension === 'CAVERN') return Biome.CAVERN;

    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > oceanRadius) return Biome.OCEAN;
    if (dist > beachRadius) return Biome.BEACH;

    // Split inner world into sectors for diverse biomes
    // Angle in radians: -PI to PI
    const angle = Math.atan2(dy, dx);
    const normalizedAngle = angle / Math.PI; // -1 to 1

    // Map angles to biomes
    // -1.0 to -0.75: Swamp
    // -0.75 to -0.5: Autumn Forest
    // -0.5 to -0.25: Forest
    // -0.25 to 0.0: Plains
    // 0.0 to 0.25: Savannah
    // 0.25 to 0.5: Desert
    // 0.5 to 0.75: Snow
    // 0.75 to 1.0: Lava

    if (normalizedAngle >= -1.0 && normalizedAngle < -0.75) return Biome.SWAMP;
    if (normalizedAngle >= -0.75 && normalizedAngle < -0.5) return Biome.AUTUMN_FOREST;
    if (normalizedAngle >= -0.5 && normalizedAngle < -0.25) return Biome.FOREST;
    if (normalizedAngle >= -0.25 && normalizedAngle < 0.0) return Biome.PLAINS;
    if (normalizedAngle >= 0.0 && normalizedAngle < 0.25) return Biome.SAVANNAH;
    if (normalizedAngle >= 0.25 && normalizedAngle < 0.5) return Biome.DESERT;
    if (normalizedAngle >= 0.5 && normalizedAngle < 0.75) return Biome.SNOW;
    
    return Biome.LAVA;
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [language, setLanguage] = useState<Language>(Language.PT);
  const [player, setPlayer] = useState(createInitialPlayer());
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [itemDrops, setItemDrops] = useState<ItemDrop[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [day, setDay] = useState(1);
  const [isNight, setIsNight] = useState(false);
  const [timeInCycle, setTimeInCycle] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [collectingState, setCollectingState] = useState<CollectingState | null>(null);
  const [tamingState, setTamingState] = useState<TamingState | null>(null);
  const [dogBeingNamed, setDogBeingNamed] = useState<Dog | null>(null);
  const [currentBiome, setCurrentBiome] = useState<Biome>(Biome.PLAINS);
  const [enchantmentOptions, setEnchantmentOptions] = useState<EnchantmentOption[]>([]);

  // Event States
  const [isBloodMoon, setIsBloodMoon] = useState(false);
  const [isRaining, setIsRaining] = useState(false);
  const [rainTimer, setRainTimer] = useState(0);
  const [destroyedResources, setDestroyedResources] = useState<ResourceNode[]>([]);

  // Creative Mode State
  const [creativeMode, setCreativeMode] = useState(false);
  const [invisible, setInvisible] = useState(false);
  const [noclip, setNoclip] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);

  // UI State
  const [activePortal, setActivePortal] = useState<Portal | null>(null);
  const [activeChest, setActiveChest] = useState<Building | null>(null);
  const [activeFurnace, setActiveFurnace] = useState<Building | null>(null);
  const [activeEnchantingTable, setActiveEnchantingTable] = useState<Building | null>(null);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [isNearReturnPortal, setIsNearReturnPortal] = useState(false);
  const [showSleepConfirm, setShowSleepConfirm] = useState(false);

  // Save/Load State
  const [saveExists, setSaveExists] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTime = useRef<number>(performance.now());
  const gameLoopRef = useRef<number | null>(null);
  const lastFootstepTime = useRef(0);
  const mendingTimers = useRef<{ [itemId: string]: number }>({}).current;

  // State Management for Dimensions
  const stateRef = useRef({
      resources, zombies, animals, dogs, npcs, itemDrops, projectiles, 
      buildings, portals, particles, explosions, destroyedResources
  });

  useEffect(() => {
      stateRef.current = {
           resources, zombies, animals, dogs, npcs, itemDrops, projectiles, 
           buildings, portals, particles, explosions, destroyedResources
      };
  }, [resources, zombies, animals, dogs, npcs, itemDrops, projectiles, buildings, portals, particles, explosions, destroyedResources]);

  const savedDimensions = useRef<Map<string, typeof stateRef.current>>(new Map());

  const camera = {
    x: player.x - window.innerWidth / 2,
    y: player.y - window.innerHeight / 2
  };
  
  // ... [generateResources, generateStructure, initGame, etc. omitted for brevity, assume unchanged until gameTick] ...
  const generateResources = useCallback((dimension: 'OVERWORLD' | 'RUBY' | 'CAVERN') => {
    const newResources: ResourceNode[] = [];
    const totalResources = dimension === 'RUBY' ? 200 : (dimension === 'CAVERN' ? 1000 : 8000); 
    
    let astrilitaCount = 0;

    for (let i = 0; i < totalResources; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        const biome = getBiomeAt(x, y, dimension);

        if (biome === Biome.WATER || biome === Biome.OCEAN) continue;

        const density = BIOME_DATA[biome].generationDensity;
        if (density !== undefined && Math.random() > density) {
            continue;
        }

        const biomeMultipliers = BIOME_DATA[biome].resourceMultipliers;

        if (dimension === 'OVERWORLD') {
             const allowedResources = [ResourceType.WOOD, ResourceType.BUSH, ResourceType.CACTUS, ResourceType.CLAY, ResourceType.STONE, ResourceType.SWAMP_BUSH, ResourceType.AUTUMN_BUSH];
             const weights = allowedResources.map(type => {
                 const mult = biomeMultipliers[type] || 0;
                 let base = 0;
                 if(type === ResourceType.WOOD) base = 10;
                 if(type === ResourceType.BUSH) base = 5;
                 if(type === ResourceType.CACTUS) base = 5;
                 if(type === ResourceType.CLAY) base = 3;
                 if(type === ResourceType.STONE) base = 5;
                 if(type === ResourceType.SWAMP_BUSH) base = 5;
                 if(type === ResourceType.AUTUMN_BUSH) base = 5;
                 return { type, weight: base * mult };
             }).filter(w => w.weight > 0);

             if (weights.length === 0) continue;

             const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
             let randomValue = Math.random() * totalWeight;
             let selectedType = weights[0].type;
             
             for(const w of weights) {
                 randomValue -= w.weight;
                 if(randomValue <= 0) {
                     selectedType = w.type;
                     break;
                 }
             }

             let size = TILE_SIZE;
             let hp = 20;
             if (selectedType === ResourceType.WOOD) {
                 size = TILE_SIZE * 1.5;
                 hp = 100;
             }

             newResources.push({
                id: `res_${dimension}_${i}`, x, y, size: size,
                type: selectedType, hp: hp, maxHp: hp, respawnTimer: 0,
                biome: biome 
            });
            continue;
        }
        
        const resourceTypes = dimension === 'RUBY'
            ? [ResourceType.STONE, ResourceType.DIAMOND, ResourceType.RUBY, ResourceType.RUBY_CRYSTAL, ResourceType.RUBY_WOOD]
            : [ResourceType.STONE, ResourceType.COAL, ResourceType.IRON, ResourceType.GOLD, ResourceType.DIAMOND, ResourceType.COPPER, ResourceType.SILVINITA, ResourceType.ASTRILITA];
        
        const weights = resourceTypes.map(type => {
            if (type === ResourceType.ASTRILITA && astrilitaCount >= 3) return { type, weight: 0 };

            const baseProbability = { 
                [ResourceType.STONE]: 0.4, 
                [ResourceType.COAL]: 0.2, 
                [ResourceType.COPPER]: 0.2,
                [ResourceType.IRON]: 0.15, 
                [ResourceType.GOLD]: 0.1, 
                [ResourceType.DIAMOND]: 0.04, 
                [ResourceType.RUBY]: 0.04, 
                [ResourceType.RUBY_CRYSTAL]: 0.05,
                [ResourceType.RUBY_WOOD]: 0.1,
                [ResourceType.SILVINITA]: 0.04,
                [ResourceType.ASTRILITA]: 0.005 
            }[type] || 0;

            let multiplier = biomeMultipliers[type];
            if (multiplier === undefined) multiplier = 0; 

            if (dimension === 'CAVERN' && multiplier === 0) multiplier = 0.5;
            if (dimension === 'RUBY' && multiplier === 0) multiplier = 0.1; 

            return { type, weight: baseProbability * multiplier };
        }).filter(w => w.weight > 0);

        if (weights.length === 0) continue;

        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let randomValue = Math.random() * totalWeight;
        let selectedType = weights[0].type;

        for (const w of weights) {
            randomValue -= w.weight;
            if (randomValue <= 0) {
                selectedType = w.type;
                break;
            }
        }
        
        let size = TILE_SIZE;
        let hp = 100;
        if (selectedType === ResourceType.RUBY_WOOD) {
            size = TILE_SIZE * 1.5;
            hp = 150;
        }

        newResources.push({ id: `res_${dimension}_${i}`, x, y, size, type: selectedType, hp, maxHp: hp, respawnTimer: 0, biome: biome });
        if (selectedType === ResourceType.ASTRILITA) astrilitaCount++;
    }
    setResources(newResources);
  }, []);

  const generateStructure = useCallback((centerX: number, centerY: number, structure: string[], material: string) => {
    const newBuildings: Building[] = [];
    const startX = centerX - Math.floor(structure[0].length / 2) * TILE_SIZE;
    const startY = centerY - Math.floor(structure.length / 2) * TILE_SIZE;

    structure.forEach((row, y) => {
        row.split('').forEach((char, x) => {
            if (char === '#') {
                const blockX = startX + x * TILE_SIZE;
                const blockY = startY + y * TILE_SIZE;
                newBuildings.push({
                    id: `struct_building_${blockX}_${blockY}`,
                    x: blockX, y: blockY, size: TILE_SIZE,
                    type: 'block', material: material, hp: BLOCK_HP[material], maxHp: BLOCK_HP[material]
                });
            } else if (char === 'D') {
                 const doorX = startX + x * TILE_SIZE;
                 const doorY = startY + y * TILE_SIZE;
                 newBuildings.push({
                     id: `struct_door_${doorX}_${doorY}`,
                     x: doorX, y: doorY, size: TILE_SIZE,
                     type: 'door', material: material, hp: BLOCK_HP[material], maxHp: BLOCK_HP[material], isOpen: false
                 });
            }
        });
    });
    return newBuildings;
  }, []);

  const initGame = useCallback(() => {
    savedDimensions.current.clear();
    const initialPlayer = createInitialPlayer();
    setPlayer(initialPlayer);
    setDay(1);
    setIsNight(false);
    setTimeInCycle(0);
    setZombies([]);
    setAnimals([]);
    setDogs([]);
    setItemDrops([]);
    setProjectiles([]);
    setPortals([]);
    setParticles([]);
    setExplosions([]);
    setCreativeMode(false);
    setInvisible(false);
    setNoclip(false);
    setBuildings([]);
    setIsBloodMoon(false);
    setIsRaining(false);
    
    const newNPCs: NPC[] = [];
    const newBuildings: Building[] = [];

    const vendorHouseX = WORLD_WIDTH / 2 + 500;
    const vendorHouseY = WORLD_HEIGHT / 2 + 500;
    newNPCs.push({
        id: 'npc_vendor', x: vendorHouseX, y: vendorHouseY, size: PLAYER_SIZE,
        type: NPCType.VENDOR, name: 'Claudio'
    });
    const houseLayout = [
        '#######',
        '#     #',
        '#     #',
        '#     #',
        '###D###'
    ];
    newBuildings.push(...generateStructure(vendorHouseX, vendorHouseY, houseLayout, 'wood'));

     const questGiverX = WORLD_WIDTH / 2 - 500;
     const questGiverY = WORLD_HEIGHT / 2 - 500;
     newNPCs.push({
        id: 'npc_quest', x: questGiverX, y: questGiverY, size: PLAYER_SIZE,
        type: NPCType.QUEST_GIVER, name: NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)]
     });

    // Spawn Mysterious Statue
    newBuildings.push({
        id: 'mysterious_statue',
        x: WORLD_WIDTH / 2 + 200,
        y: WORLD_HEIGHT / 2 + 200,
        size: TILE_SIZE * 2,
        type: 'mysterious_statue',
        material: 'mysterious_statue',
        hp: BLOCK_HP['mysterious_statue'],
        maxHp: BLOCK_HP['mysterious_statue']
    });

    setNpcs(newNPCs);
    setBuildings(newBuildings);

    generateResources('OVERWORLD');
    setDestroyedResources([]);
  }, [generateResources, generateStructure]);

  const startNewGame = useCallback(() => {
    setGameState(GameState.LOADING);
    setTimeout(() => {
        initGame();
        setGameState(GameState.PLAYING);
    }, 5000);
  }, [initGame]);

  const respawnPlayer = useCallback(() => {
    setPlayer(p => ({
        ...p,
        hp: p.maxHp,
        stamina: p.maxStamina,
        energy: p.maxEnergy,
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        overworldX: WORLD_WIDTH / 2,
        overworldY: WORLD_HEIGHT / 2,
        dimension: 'OVERWORLD',
        vx: 0,
        vy: 0
    }));
    setGameState(GameState.PLAYING);
  }, []);

  const loadGame = useCallback(() => {
    setGameState(GameState.LOADING);
    setTimeout(() => {
        const saveStr = localStorage.getItem(SAVE_KEY);
        if (saveStr) {
            try {
                const save = JSON.parse(saveStr);
                setPlayer(save.player);
                setDay(save.day);
                setIsNight(save.isNight);
                setTimeInCycle(save.timeInCycle);
                setResources(save.resources);
                setBuildings(save.buildings);
                setZombies(save.zombies);
                setAnimals(save.animals);
                setDogs(save.dogs);
                setNpcs(save.npcs);
                setPortals(save.portals);
                setGameState(GameState.PLAYING);
            } catch(e) {
                console.error("Error loading save", e);
                setGameState(GameState.MENU); 
            }
        } else {
             setGameState(GameState.MENU); 
        }
    }, 5000);
  }, []);

  const giveCreativeItem = useCallback((item: Item) => {
    const itemToAdd = { ...item, quantity: item.maxStack };
    setPlayer(p => {
        const newInv = [...p.inventory];
        const emptyIdx = newInv.findIndex(slot => !slot.item);
        if (emptyIdx !== -1) {
            newInv[emptyIdx] = { item: itemToAdd };
        }
        return { ...p, inventory: newInv };
    });
  }, []);

  const spawnZombie = useCallback((type: ZombieType, customX?: number, customY?: number) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 200;
    const x = customX !== undefined ? customX : player.x + Math.cos(angle) * distance;
    const y = customY !== undefined ? customY : player.y + Math.sin(angle) * distance;
    const stats = ZOMBIE_STATS[ZombieType[type] as keyof typeof ZOMBIE_STATS] || ZOMBIE_STATS.NORMAL;
    setZombies(zs => [...zs, {
        id: `zombie_spawn_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
        hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
        type, targetId: null, isBoss: type === ZombieType.BOSS, attackCooldown: 1000, lastAttackTime: 0,
        state: ZombieState.WANDERING, targetX: x, targetY: y, stateTimer: 0
    }]);
  }, [player.x, player.y]);

  const spawnAnimal = useCallback((type: AnimalType) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 200;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    const stats = ANIMAL_STATS[AnimalType[type] as keyof typeof ANIMAL_STATS];
    setAnimals(as => [...as, {
        id: `animal_spawn_${Date.now()}`, x, y, size: stats.size,
        hp: stats.hp, maxHp: stats.hp, speed: stats.speed, type, vx: 0, vy: 0, changeDirectionTimer: 0,
        state: 'WANDERING'
    }]);
  }, [player.x, player.y]);

  const clearInventory = useCallback(() => {
    setPlayer(p => ({ ...p, inventory: Array.from({ length: INVENTORY_SLOTS }, () => ({ item: null })) }));
  }, []);

  const teleportPlayer = useCallback((pos: {x: number, y: number}) => {
    setPlayer(p => ({ ...p, x: pos.x, y: pos.y }));
  }, []);

  const manipulatePlayerStat = useCallback((stat: 'hp' | 'stamina' | 'energy', change: number) => {
    setPlayer(p => {
        if (stat === 'hp') return { ...p, hp: Math.min(p.maxHp, Math.max(0, p.hp + change)) };
        if (stat === 'stamina') return { ...p, stamina: Math.min(p.maxStamina, Math.max(0, p.stamina + change)) };
        if (stat === 'energy') return { ...p, energy: Math.min(p.maxEnergy, Math.max(0, p.energy + change)) };
        return p;
    });
  }, []);

  const toggleBloodMoon = useCallback(() => setIsBloodMoon(v => !v), []);
  const toggleRain = useCallback(() => setIsRaining(v => !v), []);
  const skipNight = useCallback(() => {
    if (isNight) {
        for(let i=0; i<5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 300 + Math.random() * 200;
            spawnZombie(ZombieType.NORMAL, player.x + Math.cos(angle)*dist, player.y + Math.sin(angle)*dist);
        }
        
        setIsNight(false);
        setDay(d => d + 1);
        setTimeInCycle(0);
        setPlayer(p => ({...p, hp: p.maxHp, stamina: p.maxStamina, energy: p.maxEnergy}));
    }
  }, [isNight, player.x, player.y, spawnZombie]);

    const addToInventory = useCallback((itemToAdd: Item, quantity: number = itemToAdd.quantity): boolean => {
        if (itemToAdd.id === 'ammo') {
             setPlayer(p => ({ ...p, ammo: p.ammo + quantity}));
             return true;
        }
        if (itemToAdd.id === 'money') {
            setPlayer(p => ({...p, money: p.money + quantity}));
            return true;
        }

        let quantityLeft = quantity;
        let success = false;
        setPlayer(p => {
            const newInventory = p.inventory.map(slot => ({ ...slot, item: slot.item ? {...slot.item} : null }));
            
            if (itemToAdd.stackable) {
                for (let i = 0; i < newInventory.length; i++) {
                    const slot = newInventory[i];
                    if (slot.item && slot.item.id === itemToAdd.id && slot.item.quantity < slot.item.maxStack) {
                        const canAdd = slot.item.maxStack - slot.item.quantity;
                        const toAdd = Math.min(quantityLeft, canAdd);
                        newInventory[i] = { item: { ...slot.item, quantity: slot.item.quantity + toAdd } };
                        quantityLeft -= toAdd;
                        if (quantityLeft <= 0) break;
                    }
                }
            }
            
            if (quantityLeft > 0) {
                for (let i = 0; i < newInventory.length; i++) {
                    if (!newInventory[i].item) {
                        const toAdd = Math.min(quantityLeft, itemToAdd.maxStack);
                        const newItem = {...itemToAdd, quantity: toAdd};
                        if (newItem.maxDurability) {
                            newItem.durability = newItem.maxDurability;
                        }
                        newInventory[i] = { item: newItem };
                        quantityLeft -= toAdd;
                        if (quantityLeft <= 0) break;
                    }
                }
            }
            
            if (quantityLeft < quantity) {
                success = true;
                return { ...p, inventory: newInventory };
            }
            return p;
        });
        
        if (success) {
            playSound(SOUNDS.ITEM_PICKUP, { volume: 0.5 });
        }
        return success;
    }, []);
    
    // ... [Other callbacks like updatePlayerInventory, handleCraft, handleEnchant omitted for brevity, assumed same] ...
    const updatePlayerInventory = useCallback((
        newInventory: InventorySlot[],
        newEquipment: { weapon: Tool | null, armor: Armor | null, tool: Tool | null, offHand: InventorySlot },
        newCraftingGrid: InventorySlot[],
        newCraftingOutput: InventorySlot
    ) => {
        setPlayer(p => ({
            ...p,
            inventory: newInventory,
            weapon: newEquipment.weapon,
            armor: newEquipment.armor,
            tool: newEquipment.tool,
            offHand: newEquipment.offHand,
            craftingGrid: newCraftingGrid,
            craftingOutput: newCraftingOutput
        }));
    }, []);

    const updatePlayerAndPortalInventories = useCallback((newPlayerInventory: InventorySlot[], portalId: string, newPortalInventory: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory}));
        setPortals(ps => ps.map(p => p.id === portalId ? {...p, inventory: newPortalInventory} : p));
        setActivePortal(p => p ? {...p, inventory: newPortalInventory} : null);
    }, []);

    const updatePlayerAndChestInventories = useCallback((newPlayerInventory: InventorySlot[], chestId: string, newChestInventory: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory}));
        setBuildings(bs => bs.map(b => b.id === chestId ? {...b, inventory: newChestInventory} : b));
        setActiveChest(c => c ? {...c, inventory: newChestInventory} : null);
    }, []);
    
    const updatePlayerAndFurnaceInventories = useCallback((newPlayerInventory: InventorySlot[], furnaceId: string, newFurnaceInventory: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory}));
        setBuildings(bs => bs.map(b => b.id === furnaceId ? {...b, inventory: newFurnaceInventory} : b));
        setActiveFurnace(f => f ? {...f, inventory: newFurnaceInventory} : null);
    }, []);
    
    const updatePlayerAndEnchantingSlots = useCallback((newPlayerInventory: InventorySlot[], newEnchantingSlots: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory, enchantingSlots: newEnchantingSlots }));
    }, []);

    const handleNamePet = useCallback((id: string, name: string) => {
        setDogs(ds => ds.map(d => d.id === id ? { ...d, name } : d));
        setAnimals(as => as.map(a => a.id === id ? { ...a, name } : a));
        setDogBeingNamed(null);
        setGameState(GameState.PLAYING);
    }, []);

    const killAllZombies = useCallback(() => {
        setZombies([]);
    }, []);

  const checkCollision = (rect: {x:number, y:number, width:number, height:number}, objects: (Building|ResourceNode|Portal|NPC|Dog)[]) => {
      for(const obj of objects) {
          if ('type' in obj && obj.type === 'portal') continue; 
          if ('type' in obj && ((obj as ResourceNode).type === ResourceType.BUSH || (obj as ResourceNode).type === ResourceType.SWAMP_BUSH || (obj as ResourceNode).type === ResourceType.AUTUMN_BUSH)) continue;

          if ('state' in obj && obj.state === DogState.SITTING) { 
          }
          if (rect.x < obj.x + obj.size/2 &&
              rect.x + rect.width > obj.x - obj.size/2 &&
              rect.y < obj.y + obj.size/2 &&
              rect.y + rect.height > obj.y - obj.size/2) {
              return true;
          }
      }
      return false;
  }
  
  const handleCraft = useCallback((itemId: string) => {
    const recipe = CRAFTING_RECIPES[itemId];
    if (!recipe) return;
    const craftedItemBase = ITEMS[itemId];
    if (!craftedItemBase) return;

    let quantityCreated = 1;
    if (itemId === 'arrow') quantityCreated = 4;
    if (itemId === 'copper_cable') quantityCreated = 2;
    
    const craftedItem = {...craftedItemBase, quantity: quantityCreated};
     if (craftedItem.maxDurability) {
        craftedItem.durability = craftedItem.maxDurability;
    }

    if (itemId === 'ammo') {
        const hasResources = player.inventory.some(slot => slot.item?.id === 'gold_ingot' && slot.item.quantity >= 1);
        if(hasResources) {
            setPlayer(p => {
                const newInventory = [...p.inventory];
                let consumed = false;
                for(const slot of newInventory) {
                    if(slot.item?.id === 'gold_ingot') {
                        slot.item.quantity -= 1;
                        if(slot.item.quantity <= 0) slot.item = null;
                        consumed = true;
                        break;
                    }
                }
                return consumed ? { ...p, inventory: newInventory, ammo: p.ammo + 30 } : p;
            });
             playSound(SOUNDS.CRAFT_SUCCESS);
        }
        return;
    }

    setPlayer(p => {
        const currentInventory = p.inventory.map(slot => ({ ...slot, item: slot.item ? { ...slot.item } : null }));
        const resourceCounts: { [key: string]: number } = {};
        
        currentInventory.forEach(slot => {
            if (slot.item) {
                resourceCounts[slot.item.id] = (resourceCounts[slot.item.id] || 0) + slot.item.quantity;
            }
        });

        const hasResources = Object.entries(recipe).every(([resourceId, requiredAmount]) => 
            (resourceCounts[resourceId] || 0) >= requiredAmount
        );
        
        if (!hasResources) {
            return p;
        }

        Object.entries(recipe).forEach(([resourceId, requiredAmount]) => {
            let amountToConsume = requiredAmount;
            for (let i = 0; i < currentInventory.length; i++) {
                const slot = currentInventory[i];
                if (slot.item && slot.item.id === resourceId) {
                    const amountInSlot = slot.item.quantity;
                    if (amountInSlot > amountToConsume) {
                        slot.item.quantity -= amountToConsume;
                        amountToConsume = 0;
                    } else {
                        amountToConsume -= amountInSlot;
                        currentInventory[i].item = null;
                    }
                }
                if (amountToConsume === 0) break;
            }
        });
        
        const tempPlayerState = { ...p, inventory: currentInventory };
       
        let added = false;
        let quantityLeft = craftedItem.quantity;

        for(let i = 0; i < tempPlayerState.inventory.length; i++) {
            const slot = tempPlayerState.inventory[i];
            if (slot.item && slot.item.id === craftedItem.id && slot.item.stackable && slot.item.quantity < craftedItem.maxStack) {
                const canAdd = craftedItem.maxStack - slot.item.quantity;
                const toAdd = Math.min(quantityLeft, canAdd);
                slot.item.quantity += toAdd;
                quantityLeft -= toAdd;
            }
            if (quantityLeft <= 0) {
                added = true;
                break;
            }
        }
        
        if(quantityLeft > 0) {
            for(let i = 0; i < tempPlayerState.inventory.length; i++){
                if(!tempPlayerState.inventory[i].item) {
                    tempPlayerState.inventory[i].item = { ...craftedItem, quantity: quantityLeft };
                    quantityLeft = 0;
                    added = true;
                    break;
                }
            }
        }
        
        if(added) {
            playSound(SOUNDS.CRAFT_SUCCESS);
            return tempPlayerState;
        } else {
            return p; 
        }
    });
}, [player.inventory]);

const handleEnchant = useCallback((enchantment: ItemEnchantment) => {
    setPlayer(p => {
        const newSlots = p.enchantingSlots.map(s => ({...s, item: s.item ? {...s.item} : null}));
        const targetItem = newSlots[0].item;
        const catalyst = newSlots[1].item;

        if (!targetItem || !catalyst) return p;

        if (catalyst.quantity > 1) {
            catalyst.quantity--;
        } else {
            newSlots[1].item = null;
        }

        if (!targetItem.enchantments) targetItem.enchantments = [];
        
        targetItem.enchantments = targetItem.enchantments.filter(e => e.type !== enchantment.type);
        targetItem.enchantments.push(enchantment);
        
        return { ...p, enchantingSlots: newSlots };
    });
    setEnchantmentOptions([]);
    playSound(SOUNDS.PORTAL_ACTIVATE); 
}, []);

const switchDimension = useCallback((targetDimension: 'OVERWORLD' | 'RUBY' | 'CAVERN') => {
    const currentDim = player.dimension;
    savedDimensions.current.set(currentDim, { ...stateRef.current });

    let newPlayer = { ...player };
    newPlayer.dimension = targetDimension;
    
    if (targetDimension === 'OVERWORLD') {
        newPlayer.x = player.overworldX;
        newPlayer.y = player.overworldY;
    } else {
        newPlayer.overworldX = player.x;
        newPlayer.overworldY = player.y;
        newPlayer.x = WORLD_WIDTH / 2;
        newPlayer.y = WORLD_HEIGHT / 2 + 100;
    }
    
    if (savedDimensions.current.has(targetDimension)) {
        const saved = savedDimensions.current.get(targetDimension)!;
        setResources(saved.resources);
        setZombies(saved.zombies);
        setAnimals(saved.animals);
        setDogs(saved.dogs);
        setNpcs(saved.npcs);
        setItemDrops(saved.itemDrops);
        setProjectiles(saved.projectiles);
        setBuildings(saved.buildings);
        setPortals(saved.portals);
        setParticles(saved.particles);
        setExplosions(saved.explosions);
        setDestroyedResources(saved.destroyedResources);
    } else {
         setZombies([]);
         setAnimals([]);
         setDogs([]);
         setBuildings([]);
         setItemDrops([]);
         setParticles([]);
         setNpcs([]);
         setProjectiles([]);
         setExplosions([]);
         setDestroyedResources([]);

         if (targetDimension === 'RUBY' || targetDimension === 'CAVERN') {
             generateResources(targetDimension);
             setPortals([{
                id: `portal_to_overworld_${Date.now()}`,
                x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, 
                size: TILE_SIZE * 3,
                sizeX: TILE_SIZE * 1.5,
                sizeY: TILE_SIZE * 3,
                type: 'portal',
                inventory: [], isActive: true, targetDimension: 'OVERWORLD'
            }]);
         } else {
             generateResources('OVERWORLD');
         }
    }

    setPlayer(newPlayer);
    setGameState(GameState.PLAYING);
    setActivePortal(null);
    playSound(SOUNDS.PORTAL_TRAVEL);

}, [player, generateResources]);

const enterRubyDimension = useCallback(() => {
    switchDimension('RUBY');
}, [switchDimension]);

const returnToOverworld = useCallback(() => {
    switchDimension('OVERWORLD');
}, [switchDimension]);

const enterCavern = useCallback(() => {
    switchDimension('CAVERN');
}, [switchDimension]);

const returnFromCavern = useCallback(() => {
    switchDimension('OVERWORLD');
}, [switchDimension]);

const takeDamage = useCallback((damage: number, attacker?: Zombie | Animal) => {
    setPlayer(p => {
        if (creativeMode) return p;

        let damageLeft = damage;
        const newOffHand = { ...p.offHand, item: p.offHand.item ? { ...p.offHand.item } : null };
        let newArmor = p.armor ? { ...p.armor } : null;

        if (newOffHand.item?.type === 'shield' && newOffHand.item.durability && newOffHand.item.durability > 0) {
            let durabilityLoss = 1;
            const unbreaking = newOffHand.item.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
            if (unbreaking && Math.random() > 1 / (unbreaking.level + 1)) {
                durabilityLoss = 0;
            }

            if (durabilityLoss > 0) {
                const shieldDamage = Math.min(damageLeft, newOffHand.item.durability);
                newOffHand.item.durability -= shieldDamage;
                damageLeft -= shieldDamage;
                playSound(SOUNDS.SHIELD_HIT);
                if (newOffHand.item.durability <= 0) {
                    newOffHand.item = null;
                    playSound(SOUNDS.ITEM_BREAK);
                }
            }
        }
        
        let damageReduction = newArmor?.defense || 0;
        const protection = newArmor?.enchantments?.find(e => e.type === Enchantment.PROTECTION);
        if (protection) {
            damageReduction += protection.level * 0.05;
        }
        const damageTaken = damageLeft * (1 - damageReduction);
        
        if (newArmor && damageTaken > 0 && newArmor.durability !== undefined) {
            let durabilityLoss = 1;
             const unbreaking = newArmor.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
            if (unbreaking && Math.random() > 1 / (unbreaking.level + 1)) {
                durabilityLoss = 0;
            }
            const thorns = newArmor.enchantments?.find(e => e.type === Enchantment.THORNS);
            if (thorns) {
                durabilityLoss += 2;
            }

            newArmor.durability -= durabilityLoss;
            if (newArmor.durability <= 0) {
                playSound(SOUNDS.ITEM_BREAK);
                newArmor = null;
            }
        }

        const prospectiveHp = p.hp - damageTaken;

        if (prospectiveHp <= 0 && newOffHand.item?.id === 'totem_ruby') {
            playSound(SOUNDS.PORTAL_ACTIVATE); 
            
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;
                setParticles(ps => [...ps, {
                    id: `totem_particle_${Date.now()}_${Math.random()}`,
                    x: p.x, y: p.y, size: Math.random() * 4 + 2,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    lifespan: 1500, maxLifespan: 1500,
                    color: ['#FFD700', '#FFC0CB', '#E0115F'][Math.floor(Math.random() * 3)]
                }]);
            }
            
            return {
                ...p,
                hp: 20, 
                offHand: { item: null }, 
                lastDamageTime: Date.now() + 2000, 
                armor: newArmor,
            };
        }

        const newPlayerHp = Math.max(0, prospectiveHp);
        let lastDamageTime = p.lastDamageTime;

        if (damageTaken > 0) {
          lastDamageTime = Date.now();
          if (newPlayerHp <= 0) {
              setGameState(GameState.GAME_OVER);
          } else {
              playSound(SOUNDS.PLAYER_HURT);
          }
        }

        let poisonEffect = p.poisonEffect;
        if(attacker && 'type' in attacker && attacker.type === AnimalType.SCORPION) {
             poisonEffect = {
                 endTime: Date.now() + ANIMAL_STATS.SCORPION.poisonDuration,
                 damagePerTick: ANIMAL_STATS.SCORPION.poisonDamage,
                 lastTick: Date.now()
             };
        }

        return { ...p, hp: newPlayerHp, lastDamageTime, offHand: newOffHand, armor: newArmor, poisonEffect };
    });
}, [creativeMode]);

const handleExplosion = useCallback((x: number, y: number, radius: number, damage: number, isTntPlayerLaunch: boolean) => {
    playSound(SOUNDS.EXPLOSION);
    setExplosions(exps => [...exps, { id: `exp_${Date.now()}`, x, y, radius, createdAt: Date.now() }]);

    const playerDist = Math.hypot(player.x - x, player.y - y);
    if (playerDist < radius && !creativeMode) {
        if (isTntPlayerLaunch && playerDist < TILE_SIZE * 1.5) {
            setPlayer(p => {
                 const angle = Math.atan2(p.y - y, p.x - x) || 1; 
                 const launchForce = PLAYER_LAUNCH_FORCE;
                 playSound(SOUNDS.PLAYER_HURT);
                 return {
                    ...p,
                    hp: 1,
                    vx: p.vx + Math.cos(angle) * launchForce,
                    vy: p.vy + Math.sin(angle) * launchForce,
                    lastDamageTime: Date.now(),
                 };
            });
        } else {
             const damageTaken = Math.floor(damage * (1 - playerDist / radius));
             takeDamage(damageTaken);
        }
    }

    const newDrops: ItemDrop[] = [];
    setZombies(zs => zs.map(z => {
        const dist = Math.hypot(z.x - x, z.y - y);
        if (dist < radius) {
            const damageTaken = (z.isBoss || z.type === ZombieType.MEGA_BOSS) ? 0 : Math.floor(damage * (1 - dist / radius));
            return {...z, hp: z.hp - damageTaken};
        }
        return z;
    }).filter(z => z.hp > 0));

    setAnimals(as => as.map(a => {
        const dist = Math.hypot(a.x - x, a.y - y);
        if (dist < radius) {
            return {...a, hp: a.hp - BAZOOKA_DAMAGE};
        }
        return a;
    }).filter(a => a.hp > 0));

    setDogs(ds => ds.map(d => {
         const dist = Math.hypot(d.x - x, d.y - y);
        if (dist < radius) {
            return {...d, hp: d.hp - BAZOOKA_DAMAGE};
        }
        return d;
    }).filter(d => d.hp > 0));

    setBuildings(bs => bs.filter(b => {
        const dist = Math.hypot(b.x - x, b.y - y);
        if (dist < radius) {
            if(ITEMS[b.type]) {
                newDrops.push({ id: `drop_b_${b.type}_${Date.now()}`, x: b.x, y: b.y, size: 20, item: ITEMS[b.type as 'chest'] });
            }
            return false;
        }
        return true;
    }));
    setResources(rs => rs.filter(r => {
        const dist = Math.hypot(r.x - x, r.y - y);
        if (dist < radius) {
            const dropId = r.type === ResourceType.IRON ? 'iron_ore' : r.type === ResourceType.GOLD ? 'gold_ore' : r.type.toLowerCase();
            newDrops.push({ id: `drop_r_${r.type}_${Date.now()}`, x: r.x, y: r.y, size: 20, item: ITEMS[dropId] });
            return false;
        }
        return true;
    }));

    if (newDrops.length > 0) {
        setItemDrops(d => [...d, ...newDrops]);
    }
}, [player.x, player.y, takeDamage, creativeMode]);


  const gameTick = useCallback((dt: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    const speedMultiplier = dt / (1000 / 60);

    if(player.dimension === 'OVERWORLD') {
        setTimeInCycle(prev => {
            const newTime = prev + dt;
            const cycleDuration = isNight ? (isBloodMoon ? BLOOD_MOON_DURATION_MS : NIGHT_DURATION_MS) : DAY_DURATION_MS;
            if (newTime >= cycleDuration) {
                if (isNight) {
                    setDay(d => d + 1);
                    setIsNight(false);
                    setIsBloodMoon(false);
                    setZombies(zs => zs.filter(z => z.isBoss));
                    setAnimals(as => as.filter(a => a.type !== AnimalType.SCORPION));
                     if(Math.random() < 0.2 && !isRaining) {
                        setIsRaining(true);
                        setRainTimer(RAIN_DURATION_MS);
                    }
                } else {
                    setIsNight(true);
                    if ((day + 1) % 10 === 0) {
                        setIsBloodMoon(true);
                    }
                    setPlayer(p => ({...p, energy: Math.max(0, p.energy - 30)}));
                }
                return 0;
            }
            return newTime;
        });
    }
    
    if(isRaining) {
        setRainTimer(t => {
            const newT = t - dt;
            if(newT <= 0) {
                setIsRaining(false);
                return 0;
            }
            return newT;
        });
    }

    setExplosions(exps => exps.filter(exp => Date.now() - exp.createdAt < CRATER_DURATION_MS));

    const checkMending = (item: Item | null, slotKey: string) => {
        if (item && item.durability !== undefined && item.maxDurability && item.durability < item.maxDurability) {
            const mending = item.enchantments?.find(e => e.type === Enchantment.MENDING);
            if (mending) {
                const timerId = `${slotKey}-${item.id}`;
                mendingTimers[timerId] = (mendingTimers[timerId] || 0) + dt;
                if (mendingTimers[timerId] >= 1000) { 
                    item.durability = Math.min(item.maxDurability, item.durability + 1);
                    mendingTimers[timerId] = 0;
                }
                return { ...item };
            }
        }
        return item;
    }

    setPlayer(p => {
        let needsUpdate = false;
        const newWeapon = checkMending(p.weapon, 'weapon');
        const newArmor = checkMending(p.armor, 'armor');
        const newTool = checkMending(p.tool, 'tool');
        const newOffHandItem = checkMending(p.offHand.item, 'offhand');

        if (newWeapon !== p.weapon || newArmor !== p.armor || newTool !== p.tool || newOffHandItem !== p.offHand.item) {
            needsUpdate = true;
        }

        let newDiscountEffect = p.discountEffect;
        if (newDiscountEffect && Date.now() > newDiscountEffect.endTime) {
            newDiscountEffect = undefined;
            needsUpdate = true;
        }
        
        let newPoisonEffect = p.poisonEffect;
        let newHp = p.hp;
        let newLastDamageTime = p.lastDamageTime;
        
        if (newPoisonEffect) {
            if (Date.now() > newPoisonEffect.endTime) {
                newPoisonEffect = undefined;
                needsUpdate = true;
            } else if (Date.now() - newPoisonEffect.lastTick > 1000) {
                newPoisonEffect.lastTick = Date.now();
                newHp = Math.max(0, newHp - newPoisonEffect.damagePerTick);
                newLastDamageTime = Date.now();
                needsUpdate = true;
                if(newHp <= 0) setGameState(GameState.GAME_OVER);
                else playSound(SOUNDS.PLAYER_HURT, { volume: 0.3 });
            }
        }

        if (getBiomeAt(p.x, p.y, p.dimension) === Biome.OCEAN && !creativeMode) {
             setGameState(GameState.GAME_OVER);
             needsUpdate = false;
        }

        if(needsUpdate) {
            return {
                ...p,
                weapon: newWeapon as Tool | null,
                armor: newArmor as Armor | null,
                tool: newTool as Tool | null,
                offHand: { item: newOffHandItem },
                discountEffect: newDiscountEffect,
                hp: newHp,
                lastDamageTime: newLastDamageTime,
                poisonEffect: newPoisonEffect
            };
        }
        return p;
    });

    // Update Zombies (Movement & Attack)
    setZombies(prevZombies => prevZombies.map(zombie => {
        let newX = zombie.x;
        let newY = zombie.y;
        let newState = zombie.state;
        let newTargetX = zombie.targetX;
        let newTargetY = zombie.targetY;
        let newStateTimer = zombie.stateTimer - dt;
        let lastAttackTime = zombie.lastAttackTime;
        let summonTimer = zombie.summonTimer;
        let shootTimer = zombie.shootTimer;
        let newHp = zombie.hp;
        let newIsInvulnerable = zombie.isInvulnerable;

        if (zombie.type === ZombieType.MEGA_BOSS) {
            const minionStatues = buildings.filter(b => b.type === 'minion_statue');
            newIsInvulnerable = minionStatues.length > 0;
            
            if (newIsInvulnerable) {
                // Heal while invulnerable
                if (zombie.hp < zombie.maxHp) {
                    newHp = Math.min(zombie.maxHp, zombie.hp + (dt * 0.1)); // Slow regen
                }
                
                // Summoning Logic
                summonTimer = (summonTimer || 0) - dt;
                if (summonTimer <= 0) {
                    summonTimer = 5000; // Summon every 5 seconds
                    for(let i=0; i<3; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 150 + Math.random() * 100;
                        const spawnX = zombie.x + Math.cos(angle) * dist;
                        const spawnY = zombie.y + Math.sin(angle) * dist;
                        spawnZombie(ZombieType.NORMAL, spawnX, spawnY);
                    }
                    playSound(SOUNDS.ZOMBIE_GROAN);
                }
            } else {
                // Phase 2: Vulnerable, Shooting
                newState = ZombieState.PURSUING;
                newTargetX = player.x;
                newTargetY = player.y;
                
                shootTimer = (shootTimer || 0) - dt;
                if (shootTimer <= 0) {
                    shootTimer = 2000;
                    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);
                    setProjectiles(ps => [...ps, {
                        id: `boss_proj_${Date.now()}`,
                        x: zombie.x, y: zombie.y,
                        vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8,
                        damage: ZOMBIE_STATS.MEGA_BOSS.projectileDamage || 20,
                        owner: 'enemy',
                        lifespan: 3000,
                        size: 20
                    }]);
                }
                
                // Move slowly towards player
                const angle = Math.atan2(newTargetY - zombie.y, newTargetX - zombie.x);
                newX += Math.cos(angle) * (zombie.speed * speedMultiplier * 0.5); // Slower movement
                newY += Math.sin(angle) * (zombie.speed * speedMultiplier * 0.5);
            }
            
            return { ...zombie, x: newX, y: newY, hp: newHp, isInvulnerable: newIsInvulnerable, summonTimer, shootTimer, state: newState, targetX: newTargetX, targetY: newTargetY };
        }

        if (zombie.isBoss && zombie.hp < zombie.maxHp * 0.5) {
             zombie.shieldActive = true;
        }

        const distToPlayer = Math.hypot(player.x - zombie.x, player.y - zombie.y);

        if (distToPlayer < ZOMBIE_DETECTION_RADIUS || zombie.type === ZombieType.RUBY || zombie.isBoss) {
             newState = ZombieState.PURSUING;
             newTargetX = player.x;
             newTargetY = player.y;
        } else if (newState === ZombieState.PURSUING && distToPlayer > ZOMBIE_DETECTION_RADIUS * 1.5) {
             newState = ZombieState.WANDERING;
        }

        if (newState === ZombieState.WANDERING) {
            if (newStateTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 200;
                newTargetX = zombie.x + Math.cos(angle) * dist;
                newTargetY = zombie.y + Math.sin(angle) * dist;
                newStateTimer = 2000 + Math.random() * 3000;
            }
        }

        const angle = Math.atan2(newTargetY - zombie.y, newTargetX - zombie.x);
        let speed = zombie.speed * speedMultiplier;
        
        if (distToPlayer > player.size/2 + zombie.size/2 || newState !== ZombieState.PURSUING) {
             newX += Math.cos(angle) * speed;
             newY += Math.sin(angle) * speed;
        }

        if (newState === ZombieState.PURSUING && distToPlayer < player.size + zombie.size && Date.now() - lastAttackTime > zombie.attackCooldown) {
             if (!creativeMode && !invisible) {
                 takeDamage(zombie.damage, zombie);
                 lastAttackTime = Date.now();
                 playSound(SOUNDS.ZOMBIE_ATTACK);
             }
        }

        return { ...zombie, x: newX, y: newY, state: newState, targetX: newTargetX, targetY: newTargetY, stateTimer: newStateTimer, lastAttackTime };
    }));

    // Update Animals
    setAnimals(prev => prev.map(a => {
        let { x, y, vx, vy, changeDirectionTimer, state, targetId, lastAttackTime } = a;
        let speed = a.speed * speedMultiplier;

        // Wake up Polar Bear logic
        if (a.type === AnimalType.POLAR_BEAR && state === 'SLEEPING') {
            const dist = Math.hypot(player.x - x, player.y - y);
            if (dist < 150) { // Wake radius
                state = 'ATTACKING';
                playSound(SOUNDS.ZOMBIE_GROAN); // Reuse groan as roar for now
            }
        }

        if (a.type === AnimalType.PENGUIN && a.ownerId === player.id) {
             if (state === 'TAMED_FOLLOWING') {
                 const dist = Math.hypot(player.x - x, player.y - y);
                 if (dist > 100) {
                     const angle = Math.atan2(player.y - y, player.x - x);
                     x += Math.cos(angle) * speed;
                     y += Math.sin(angle) * speed;
                 }
             }
        } else if (state === 'ATTACKING' || state === 'ANGRY') {
             const distToPlayer = Math.hypot(player.x - x, player.y - y);
             const angle = Math.atan2(player.y - y, player.x - x);
             x += Math.cos(angle) * speed;
             y += Math.sin(angle) * speed;

             if (distToPlayer < player.size + a.size && Date.now() - (lastAttackTime || 0) > 1000) {
                 if (!creativeMode && !invisible) {
                     const dmg = (a.type === AnimalType.SCORPION ? 5 : a.type === AnimalType.POLAR_BEAR ? 20 : 2);
                     takeDamage(dmg, a);
                     lastAttackTime = Date.now();
                 }
             }
        } else if (state === 'WANDERING') {
            changeDirectionTimer -= dt;
            if (changeDirectionTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                vx = Math.cos(angle) * speed;
                vy = Math.sin(angle) * speed;
                changeDirectionTimer = 2000 + Math.random() * 3000;
            }
            x += vx;
            y += vy;
        }
        
        return { ...a, x, y, vx, vy, changeDirectionTimer, lastAttackTime, state };
    }));

    // Update Dogs
    setDogs(prev => prev.map(d => {
        let { x, y, state, targetId, stateTimer, lastAttackTime, vx, vy } = d;
        let speed = d.speed * speedMultiplier;

        if (state === DogState.SITTING) return d;

        let targetX = x;
        let targetY = y;
        let shouldMove = false;

        if (state === DogState.FOLLOWING && d.ownerId === player.id) {
            const dist = Math.hypot(player.x - x, player.y - y);
            if (dist > 100) {
                targetX = player.x;
                targetY = player.y;
                shouldMove = true;
            }
        } else if (state === DogState.WILD) {
             stateTimer -= dt;
             if (stateTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                vx = Math.cos(angle) * speed * 0.5;
                vy = Math.sin(angle) * speed * 0.5;
                stateTimer = 2000 + Math.random() * 3000;
             }
             x += vx;
             y += vy;
             return { ...d, x, y, stateTimer, vx, vy };
        }

        if (shouldMove) {
            const angle = Math.atan2(targetY - y, targetX - x);
            x += Math.cos(angle) * speed;
            y += Math.sin(angle) * speed;
        }

        return { ...d, x, y, state, lastAttackTime };
    }));

    // Update Projectiles
    setProjectiles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx * speedMultiplier,
        y: p.y + p.vy * speedMultiplier,
        lifespan: p.lifespan - dt
    })).filter(p => {
        // Player damage from enemy projectiles
        if (p.owner === 'enemy') {
            if (Math.hypot(p.x - player.x, p.y - player.y) < player.size/2 + p.size/2) {
                takeDamage(p.damage);
                return false;
            }
        }
        return p.lifespan > 0;
    }));

    // Update Furnaces
    setBuildings(prev => prev.map(b => {
        if (b.type === 'furnace' && b.inventory) {
            let newB = { ...b };
            let fuelSlot = newB.inventory[1];
            let inputSlot = newB.inventory[0];
            let outputSlot = newB.inventory[2];
            
            if (newB.fuelLeft && newB.fuelLeft > 0) {
                newB.fuelLeft -= dt;
            }
            
            if ((!newB.fuelLeft || newB.fuelLeft <= 0) && fuelSlot.item && inputSlot.item) {
                 const fuelTime = FUEL_DURATION[fuelSlot.item.id] || (fuelSlot.item.type === 'fuel' ? (fuelSlot.item.fuelTime || 10000) : 0);
                 if (fuelTime > 0) {
                     newB.fuelLeft = fuelTime;
                     if(fuelSlot.item.quantity > 1) fuelSlot.item.quantity--;
                     else fuelSlot.item = null;
                 }
            }

            if (newB.fuelLeft && newB.fuelLeft > 0 && inputSlot.item) {
                const resultId = inputSlot.item.smeltResult || (inputSlot.item.id === 'sand' ? 'glass' : inputSlot.item.id.replace('_ore', '_ingot'));
                if (ITEMS[resultId]) {
                     newB.smeltProgress = (newB.smeltProgress || 0) + dt;
                     if (newB.smeltProgress >= SMELT_TIME) {
                         newB.smeltProgress = 0;
                         if (inputSlot.item.quantity > 1) inputSlot.item.quantity--;
                         else inputSlot.item = null;
                         
                         const resultItem = ITEMS[resultId];
                         if (outputSlot.item) {
                             if (outputSlot.item.id === resultId && outputSlot.item.quantity < outputSlot.item.maxStack) {
                                 outputSlot.item.quantity++;
                             }
                         } else {
                             outputSlot.item = { ...resultItem, quantity: 1 };
                         }
                         playSound(SOUNDS.FURNACE_POP);
                     }
                }
            } else {
                newB.smeltProgress = 0;
            }
            return newB;
        }
        return b;
    }));

    setDestroyedResources(prev => {
        const stillRespawning: ResourceNode[] = [];
        const newlyRespawned: ResourceNode[] = [];
        prev.forEach(res => {
            res.respawnTimer -= dt;
            if (res.respawnTimer <= 0) {
                newlyRespawned.push({ ...res, hp: res.maxHp, respawnTimer: 0 });
            } else {
                stillRespawning.push(res);
            }
        });
        if (newlyRespawned.length > 0) {
            setResources(r => [...r, ...newlyRespawned]);
        }
        return stillRespawning;
    });
    
    if (player.dimension === 'OVERWORLD') {
        const hasRubyPortal = portals.some(p => p.targetDimension === 'RUBY');
        const hasCavernPortal = portals.some(p => p.targetDimension === 'CAVERN');
        const newPortals = [];

        if (!hasRubyPortal) {
             const x = WORLD_WIDTH / 2;
             const y = WORLD_HEIGHT / 2 - 200;
             newPortals.push({
                 id: `portal_to_ruby_${Date.now()}`,
                 x,
                 y,
                 size: TILE_SIZE * 3,
                 sizeX: TILE_SIZE * 1.5,
                 sizeY: TILE_SIZE * 3,
                 type: 'portal',
                 inventory: Array.from({ length: PORTAL_INVENTORY_SLOTS }, () => ({ item: null })),
                 isActive: false, 
                 targetDimension: 'RUBY'
             });
        }
        if (!hasCavernPortal) {
             const x = WORLD_WIDTH / 2 - 100;
             const y = WORLD_HEIGHT / 2 - 200;
             newPortals.push({
                 id: `portal_to_cavern_${Date.now()}`,
                 x,
                 y,
                 size: TILE_SIZE * 3,
                 sizeX: TILE_SIZE * 1.5,
                 sizeY: TILE_SIZE * 3,
                 type: 'portal',
                 inventory: Array.from({ length: 0 }, () => ({ item: null })), 
                 isActive: true, 
                 targetDimension: 'CAVERN'
             });
        }
        if (newPortals.length > 0) {
            setPortals(ps => [...ps, ...newPortals]);
        }
    }

    if (player.dimension === 'RUBY') {
        if (Math.random() < 0.5) {
            const particleCamera = {
                x: player.x - window.innerWidth / 2,
                y: player.y - window.innerHeight / 2
            };
            const spawnX = particleCamera.x + Math.random() * window.innerWidth;
            const spawnY = particleCamera.y + Math.random() * window.innerHeight;
            const lifespan = Math.random() * 3000 + 2000;
            const size = Math.random() * 3 + 1;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.5 + 0.1;
            
            setParticles(ps => [
                ...ps,
                {
                    id: `particle_${Date.now()}_${Math.random()}`,
                    x: spawnX,
                    y: spawnY,
                    size,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    lifespan,
                    maxLifespan: lifespan,
                    color: ['#E0115F', '#DC143C', '#FFC0CB'][Math.floor(Math.random() * 3)],
                }
            ]);
        }
    }
    
    setParticles(ps => ps.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        lifespan: p.lifespan - dt,
    })).filter(p => p.lifespan > 0));


    if (player.dimension !== 'OVERWORLD') {
        const returnPortal = portals.find(p => p.targetDimension === 'OVERWORLD');
        if (returnPortal) {
            const portalWidth = returnPortal.sizeX || returnPortal.size;
            const portalHeight = returnPortal.sizeY || returnPortal.size;
            const isNear = player.x > returnPortal.x - portalWidth / 2 &&
                           player.x < returnPortal.x + portalWidth / 2 &&
                           player.y > returnPortal.y - portalHeight / 2 &&
                           player.y < returnPortal.y + portalHeight / 2;
            setIsNearReturnPortal(isNear);
        } else {
            setIsNearReturnPortal(false);
        }
    } else {
         setIsNearReturnPortal(false);
    }


    if (player.dimension === 'RUBY' && !creativeMode && zombies.filter(z => z.type === ZombieType.RUBY).length < 20) {
        if (Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 500;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            const stats = ZOMBIE_STATS.RUBY;
             setZombies(zs => [...zs, {
                id: `zombie_ruby_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
                type: ZombieType.RUBY, targetId: 1, isBoss: false, attackCooldown: 1000, lastAttackTime: 0,
                state: ZombieState.PURSUING, targetX: x, targetY: y, stateTimer: 0,
            }]);
             playSound(SOUNDS.ZOMBIE_GROAN, { volume: 0.3 });
        }
    }
    else if (isNight && !creativeMode && player.dimension === 'OVERWORLD') {
        const spawnMultiplier = isBloodMoon ? 5 : 1;
        if (Math.random() < (0.02 * (1 + day / 10)) * spawnMultiplier) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 500;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            const biome = getBiomeAt(x, y);
            if (biome === Biome.WATER || biome === Biome.OCEAN) return;

            let type: ZombieType = ZombieType.NORMAL;

            switch(biome) {
                case Biome.DESERT: type = ZombieType.DESERT; break;
                case Biome.SNOW: type = ZombieType.SNOW; break;
                case Biome.FOREST: type = ZombieType.FOREST; break;
                case Biome.LAVA: type = ZombieType.LAVA; break;
                case Biome.SWAMP: type = ZombieType.SWAMP; break;
                case Biome.PLAINS: type = ZombieType.NORMAL; break;
            }

            const rand = Math.random();
             if (biome !== Biome.LAVA) { 
                if (rand > 1 - (ZOMBIE_STATS.IMMORTAL.spawnChance || 0)) {
                    type = ZombieType.IMMORTAL;
                } else if (rand > 1 - ((ZOMBIE_STATS.IMMORTAL.spawnChance || 0) + (ZOMBIE_STATS.GIANT.spawnChance || 0))) {
                    type = ZombieType.GIANT;
                }
            }
            
            const stats = ZOMBIE_STATS[ZombieType[type] as keyof typeof ZOMBIE_STATS] || ZOMBIE_STATS.NORMAL;
            
            setZombies(zs => [...zs, {
                id: `zombie_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
                type, targetId: null, isBoss: false, attackCooldown: 1000, lastAttackTime: 0,
                state: ZombieState.WANDERING, targetX: x, targetY: y, stateTimer: 0,
            }]);
            playSound(SOUNDS.ZOMBIE_GROAN, { volume: 0.3 });
        }
    }
    if (day === 100 && player.dimension === 'OVERWORLD' && !creativeMode && !zombies.some(z => z.isBoss)) {
        const stats = ZOMBIE_STATS.BOSS;
        setZombies(zs => [...zs, {
            id: `zombie_boss_${Date.now()}`, x: player.x + 800, y: player.y, size: stats.size,
            hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
            type: ZombieType.BOSS, targetId: 1, isBoss: true, attackCooldown: 2000, lastAttackTime: 0,
            state: ZombieState.PURSUING, targetX: player.x, targetY: player.y, stateTimer: 0
        }]);
         playSound(SOUNDS.ZOMBIE_GROAN, { volume: 0.8 });
    }

    if (animals.length < 60 && player.dimension === 'OVERWORLD') {
        if (isNight && Math.random() < 0.02) {
             const angle = Math.random() * Math.PI * 2;
             const distance = window.innerWidth / 2 + Math.random() * 500;
             const x = player.x + Math.cos(angle) * distance;
             const y = player.y + Math.sin(angle) * distance;
             if (getBiomeAt(x, y) === Biome.DESERT) {
                 const stats = ANIMAL_STATS.SCORPION;
                 setAnimals(as => [...as, {
                    id: `scorpion_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                    hp: stats.hp, maxHp: stats.hp, speed: stats.speed, type: AnimalType.SCORPION, vx: 0, vy: 0, changeDirectionTimer: 0,
                    state: 'ATTACKING', targetId: 1
                 }]);
             }
        }

        if (!isNight && Math.random() < 0.01) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 500;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            const biome = getBiomeAt(x, y);
            
            if (biome === Biome.LAVA || biome === Biome.OCEAN) return;

            const rand = Math.random();
            let type: AnimalType;
            let stats;

            if (biome === Biome.SNOW) {
                if (rand < 0.5) type = AnimalType.POLAR_BEAR;
                else type = AnimalType.PENGUIN;
            } else {
                if (rand < 0.3) type = AnimalType.PIG;
                else if (rand < 0.6) type = AnimalType.SHEEP;
                else if (rand < 0.85) type = AnimalType.CHICKEN;
                else type = AnimalType.COW;
            }
            
            stats = ANIMAL_STATS[AnimalType[type] as keyof typeof ANIMAL_STATS];
            
            setAnimals(as => [...as, {
                id: `animal_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                hp: stats.hp, maxHp: stats.hp, speed: stats.speed, type, vx: 0, vy: 0, changeDirectionTimer: 0,
                state: type === AnimalType.POLAR_BEAR ? 'SLEEPING' : 'WANDERING',
                huntCount: 0
            }]);
        }
    }

    if (dogs.filter(d => d.state === DogState.WILD).length < 5 && player.dimension === 'OVERWORLD') {
        if (Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 800;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            if (getBiomeAt(x, y) === Biome.FOREST) {
                 setDogs(ds => [...ds, {
                    id: `dog_${Date.now()}_${Math.random()}`, x, y,
                    size: DOG_STATS.size, hp: DOG_STATS.hp, maxHp: DOG_STATS.hp,
                    speed: DOG_STATS.speed / 2, 
                    state: DogState.WILD, name: null, ownerId: null,
                    vx: 0, vy: 0, stateTimer: 0, targetId: null, lastAttackTime: 0
                 }]);
            }
        }
    }
    
    // Update Player
    setPlayer(p => {
        let newX = p.x;
        let newY = p.y;
        let newHp = p.hp;
        let newSlowEffect = p.slowEffect;

        newX += p.vx * speedMultiplier;
        newY += p.vy * speedMultiplier;
        let newVx = p.vx * 0.95;
        let newVy = p.vy * 0.95;
        if (Math.abs(newVx) < 0.1) newVx = 0;
        if (Math.abs(newVy) < 0.1) newVy = 0;


        if (newSlowEffect && Date.now() > newSlowEffect.endTime) {
            newSlowEffect = undefined;
        }

        if (!creativeMode && Date.now() - p.lastDamageTime > 10000 && p.hp < p.maxHp) {
            newHp = Math.min(p.maxHp, p.hp + (10 / 10000) * dt); 
        }
        
        const isSprinting = keysPressed['shift'] && p.stamina > 0 && p.energy > 0;
        
        const holdingCar = p.inventory[p.activeSlot]?.item?.id === 'car' || p.offHand.item?.id === 'car';
        let currentSpeed = (isSprinting || (creativeMode && noclip)) ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
        if (holdingCar) {
            currentSpeed = PLAYER_SPRINT_SPEED * 1.5;
        }
        
        if (newSlowEffect) {
            currentSpeed *= newSlowEffect.factor;
        }

        const playerBiome = getBiomeAt(p.x, p.y, p.dimension);
        if (playerBiome !== currentBiome) {
            setCurrentBiome(playerBiome);
        }

        if ((playerBiome === Biome.WATER || playerBiome === Biome.SWAMP) && !holdingCar) {
            currentSpeed *= 0.6; 
        }

        let stamina = p.stamina;
        let energy = p.energy;
        let moved = false;
        
        const moveAmount = currentSpeed * speedMultiplier;
        if (keysPressed['w']) { newY -= moveAmount; moved = true; }
        if (keysPressed['s']) { newY += moveAmount; moved = true; }
        if (keysPressed['a']) { newX -= moveAmount; moved = true; }
        if (keysPressed['d']) { newX += moveAmount; moved = true; }

        if (holdingCar && moved) {
             const carRadius = p.size;
             setResources(res => res.filter(r => {
                 if (Math.hypot(newX - r.x, newY - r.y) < carRadius + r.size/2) {
                     setItemDrops(d => [...d, { id: `drop_car_${r.type}_${Date.now()}`, x: r.x, y: r.y, size: 20, item: ITEMS[r.type.toLowerCase()] }]);
                     return false;
                 }
                 return true;
             }));
        }

        if (moved && !holdingCar) {
            const now = Date.now();
            if (now - lastFootstepTime.current > (p.sprinting ? 350 : 500)) {
                lastFootstepTime.current = now;
                let footstepSound = SOUNDS.PLAYER_FOOTSTEP_GRASS;
                switch (playerBiome) {
                    case Biome.WATER: case Biome.SWAMP: footstepSound = SOUNDS.PLAYER_SWIM; break;
                    case Biome.DESERT: case Biome.BEACH: footstepSound = SOUNDS.PLAYER_FOOTSTEP_SAND; break;
                    case Biome.SNOW: footstepSound = SOUNDS.PLAYER_FOOTSTEP_SNOW; break;
                    case Biome.RUBY: case Biome.RUBY_DARK: case Biome.RUBY_LIGHT: case Biome.LAVA: case Biome.CAVERN: footstepSound = SOUNDS.PLAYER_FOOTSTEP_STONE; break;
                }
                playSound(footstepSound, { volume: 0.3 });
            }
        }


        let lavaDamageTimer = p.lavaDamageTimer;
        let lastDamageTime = p.lastDamageTime;
        if (playerBiome === Biome.LAVA && !creativeMode) {
            lavaDamageTimer += dt;
            if (lavaDamageTimer > LAVA_DAMAGE_THRESHOLD_MS) {
                newHp = Math.max(0, newHp - (LAVA_DAMAGE_PER_SECOND * (dt / 1000)));
                lastDamageTime = Date.now();
                 if (newHp <= 0) {
                    setGameState(GameState.GAME_OVER);
                 } else {
                     playSound(SOUNDS.PLAYER_HURT, { volume: 0.5 });
                 }
            }
        } else {
            lavaDamageTimer = 0;
        }

        let lastEnergyDamageTime = p.lastEnergyDamageTime;
        if (creativeMode) {
            stamina = PLAYER_MAX_STAMINA;
            energy = PLAYER_MAX_ENERGY;
        } else {
            if (isSprinting && moved) {
                stamina = Math.max(0, stamina - STAMINA_DRAIN_RATE * speedMultiplier);
                energy = Math.max(0, energy - ENERGY_DRAIN_RATE * speedMultiplier);
            } else {
                stamina = Math.min(PLAYER_MAX_STAMINA, stamina + STAMINA_REGEN_RATE * speedMultiplier);
            }

            if (energy <= 0 && Date.now() - lastEnergyDamageTime > 2000) {
                takeDamage(ENERGY_DAMAGE_AMOUNT);
                lastEnergyDamageTime = Date.now();
            }
        }
        
        if (!noclip) {
            const solidBuildings = buildings.filter(b => !b.isOpen);
            const solidDogs = dogs.filter(d => d.state === DogState.SITTING);
            const collisionObjects = [...solidBuildings, ...resources, ...portals, ...npcs, ...solidDogs];
            let playerRect = { x: newX - p.size/2, y: p.y - p.size/2, width: p.size, height: p.size };
            if (checkCollision(playerRect, collisionObjects)) {
                newX = p.x + p.vx * speedMultiplier; 
                newVx = 0; 
            }
            
            playerRect = { x: p.x - p.size/2, y: newY - p.size/2, width: p.size, height: p.size };
             if (checkCollision(playerRect, collisionObjects)) {
                newY = p.y + p.vy * speedMultiplier; 
                newVy = 0; 
            }
        }
        
        setItemDrops(drops => {
            const remainingDrops = [];
            for (const drop of drops) {
                const dist = Math.hypot(newX - drop.x, newY - drop.y);
                if (dist < p.size / 2 + drop.size / 2) {
                    addToInventory(drop.item);
                } else {
                    remainingDrops.push(drop);
                }
            }
            return remainingDrops;
        });
        
        return { ...p, x: Math.max(0, Math.min(WORLD_WIDTH, newX)), y: Math.max(0, Math.min(WORLD_HEIGHT, newY)), sprinting: isSprinting, stamina, energy, lavaDamageTimer, hp: newHp, lastDamageTime, lastEnergyDamageTime, slowEffect: newSlowEffect, vx: newVx, vy: newVy };
    });

    if (keysPressed['e']) {
        let closestInteractable: ResourceNode | Building | Portal | NPC | Dog | Animal | null = null;
        let minDistance = 100;

        const interactables: (ResourceNode | Building | Portal | NPC | Dog | Animal)[] = [...resources, ...buildings, ...portals, ...npcs, ...dogs, ...animals.filter(a => a.type === AnimalType.PENGUIN)];

        interactables.forEach(res => {
            const dist = Math.hypot(player.x - res.x, player.y - res.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestInteractable = res;
            }
        });

        const activeItem = player.inventory[player.activeSlot]?.item;

        if (activeItem?.id === 'rocket') {
            handleExplosion(player.x, player.y, 80, 0, false); 
             for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                setParticles(ps => [...ps, {
                    id: `firework_${Date.now()}_${Math.random()}`,
                    x: player.x, y: player.y, size: Math.random() * 4 + 2,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    lifespan: 1000, maxLifespan: 1000,
                    color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][Math.floor(Math.random() * 5)]
                }]);
            }
            setPlayer(p => {
                const newInv = [...p.inventory];
                if(newInv[p.activeSlot].item) newInv[p.activeSlot].item!.quantity--;
                if(newInv[p.activeSlot].item!.quantity<=0) newInv[p.activeSlot].item = null;
                return {...p, inventory: newInv};
            });
            keysPressed['e'] = false;
            return;
        }

        if (closestInteractable) {
            let instantActionTaken = false;

            if ('type' in closestInteractable) {
                const interactable = closestInteractable as Building | Portal | Animal | NPC; 
                 if (interactable.type === AnimalType.PENGUIN) {
                     const penguin = interactable as Animal;
                     if (penguin.ownerId === player.id) {
                         if (penguin.state === 'TAMED_IDLE' || penguin.state === 'TAMED_FOLLOWING' || penguin.state === 'SITTING') {
                             setAnimals(as => as.map(a => a.id === penguin.id ? {...a, state: 'HUNTING'} : a));
                             instantActionTaken = true;
                         } else if (penguin.state === 'HUNTING') {
                             setAnimals(as => as.map(a => a.id === penguin.id ? {...a, state: 'SITTING'} : a));
                             instantActionTaken = true;
                         }
                     } else if (activeItem?.id !== 'cherry' && activeItem?.id !== 'fish') {
                         setAnimals(as => as.map(a => a.id === penguin.id ? {...a, state: 'ANGRY'} : a));
                         instantActionTaken = true;
                     }
                 } else if (typeof interactable.type === 'string' && (interactable.type === 'door' || interactable.type === 'furniture')) {
                    if (interactable.type === 'door') {
                        setBuildings(bs => bs.map(b => b.id === interactable.id ? { ...b, isOpen: !b.isOpen } : b));
                        playSound((interactable as Building).isOpen ? SOUNDS.DOOR_CLOSE : SOUNDS.DOOR_OPEN);
                        instantActionTaken = true;
                    }
                } else if (typeof interactable.type === 'string' && interactable.type === 'tnt') {
                    handleExplosion(interactable.x, interactable.y, TNT_RADIUS, TNT_DAMAGE, true);
                    setBuildings(bs => bs.filter(b => b.id !== interactable.id));
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'workbench' && !collectingState) {
                    setGameState(GameState.WORKBENCH);
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'enchanting_table' && !collectingState) {
                    setActiveEnchantingTable(interactable as Building);
                    setGameState(GameState.ENCHANTING);
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'chest' && !collectingState) {
                    setActiveChest(interactable as Building);
                    setGameState(GameState.CHEST_UI);
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'furnace' && !collectingState) {
                    setActiveFurnace(interactable as Building);
                    setGameState(GameState.FURNACE);
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'bed') {
                    if (isNight && !isBloodMoon) {
                        setShowSleepConfirm(true);
                    }
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'portal') {
                    const portal = interactable as Portal;
                    if(portal.targetDimension === 'RUBY'){
                        setActivePortal(portal);
                        setGameState(GameState.PORTAL_UI);
                    } else if (portal.targetDimension === 'CAVERN') {
                        setActivePortal(portal);
                        setGameState(GameState.CAVERN_CONFIRM);
                    } else { 
                        if (player.dimension === 'CAVERN') {
                            setActivePortal(portal);
                            setGameState(GameState.CAVERN_CONFIRM);
                        } else {
                            returnToOverworld();
                        }
                    }
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'string' && interactable.type === 'mysterious_statue') {
                    // Destroy statue and spawn Mega Boss
                    setBuildings(bs => bs.filter(b => b.id !== interactable.id));
                    playSound(SOUNDS.EXPLOSION);
                    
                    const bossStats = ZOMBIE_STATS.MEGA_BOSS;
                    setZombies(zs => [...zs, {
                        id: `mega_boss_${Date.now()}`,
                        x: interactable.x,
                        y: interactable.y,
                        size: bossStats.size,
                        hp: bossStats.hp,
                        maxHp: bossStats.hp,
                        damage: bossStats.damage,
                        speed: bossStats.speed,
                        type: ZombieType.MEGA_BOSS,
                        targetId: player.id,
                        isBoss: true,
                        attackCooldown: 1000,
                        lastAttackTime: 0,
                        state: ZombieState.INVESTIGATING,
                        targetX: interactable.x,
                        targetY: interactable.y,
                        stateTimer: 0,
                        isInvulnerable: true,
                        summonTimer: 2000,
                        shootTimer: 2000
                    }]);

                    // Spawn Minion Statues
                    setBuildings(bs => [
                        ...bs,
                        {
                            id: `minion_statue_1_${Date.now()}`,
                            x: interactable.x - 300,
                            y: interactable.y + 100,
                            size: TILE_SIZE * 1.5,
                            type: 'minion_statue',
                            material: 'minion_statue',
                            hp: 1000,
                            maxHp: 1000
                        },
                        {
                            id: `minion_statue_2_${Date.now()}`,
                            x: interactable.x + 300,
                            y: interactable.y + 100,
                            size: TILE_SIZE * 1.5,
                            type: 'minion_statue',
                            material: 'minion_statue',
                            hp: 1000,
                            maxHp: 1000
                        }
                    ]);
                    instantActionTaken = true;
                } else if (interactable.type === NPCType.VENDOR || interactable.type === NPCType.QUEST_GIVER) { 
                    const npc = interactable as NPC;
                    setActiveNPC(npc);
                    if (npc.type === NPCType.QUEST_GIVER) {
                        setGameState(GameState.QUEST_UI);
                    } else if (npc.type === NPCType.VENDOR) {
                        setGameState(GameState.VENDOR_SHOP);
                    }
                    instantActionTaken = true;
                }
            } else if ('ownerId' in closestInteractable) { 
                const dog = closestInteractable as Dog;
                if (dog.ownerId === player.id) { 
                    
                    setDogs(ds => ds.map(d => d.id === dog.id ? { 
                        ...d, 
                        state: (d.state === DogState.SITTING ? DogState.FOLLOWING : DogState.SITTING) 
                    } : d));
                    playSound(SOUNDS.DOG_BARK, { volume: 0.5 });
                    instantActionTaken = true;
                }
            }

            if (instantActionTaken) {
                keysPressed['e'] = false; 
            }

            if (keysPressed['e']) {
                if ('ownerId' in closestInteractable) { 
                    const dog = closestInteractable as Dog;
                    if (dog.state === DogState.WILD && (activeItem?.id === 'food' || activeItem?.id === 'cooked_meat')) {
                        if (!tamingState || tamingState.dogId !== dog.id) {
                            setTamingState({ dogId: dog.id, progress: 0 });
                        } else {
                            const newProgress = tamingState.progress + dt / DOG_STATS.tamingTime;
                            if (newProgress >= 1) {
                                setDogs(ds => ds.map(d => d.id === dog.id ? { ...d, ownerId: player.id, state: DogState.FOLLOWING, hp: d.maxHp, speed: DOG_STATS.speed } : d));
                                setDogBeingNamed(dog);
                                setGameState(GameState.NAMING_PET);
                                setTamingState(null);
                            } else {
                                setTamingState({ ...tamingState, progress: newProgress });
                            }
                        }
                    }
                } else if ('changeDirectionTimer' in closestInteractable && closestInteractable.type === AnimalType.PENGUIN) {
                    const penguin = closestInteractable as Animal;
                    if (!penguin.ownerId && (activeItem?.id === 'cherry' || activeItem?.id === 'fish')) {
                         if (!tamingState || tamingState.animalId !== penguin.id) {
                            setTamingState({ animalId: penguin.id, progress: 0 });
                        } else {
                            const newProgress = tamingState.progress + dt / 3000; 
                            if (newProgress >= 1) {
                                setAnimals(as => as.map(a => a.id === penguin.id ? { ...a, ownerId: player.id, state: 'TAMED_IDLE' } : a));
                                setPlayer(p => {
                                    const newInv = [...p.inventory];
                                    if(newInv[p.activeSlot].item) newInv[p.activeSlot].item!.quantity--;
                                    if(newInv[p.activeSlot].item!.quantity<=0) newInv[p.activeSlot].item = null;
                                    return {...p, inventory: newInv};
                                });
                                setDogBeingNamed(penguin as unknown as Dog); 
                                setGameState(GameState.NAMING_PET);
                                setTamingState(null);
                            } else {
                                setTamingState({ ...tamingState, progress: newProgress });
                            }
                        }
                    }
                } else { 
                    const closestNode = closestInteractable;
                    if (creativeMode) {
                        if ('type' in closestNode && ['workbench', 'chest', 'furnace', 'enchanting_table'].includes(closestNode.type as string)) {
                            setBuildings(b => b.filter(b => b.id !== closestNode!.id));
                            playSound(SOUNDS.COLLECT_WOOD);
                            const building = closestNode as Building;
                            addToInventory(ITEMS[building.type], 1);
                        } else {
                            if ('respawnTimer' in closestNode) {
                                const nodeToDestroy = closestNode as ResourceNode;
                                setResources(res => res.filter(r => r.id !== nodeToDestroy.id));
                                if (nodeToDestroy.type === ResourceType.WOOD) playSound(SOUNDS.COLLECT_WOOD); else playSound(SOUNDS.COLLECT_STONE);
                                const collectedItem = ITEMS[nodeToDestroy.type.toLowerCase()];
                                if(collectedItem) addToInventory(collectedItem, 1);
                            }
                        }
                        return;
                    }
                    
                    let baseTime = 5000;
                    let collectSpeedMultiplier = 1;
                    let canCollect = false;
                    let itemToGive: Item | null = null;
                    let amountToGive = 1;

                    if ('respawnTimer' in closestNode) { 
                        const node = closestNode as ResourceNode;
                        
                        const dropId = node.type === ResourceType.IRON ? 'iron_ore' : 
                                       node.type === ResourceType.GOLD ? 'gold_ore' : 
                                       node.type === ResourceType.COPPER ? 'copper_ore' : 
                                       node.type === ResourceType.SILVINITA ? 'silvinita_ore' :
                                       node.type === ResourceType.ASTRILITA ? 'astrilita_ore' :
                                       node.type === ResourceType.SWAMP_BUSH ? 'dirty_berry' :
                                       node.type === ResourceType.AUTUMN_BUSH ? 'orange_berry' :
                                       node.type === ResourceType.RUBY_WOOD ? 'ruby_wood' :
                                       node.type.toLowerCase();
                        itemToGive = ITEMS[dropId];
                        
                        amountToGive = 1;
                        if (node.type === ResourceType.WOOD) amountToGive = 2;
                        if (node.type === ResourceType.WOOD && currentBiome === Biome.SWAMP) {
                             amountToGive = 4;
                        }

                        const activeTool = player.tool;
                        let currentTier = ToolTier.HAND;
                        
                        if (activeTool?.type === 'tool' && activeTool.toolType) {
                             if ((node.type === ResourceType.WOOD || node.type === ResourceType.RUBY_WOOD) && activeTool.toolType === 'axe') {
                                currentTier = activeTool.tier;
                                collectSpeedMultiplier = activeTool.collectSpeed ?? 1;
                            } else if (node.type !== ResourceType.WOOD && node.type !== ResourceType.RUBY_WOOD && activeTool.toolType === 'pickaxe') {
                                currentTier = activeTool.tier;
                                collectSpeedMultiplier = activeTool.collectSpeed ?? 1;
                                const efficiency = activeTool.enchantments?.find(e => e.type === Enchantment.EFFICIENCY);
                                if (efficiency) {
                                    collectSpeedMultiplier *= (1 + efficiency.level * 0.2);
                                }
                            }
                        }
                        const requiredTier = RESOURCE_DATA[node.type].requiredTier;
                        if (currentTier >= requiredTier) {
                            canCollect = true;
                            baseTime = RESOURCE_DATA[node.type].baseCollectTime;
                        }
                    } else if ('type' in closestNode && typeof closestNode.type === 'string' && closestNode.type !== 'portal') {
                        const b = closestNode as Building;
                        
                        if (b.type === 'mysterious_statue') {
                            canCollect = false; // Handled by 'E' specifically
                        } else if (b.type === 'minion_statue') {
                            // Destroy minion statues to lower boss shield
                            canCollect = true;
                            baseTime = 2000;
                        } else {
                            canCollect = true;
                             if (['workbench', 'chest', 'furnace', 'enchanting_table', 'bed', 'tnt'].includes(b.type)) {
                                itemToGive = ITEMS[b.type as keyof typeof ITEMS];
                            } else if (b.type === 'block') {
                                itemToGive = ITEMS[`${b.material}_block`];
                            } else if (b.type === 'door') {
                                itemToGive = ITEMS[`${b.material}_door`];
                            } else if (b.type === 'furniture' && ITEMS[b.type]) {
                                itemToGive = ITEMS[b.type]; 
                            } else if (ITEMS[b.type] && ITEMS[b.type].type === 'block') {
                                itemToGive = ITEMS[b.type];
                            }
                            baseTime = 3000;
                        }
                    }
                    
                    if (canCollect) {
                        if (!collectingState || collectingState.nodeId !== closestNode.id) {
                            setCollectingState({ nodeId: closestNode.id, progress: 0 });
                        } else {
                            const progressIncrement = (dt / (baseTime / collectSpeedMultiplier));
                            const newProgress = collectingState.progress + progressIncrement;
                            if (newProgress >= 1) {
                                 if(itemToGive) addToInventory(itemToGive, amountToGive);

                                 setPlayer(p => {
                                    const newTool = p.tool ? { ...p.tool } : null;
                                    if(newTool?.durability !== undefined) {
                                        let durabilityLoss = 1;
                                        const unbreaking = newTool.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
                                        if (unbreaking && Math.random() < 1 - (1 / (unbreaking.level + 1))) {
                                            durabilityLoss = 0;
                                        }

                                        if (durabilityLoss > 0) {
                                            newTool.durability -= 1;
                                            if (newTool.durability <= 0) {
                                                playSound(SOUNDS.ITEM_BREAK);
                                                return { ...p, tool: null };
                                            }
                                        }
                                        return { ...p, tool: newTool };
                                    }
                                    return p;
                                 });
                                 
                                 const nodeToDestroy = closestNode;
                                 if ('respawnTimer' in nodeToDestroy) {
                                    if ((nodeToDestroy as ResourceNode).type === ResourceType.WOOD || (nodeToDestroy as ResourceNode).type === ResourceType.RUBY_WOOD) playSound(SOUNDS.COLLECT_WOOD); else playSound(SOUNDS.COLLECT_STONE);
                                    setResources(res => res.filter(r => r.id !== nodeToDestroy.id));
                                    setDestroyedResources(d => [...d, {...(nodeToDestroy as ResourceNode), respawnTimer: RESOURCE_RESPAWN_MS}])
                                 } else if ('type' in nodeToDestroy) {
                                     playSound(SOUNDS.COLLECT_WOOD);
                                     setBuildings(b => b.filter(b => b.id !== nodeToDestroy.id));
                                 }

                                 setCollectingState(null);
                            } else {
                                 setCollectingState(cs => cs ? { ...cs, progress: newProgress } : null);
                            }
                        }
                    } else {
                        setCollectingState(null);
                    }
                }
            }
        } else if (activeItem && (activeItem.type === 'block' || activeItem.type === 'furniture' || ['workbench', 'chest', 'bed', 'furnace', 'enchanting_table', 'tnt'].includes(activeItem.id) || activeItem.id.startsWith('astrilita_'))) {
            const angle = Math.atan2(mousePos.y - window.innerHeight / 2, mousePos.x - window.innerWidth / 2);
            const placementDist = TILE_SIZE * 1.5;
            const targetX = player.x + Math.cos(angle) * placementDist;
            const targetY = player.y + Math.sin(angle) * placementDist;
            
            const gridX = Math.floor(targetX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const gridY = Math.floor(targetY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

            const isOccupied = [...buildings, ...resources].some(obj => obj.x === gridX && obj.y === gridY);
            if (!isOccupied) {
                let material = 'stone';
                if (activeItem.id.includes('wood')) material = 'wood';
                if (activeItem.id.includes('astrilita')) material = 'astrilita';
                if (activeItem.id.includes('copper')) material = 'copper';
                if (activeItem.id.includes('ruby')) material = 'ruby_wood'; 
                
                const maxHp = BLOCK_HP[material] || 20;
                
                let buildType: Building['type'] = 'block';
                if (['workbench', 'chest', 'bed', 'furnace', 'enchanting_table', 'tnt'].includes(activeItem.id)) {
                    buildType = activeItem.id as any;
                } else if (activeItem.type === 'furniture') {
                    buildType = 'furniture';
                }

                playSound(SOUNDS.COLLECT_WOOD);
                const newBuilding: Building = {
                    id: `building_${Date.now()}_${Math.random()}`,
                    x: gridX, y: gridY, size: TILE_SIZE,
                    type: buildType,
                    material: material,
                    hp: maxHp, maxHp: maxHp,
                };
                if (newBuilding.type === 'chest') {
                    newBuilding.inventory = Array.from({ length: CHEST_INVENTORY_SLOTS }, () => ({ item: null }));
                } else if (newBuilding.type === 'furnace') {
                    newBuilding.inventory = Array.from({ length: FURNACE_INVENTORY_SLOTS }, () => ({ item: null }));
                    newBuilding.smeltProgress = 0;
                    newBuilding.fuelLeft = 0;
                }

                setBuildings(b => [...b, newBuilding]);

                setPlayer(p => {
                    const newInventory = [...p.inventory];
                    const currentSlot = newInventory[p.activeSlot];
                    if (currentSlot.item && currentSlot.item.quantity > 1) {
                        currentSlot.item.quantity -= 1;
                    } else {
                        currentSlot.item = null;
                    }
                    return { ...p, inventory: newInventory };
                });
            }
            keysPressed['e'] = false; 
        } else {
            setCollectingState(null);
            setTamingState(null);
        }
    } else {
        setCollectingState(null);
        setTamingState(null);
    }

  }, [gameState, isNight, isBloodMoon, isRaining, day, player, keysPressed, resources, buildings, zombies, animals, npcs, dogs, itemDrops, collectingState, tamingState, addToInventory, creativeMode, invisible, noclip, mousePos, portals, returnToOverworld, currentBiome, takeDamage, initGame, handleExplosion]);

    // ... [handleEatFood, useEffects for recipes and sounds omitted, assumed same] ...
    const handleEatFood = useCallback(() => {
        setPlayer(p => {
            const activeSlotIndex = p.activeSlot;
            const activeSlot = p.inventory[activeSlotIndex];
            const item = activeSlot?.item;

            if (item && (item.type === 'consumable' || item.id === 'food')) {
                playSound(SOUNDS.PLAYER_EAT);
                const consumable = item as Consumable;
                
                let newInventory = [...p.inventory];
                
                if (item.maxDurability) {
                    const newItem = { ...item, durability: (item.durability || 0) - 1 };
                    if (newItem.durability <= 0) {
                         newInventory[activeSlotIndex] = { item: null };
                         playSound(SOUNDS.ITEM_BREAK);
                    } else {
                        newInventory[activeSlotIndex] = { item: newItem };
                    }
                } else {
                    const newItem = { ...item, quantity: item.quantity - 1 };
                    newInventory[activeSlotIndex] = { item: newItem.quantity > 0 ? newItem : null };
                }

                let newHp = p.hp;
                let newStamina = p.stamina;
                let newDiscountEffect = p.discountEffect;

                if (consumable.heals) {
                    newHp = Math.max(0, Math.min(p.maxHp, p.hp + consumable.heals));
                    if (consumable.heals < 0) {
                        playSound(SOUNDS.PLAYER_HURT);
                         if (newHp <= 0) {
                         }
                    }
                }
                if (consumable.stamina) {
                    newStamina = Math.min(p.maxStamina, p.stamina + consumable.stamina);
                }
                
                if (item.id === 'vigor_potion') {
                    newDiscountEffect = {
                        endTime: Date.now() + 180000, 
                        factor: 0.5 
                    };
                }

                return { 
                    ...p, 
                    hp: newHp, 
                    stamina: newStamina,
                    inventory: newInventory, 
                    discountEffect: newDiscountEffect,
                    lastDamageTime: (consumable.heals || 0) < 0 ? Date.now() : p.lastDamageTime 
                };
            }
            return p;
        });
    }, []);

    useEffect(() => {
        const gridItems = player.craftingGrid.map(slot => slot.item?.id || null).filter(Boolean).sort();
        if(gridItems.length === 0) {
            setPlayer(p => p.craftingOutput.item === null ? p : {...p, craftingOutput: { item: null }});
            return;
        };

        const recipeKey = JSON.stringify(gridItems);
        const recipe = INVENTORY_CRAFTING_RECIPES.get(recipeKey);

        setPlayer(p => {
            if (recipe) {
                const newOutputItem = { ...recipe.result, quantity: recipe.quantity };
                if (p.craftingOutput.item?.id === newOutputItem.id && p.craftingOutput.item?.quantity === newOutputItem.quantity) {
                    return p;
                }
                return { ...p, craftingOutput: { item: newOutputItem } };
            }
            if (p.craftingOutput.item === null) {
                return p;
            }
            return { ...p, craftingOutput: { item: null } };
        });

    }, [player.craftingGrid]);

    useEffect(() => {
        const ambientId = 'ambient_sound';
        const rainId = 'rain_sound';

        if (gameState !== GameState.PLAYING) {
            stopAllSounds();
            return;
        }

        if (isRaining) {
            stopSound(ambientId); 
            playSound(SOUNDS.RAIN, { loop: true, id: rainId, volume: 0.5 });
        } else {
            stopSound(rainId);
            let soundToPlay: string | null = null;
            if (player.dimension === 'RUBY') {
                soundToPlay = SOUNDS.AMBIENT_RUBY;
            } else if (isNight) {
                soundToPlay = SOUNDS.AMBIENT_NIGHT;
            } else {
                switch (currentBiome) {
                    case Biome.PLAINS: soundToPlay = SOUNDS.AMBIENT_PLAINS_DAY; break;
                    case Biome.FOREST: case Biome.AUTUMN_FOREST: soundToPlay = SOUNDS.AMBIENT_FOREST_DAY; break;
                    case Biome.DESERT: case Biome.BEACH: case Biome.SAVANNAH: soundToPlay = SOUNDS.AMBIENT_DESERT_DAY; break;
                    case Biome.SNOW: soundToPlay = SOUNDS.AMBIENT_SNOW_DAY; break;
                    case Biome.LAVA: soundToPlay = SOUNDS.AMBIENT_LAVA; break;
                    case Biome.WATER: case Biome.SWAMP: case Biome.OCEAN: soundToPlay = SOUNDS.AMBIENT_WATER; break;
                    case Biome.CAVERN: soundToPlay = SOUNDS.AMBIENT_LAVA; break; 
                }
            }
            if (soundToPlay) {
                playSound(soundToPlay, { loop: true, id: ambientId, volume: 0.3 });
            } else {
                stopSound(ambientId);
            }
        }

    }, [gameState, isRaining, isNight, player.dimension, currentBiome]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const startX = Math.floor(camera.x / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(camera.y / TILE_SIZE) * TILE_SIZE;
    const endX = startX + width + TILE_SIZE;
    const endY = startY + height + TILE_SIZE;

    for (let x = startX; x < endX; x += TILE_SIZE) {
        for (let y = startY; y < endY; y += TILE_SIZE) {
            const biome = getBiomeAt(x + TILE_SIZE / 2, y + TILE_SIZE / 2, player.dimension);
            ctx.fillStyle = BIOME_DATA[biome].color;
            ctx.fillRect(x - camera.x, y - camera.y, TILE_SIZE, TILE_SIZE);
        }
    }
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    explosions.forEach(exp => {
        const life = (Date.now() - exp.createdAt) / CRATER_DURATION_MS;
        ctx.fillStyle = `rgba(87, 65, 43, ${1 - life})`; 
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
    });

     if (isNight && player.dimension === 'OVERWORLD') {
        ctx.fillStyle = isBloodMoon ? 'rgba(100, 0, 0, 0.3)' : 'rgba(0, 0, 20, 0.4)';
        ctx.fillRect(camera.x, camera.y, width, height);
    }


    particles.forEach(p => {
        ctx.globalAlpha = p.lifespan / p.maxLifespan; 
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0; 
    
    portals.forEach(p => {
        const portalWidth = p.sizeX || p.size;
        const portalHeight = p.sizeY || p.size;
        ctx.fillStyle = p.targetDimension === 'CAVERN' ? '#000000' : '#6A0DAD';
        ctx.fillRect(p.x - portalWidth / 2, p.y - portalHeight / 2, portalWidth, portalHeight);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(p.x - portalWidth / 2 + 5, p.y - portalHeight / 2 + 5, portalWidth - 10, portalHeight - 10);
    });

    resources.forEach(res => {
        const resourceBiome = res.biome || getBiomeAt(res.x, res.y, player.dimension);

        ctx.fillStyle = RESOURCE_DATA[res.type]?.color || '#FFFFFF';
        if (res.type === ResourceType.BUSH || res.type === ResourceType.SWAMP_BUSH || res.type === ResourceType.AUTUMN_BUSH) {
             ctx.beginPath();
             ctx.arc(res.x, res.y, res.size / 2, 0, Math.PI * 2);
             ctx.fill();
             ctx.fillStyle = res.type === ResourceType.SWAMP_BUSH ? '#90EE90' : res.type === ResourceType.AUTUMN_BUSH ? '#8B4500' : '#FF0000'; 
             ctx.beginPath(); ctx.arc(res.x - 5, res.y - 5, 3, 0, Math.PI * 2); ctx.fill();
             ctx.beginPath(); ctx.arc(res.x + 5, res.y + 2, 3, 0, Math.PI * 2); ctx.fill();
             ctx.beginPath(); ctx.arc(res.x - 2, res.y + 7, 3, 0, Math.PI * 2); ctx.fill();
        } else if (res.type === ResourceType.CACTUS) {
             const w = res.size * 0.4;
             const h = res.size;
             ctx.fillStyle = '#2E8B57'; 
             
             ctx.fillRect(res.x - w/2, res.y - h/2, w, h);
             
             const armW = w * 0.8;
             const armH = h * 0.3;
             
             ctx.fillRect(res.x - w/2 - armW, res.y - h * 0.1, armW, w); 
             ctx.fillRect(res.x - w/2 - armW, res.y - h * 0.1 - armH, w, armH + w); 
             
             ctx.fillRect(res.x + w/2, res.y + h * 0.1, armW, w); 
             ctx.fillRect(res.x + w/2 + armW - w, res.y + h * 0.1 - armH * 0.8, w, armH * 0.8 + w); 
             
             ctx.fillStyle = '#1E5B37'; 
             for(let i=0; i<5; i++) {
                 ctx.fillRect(res.x - w/4, res.y - h/2 + i*(h/5) + 5, 2, 2);
             }
        } else if (res.type === ResourceType.RUBY_WOOD) {
             ctx.fillStyle = '#5D2E5D'; 
             const w = res.size * 0.4;
             ctx.fillRect(res.x - w/2, res.y - res.size/2, w, res.size);
             
             if (resourceBiome === Biome.RUBY_DARK) {
                 ctx.fillStyle = '#3a0d3a'; 
             } else {
                 ctx.fillStyle = '#da70d6'; 
             }
             
             ctx.beginPath();
             ctx.arc(res.x, res.y - res.size/2, res.size/2, 0, Math.PI*2);
             ctx.fill();
        } else if (res.type === ResourceType.WOOD && resourceBiome === Biome.AUTUMN_FOREST) {
             ctx.fillStyle = '#8B4513'; 
             const w = res.size * 0.4;
             ctx.fillRect(res.x - w/2, res.y - res.size/2, w, res.size);
             ctx.fillStyle = '#FF8C00'; 
             ctx.beginPath();
             ctx.arc(res.x, res.y - res.size/2, res.size/2, 0, Math.PI*2);
             ctx.fill();
        } else if (res.type === ResourceType.WOOD && resourceBiome === Biome.SAVANNAH) {
             ctx.fillStyle = '#5C4033'; 
             const w = res.size * 0.2;
             ctx.fillRect(res.x - w/2, res.y - res.size/2, w, res.size);
             ctx.beginPath();
             ctx.moveTo(res.x, res.y - res.size/4);
             ctx.lineTo(res.x - 15, res.y - res.size/2 - 10);
             ctx.stroke();
             ctx.beginPath();
             ctx.moveTo(res.x, res.y - res.size/4);
             ctx.lineTo(res.x + 15, res.y - res.size/2 - 5);
             ctx.stroke();
        } else if (res.type === ResourceType.WOOD && resourceBiome === Biome.SWAMP) {
             ctx.fillStyle = '#2F4F2F'; 
             const w = res.size * 0.5;
             ctx.fillRect(res.x - w/2, res.y - res.size/2, w, res.size);
             ctx.fillStyle = '#006400'; 
             ctx.fillRect(res.x - res.size/2, res.y - res.size, res.size, res.size/2);
        } else {
             ctx.fillRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
        }
    });
    
    buildings.forEach(b => {
        if (b.type === 'mysterious_statue') {
            // Draw Statue
            ctx.fillStyle = '#E3CFA9'; // Beige
            // Body
            ctx.fillRect(b.x - 10, b.y - 30, 20, 30);
            // Head
            ctx.beginPath();
            ctx.arc(b.x, b.y - 40, 10, 0, Math.PI*2);
            ctx.fill();
            // Arms
            ctx.fillRect(b.x - 20, b.y - 25, 10, 20);
            ctx.fillRect(b.x + 10, b.y - 25, 10, 20);
            // Base
            ctx.fillRect(b.x - 25, b.y, 50, 10);
            
            // "Press E" indicator
            const dist = Math.hypot(player.x - b.x, player.y - b.y);
            if (dist < 100) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText('Press E', b.x - 25, b.y - 60);
            }
            return;
        } else if (b.type === 'minion_statue') {
            // Minion Statue (Pillar)
            ctx.fillStyle = '#5D4037'; // Brownish Grey
            ctx.fillRect(b.x - 15, b.y - 40, 30, 40);
            // Red Orb on top
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(b.x, b.y - 50, 15, 0, Math.PI * 2);
            ctx.fill();
            // Pulse effect
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
            ctx.beginPath();
            ctx.arc(b.x, b.y - 50, 20, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (b.type === 'door') {
            ctx.fillStyle = RESOURCE_DATA[b.material]?.color || '#A0522D';
            if (b.isOpen) {
                 ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size / 4, b.size);
            } else {
                 ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            }
        } else if (b.type === 'bed') {
            ctx.fillStyle = '#8B4513'; 
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            ctx.fillStyle = '#DC143C'; 
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size * 0.7);
            ctx.fillStyle = '#FFFFFF'; 
            ctx.fillRect(b.x - b.size/2 + b.size * 0.1, b.y + b.size/2 - b.size*0.25, b.size*0.8, b.size*0.2);
        } else if (b.type === 'furnace') {
            ctx.fillStyle = '#696969';
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            if (b.fuelLeft && b.fuelLeft > 0) {
                 ctx.fillStyle = '#FF4500'; 
                 ctx.fillRect(b.x - b.size / 4, b.y, b.size / 2, b.size / 2);
            }
        } else if (b.type === 'enchanting_table') {
             ctx.fillStyle = '#4B0082'; 
             ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
             ctx.fillStyle = '#FF69B4'; 
             ctx.fillRect(b.x - b.size/2, b.y - b.size/2, 10, 10);
             ctx.fillRect(b.x + b.size/2 - 10, b.y - b.size/2, 10, 10);
             ctx.fillRect(b.x - b.size/2, b.y + b.size/2 - 10, 10, 10);
             ctx.fillRect(b.x + b.size/2 - 10, b.y + b.size/2 - 10, 10, 10);
             ctx.fillStyle = '#E6E6FA'; 
             ctx.fillRect(b.x - 10, b.y - 15, 20, 10);
        } else if (b.type === 'tnt') {
             ctx.fillStyle = '#FF0000'; 
             ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
             ctx.fillStyle = '#FFFFFF'; 
             ctx.font = 'bold 24px sans-serif';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('TNT', b.x, b.y);
        } else if (b.type === 'furniture') {
            const itemId = Object.keys(ITEMS).find(k => ITEMS[k].type === 'furniture' && k.includes(b.material)) || 'furniture';
            if(b.material.includes('astrilita')) ctx.fillStyle = '#8A2BE2';
            else if(b.material.includes('copper')) ctx.fillStyle = '#B87333';
            else ctx.fillStyle = '#8B4513';
            
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            ctx.fillStyle = 'cyan';
            ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
        } else {
            ctx.fillStyle = b.type === 'workbench' ? '#A0522D' : b.type === 'chest' ? '#C2B280' : RESOURCE_DATA[b.material]?.color || '#888';
            if (b.type === 'block' && b.material === 'astrilita') ctx.fillStyle = '#4B0082'; 
            if (b.type === 'block' && b.material === 'copper') ctx.fillStyle = '#B87333';
            if (b.type === 'block' && b.material === 'ruby_wood') ctx.fillStyle = '#5D2E5D'; 
            
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
        }

        if (b.type === 'workbench') {
            ctx.fillStyle = 'black';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('W', b.x, b.y);
        }
        if (b.type === 'chest') {
            ctx.fillStyle = '#5C4033';
             ctx.fillRect(b.x - b.size / 2 + 5, b.y - b.size / 2 + 5, b.size - 10, 10);
        }
        if (b.hp < b.maxHp) {
            const barY = b.y - b.size / 2 - 10;
            ctx.fillStyle = '#555';
            ctx.fillRect(b.x - b.size / 2, barY, b.size, 5);
            ctx.fillStyle = 'red';
            ctx.fillRect(b.x - b.size / 2, barY, b.size * (b.hp / b.maxHp), 5);
        }
    });

    itemDrops.forEach(drop => {
        let color = '#FFA500';
        if (drop.item.id === 'money') {
            color = '#8B4513';
        } else {
            const itemData = ITEMS[drop.item.id];
            if (itemData.type === 'resource' || itemData.type === 'smeltable' || itemData.type === 'fuel') {
                color = RESOURCE_DATA[itemData.id.toUpperCase() as ResourceType]?.color || color;
            } else if (itemData.id === 'totem_ruby') {
                color = '#E0115F';
            }
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    animals.forEach(animal => {
        ctx.fillStyle = ANIMAL_STATS[AnimalType[animal.type] as keyof typeof ANIMAL_STATS].color;
        ctx.fillRect(animal.x - animal.size / 2, animal.y - animal.size / 2, animal.size, animal.size);
        
        if (animal.type === AnimalType.COW) {
            ctx.fillStyle = 'black';
            ctx.fillRect(animal.x - animal.size / 4, animal.y - animal.size/4, animal.size/2, animal.size/2);
        }
        if (animal.type === AnimalType.PENGUIN) {
            ctx.fillStyle = 'white';
            ctx.fillRect(animal.x - animal.size / 4, animal.y - animal.size / 2, animal.size / 2, animal.size);
            if (animal.state === 'ANGRY') {
                ctx.fillStyle = 'red';
                ctx.fillRect(animal.x - 2, animal.y - animal.size/2 - 5, 4, 4); 
            }
        }
        if (animal.type === AnimalType.SCORPION) {
            ctx.fillStyle = '#5D4037';
            ctx.beginPath();
            ctx.arc(animal.x, animal.y - animal.size/2, 5, 0, Math.PI*2);
            ctx.fill();
        }
        if (animal.state === 'SLEEPING') {
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText("Zzz", animal.x, animal.y - animal.size);
        }
        if (animal.name) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText(animal.name, animal.x, animal.y - animal.size / 2 - 10);
        }
    });

    dogs.forEach(dog => {
        ctx.fillStyle = DOG_STATS.color;
        ctx.fillRect(dog.x - dog.size / 2, dog.y - dog.size / 2, dog.size, dog.size);
        if (dog.ownerId) {
            ctx.fillStyle = '#FF0000'; 
            ctx.fillRect(dog.x - dog.size / 2, dog.y - dog.size / 2, dog.size, 5);
        }
        if (dog.name) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText(dog.name, dog.x, dog.y - dog.size / 2 - 10);
        }
    });
    
    npcs.forEach(npc => {
        ctx.fillStyle = '#FFDBAC'; 
        ctx.fillRect(npc.x - npc.size / 2, npc.y - npc.size / 2, npc.size, npc.size);
        
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        const npcName = (npc.type === NPCType.VENDOR)
            ? (language === Language.PT ? translations[language].claudio : translations[language].hitler)
            : npc.name;
        ctx.fillText(npcName, npc.x, npc.y - npc.size / 2 - 10);
    });

    const torchEquipped = player.offHand.item?.id === 'torch';
    const lightRadius = 350;

    zombies.forEach(zombie => {
        if (torchEquipped && isNight && player.dimension === 'OVERWORLD') {
            const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);
            if (dist > lightRadius) return;
        }
        
        let color = ZOMBIE_STATS.NORMAL.color;
        const stats = ZOMBIE_STATS[ZombieType[zombie.type] as keyof typeof ZOMBIE_STATS];
        if (stats) color = stats.color;

        ctx.fillStyle = color;
        ctx.fillRect(zombie.x - zombie.size / 2, zombie.y - zombie.size / 2, zombie.size, zombie.size);

        if (zombie.type === ZombieType.MEGA_BOSS) {
            // Draw Face
            ctx.fillStyle = '#000000'; // Mouth
            ctx.beginPath();
            ctx.ellipse(zombie.x, zombie.y + 50, 80, 40, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Teeth
            ctx.fillStyle = '#FFFFFF';
            for(let i=0; i<5; i++) {
                ctx.beginPath();
                ctx.arc(zombie.x - 50 + i*25, zombie.y + 60, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(zombie.x - 50, zombie.y - 50, 30, 20, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(zombie.x + 50, zombie.y - 50, 30, 20, 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(zombie.x - 50, zombie.y - 50, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(zombie.x + 50, zombie.y - 50, 5, 0, Math.PI * 2);
            ctx.fill();

            // Shield
            if (zombie.isInvulnerable) {
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)'; // Grey Shield
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.arc(zombie.x, zombie.y, zombie.size / 2 + 20, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
                ctx.fill();
            }
        } else if (zombie.isBoss && zombie.shieldActive) {
            ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(zombie.x, zombie.y, zombie.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        if (zombie.hp < zombie.maxHp) {
            const barY = zombie.y - zombie.size / 2 - 20;
            const barHeight = zombie.type === ZombieType.MEGA_BOSS ? 10 : 5;
            const barWidth = zombie.type === ZombieType.MEGA_BOSS ? zombie.size * 1.5 : zombie.size;
            
            ctx.fillStyle = '#555';
            ctx.fillRect(zombie.x - barWidth / 2, barY, barWidth, barHeight);
            ctx.fillStyle = 'red';
            ctx.fillRect(zombie.x - barWidth / 2, barY, barWidth * (zombie.hp / zombie.maxHp), barHeight);
        }
    });
    
    projectiles.forEach(p => {
        if (p.isRocket) {
             ctx.fillStyle = '#555';
             ctx.fillRect(p.x - 10, p.y - 4, 20, 8);
             ctx.fillStyle = 'orange';
             ctx.beginPath();
             ctx.arc(p.x + 10, p.y, 5, 0, Math.PI * 2);
             ctx.fill();
        } else if (p.isArrow) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-15, -2, 30, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(10, -5);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = p.owner === 'player' ? 'yellow' : 'magenta';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.fillStyle = 'royalblue';
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    
    const playerShield = player.offHand.item;
    if (playerShield?.type === 'shield' && playerShield.durability && playerShield.durability > 0) {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    if (torchEquipped && isNight && player.dimension === 'OVERWORLD') {
        const grad = ctx.createRadialGradient(player.x, player.y, 50, player.x, player.y, lightRadius);
        grad.addColorStop(0, 'rgba(255, 220, 150, 0.2)');
        grad.addColorStop(1, 'rgba(255, 220, 150, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, lightRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    if(isRaining) {
        ctx.fillStyle = 'rgba(128, 128, 140, 0.3)';
        ctx.fillRect(0,0,width, height);
    }

  }, [player, resources, zombies, projectiles, buildings, camera, animals, dogs, itemDrops, isBloodMoon, isRaining, portals, particles, isNight, npcs, language, explosions]);

  const mainLoop = useCallback((currentTime: number) => {
    const dt = currentTime - lastFrameTime.current;
    if (dt > 16) { 
        lastFrameTime.current = currentTime;
        gameTick(dt);
        draw();
    }
    gameLoopRef.current = requestAnimationFrame(mainLoop);
  }, [gameTick, draw]);
  
    // ... [saveGame, handleAttack, useEffects omitted, assume unchanged] ...
    const saveGame = useCallback(() => {
        if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) return;
        try {
            const stateToSave = {
                player,
                resources,
                zombies,
                animals,
                dogs,
                npcs,
                itemDrops,
                buildings,
                portals,
                particles,
                day,
                isNight,
                isBloodMoon,
                isRaining,
                rainTimer,
                destroyedResources,
                timeInCycle,
                creativeMode,
                invisible,
                noclip,
                currentBiome,
                savedDimensions: Array.from(savedDimensions.current.entries()),
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
            setShowSaveMessage(true);
            setTimeout(() => setShowSaveMessage(false), 2000);
        } catch (error) {
            console.error("Failed to save game:", error);
        }
    }, [player, resources, zombies, buildings, day, isNight, timeInCycle, creativeMode, invisible, noclip, gameState, animals, dogs, itemDrops, isBloodMoon, isRaining, rainTimer, destroyedResources, portals, particles, currentBiome, npcs]);

    const handleAttack = useCallback(() => {
    const now = Date.now();
    if (now - player.lastAttackTime < (player.weapon?.toolType?.includes('sword') ? 500 : 300)) return;

    setPlayer(p => {
        let newPlayerState = { ...p, lastAttackTime: now };
        let weapon = newPlayerState.weapon ? { ...newPlayerState.weapon } : null;

        const damageWeapon = (): boolean => { 
            if (weapon && weapon.durability !== undefined) {
                let durabilityLoss = 1;
                const unbreaking = weapon.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
                if (unbreaking && Math.random() < 1 - (1 / (unbreaking.level + 1))) {
                    durabilityLoss = 0;
                }
                
                if (durabilityLoss > 0) {
                    weapon.durability -= 1;
                    if (weapon.durability <= 0) {
                        playSound(SOUNDS.ITEM_BREAK);
                        weapon = null;
                        return true;
                    }
                }
            }
            return false;
        };

        if (weapon && ['pistol', 'rifle', 'ak47', 'bow', 'bazooka'].includes(weapon.toolType)) {
            const isBow = weapon.toolType === 'bow';
            const isAk = weapon.toolType === 'ak47';
            const isBazooka = weapon.toolType === 'bazooka';

            const ammoType = isBow ? 'arrow' : isBazooka ? 'rocket' : 'ammo';
            const ammoCost = isAk ? 2 : 1;
            
            const hasAmmo = (ammoType === 'ammo')
                ? newPlayerState.ammo >= ammoCost
                : newPlayerState.inventory.some(s => s.item?.id === ammoType && s.item.quantity >= 1);

            if (!hasAmmo) return p;

            playSound(isBow ? SOUNDS.PLAYER_ATTACK_SWORD : isBazooka ? SOUNDS.BAZOOKA_FIRE : SOUNDS.PLAYER_ATTACK_GUN);

            if (ammoType !== 'ammo') {
                const newInv = [...newPlayerState.inventory];
                for(let i = 0; i < newInv.length; i++) {
                    if (newInv[i].item?.id === ammoType) {
                        newInv[i].item!.quantity -= 1;
                        if(newInv[i].item!.quantity <= 0) newInv[i].item = null;
                        break;
                    }
                }
                newPlayerState.inventory = newInv;
            } else {
                newPlayerState.ammo -= ammoCost;
            }
            
            if(!isBow) { 
                setZombies(zs => zs.map(z => {
                    const dist = Math.hypot(newPlayerState.x - z.x, newPlayerState.y - z.y);
                    if (dist < ZOMBIE_SOUND_INVESTIGATION_RADIUS && z.state !== ZombieState.PURSUING) {
                        return { ...z, state: ZombieState.INVESTIGATING, targetX: newPlayerState.x, targetY: newPlayerState.y, stateTimer: 0 };
                    }
                    return z;
                }));
            }

            damageWeapon();
            
            const projectileSpeed = isBazooka ? 12 : 15;
            let damage = weapon?.damage || 0;
            const sharpness = weapon?.enchantments?.find(e => e.type === Enchantment.SHARPNESS);
            if(sharpness) damage += sharpness.level * 4;

            const angle = Math.atan2(mousePos.y - window.innerHeight / 2, mousePos.x - window.innerWidth / 2);
            const projectileSpawnOffset = newPlayerState.size / 2 + 10;
            const startX = newPlayerState.x + Math.cos(angle) * projectileSpawnOffset;
            const startY = newPlayerState.y + Math.sin(angle) * projectileSpawnOffset;
            
            const homing = weapon?.enchantments?.find(e => e.type === Enchantment.HOMING);
            let homingTargetId: string | undefined = undefined;
            if (homing) {
                 const nearbyZombies = zombies.filter(z => Math.hypot(p.x - z.x, p.y - z.y) < 800);
                 if (nearbyZombies.length > 0) {
                     homingTargetId = nearbyZombies[0].id;
                 }
            }
            
            const createProjectile = (offsetAngle = 0) => ({
                id: `proj_${Date.now()}_${Math.random()}`, x: startX, y: startY,
                size: isBow ? 30 : isBazooka ? 20 : 10,
                vx: Math.cos(angle + offsetAngle) * projectileSpeed,
                vy: Math.sin(angle + offsetAngle) * projectileSpeed,
                damage: damage,
                owner: 'player' as 'player',
                lifespan: 2000,
                isArrow: isBow,
                isRocket: isBazooka,
                homingTargetId,
            });

            const newProjectiles = [createProjectile()];
            if (isAk) setTimeout(() => setProjectiles(projs => [...projs, createProjectile(0.05)]), 100);
            setProjectiles(projs => [...projs, ...newProjectiles]);

        } else { 
            playSound(SOUNDS.PLAYER_ATTACK_SWORD);
            const attackRange = 80;
            let attackDamage = weapon?.damage || 2;
            const sharpness = weapon?.enchantments?.find(e => e.type === Enchantment.SHARPNESS);
            if (sharpness) {
                attackDamage += sharpness.level * 4;
            }

            const targets = [...zombies, ...animals, ...dogs.filter(d => d.state === DogState.WILD || d.state === DogState.HOSTILE)];
            const affectedTargetIds = new Set<string>();
            targets.forEach(target => {
                if (Math.hypot(newPlayerState.x - target.x, newPlayerState.y - target.y) < attackRange) {
                    affectedTargetIds.add(target.id);
                }
            });

            if (keysPressed['f']) { 
                setResources(res => {
                    const remaining: ResourceNode[] = [];
                    res.forEach(r => {
                        const canDestroy = r.type === ResourceType.BUSH || r.type === ResourceType.SWAMP_BUSH || r.type === ResourceType.AUTUMN_BUSH;
                        if(canDestroy && Math.hypot(newPlayerState.x - r.x, newPlayerState.y - r.y) < attackRange) {
                            let dropItem = ITEMS.cherry;
                            if (r.type === ResourceType.SWAMP_BUSH) dropItem = ITEMS.dirty_berry;
                            if (r.type === ResourceType.AUTUMN_BUSH) dropItem = ITEMS.orange_berry;

                            setItemDrops(d => [...d, {id: `drop_berry_${Date.now()}`, x: r.x, y: r.y, size: 20, item: dropItem}]);
                            setDestroyedResources(dr => [...dr, {...r, respawnTimer: RESOURCE_RESPAWN_MS}]);
                        } else {
                            remaining.push(r);
                        }
                    });
                    return remaining;
                });
            }

            if (affectedTargetIds.size > 0) {
                const broke = damageWeapon();
                if (broke && (weapon?.durability || 1) <= 0) { 
                } else {
                    setZombies(prev => prev.map(z => {
                        if(affectedTargetIds.has(z.id)) {
                             // Check for invulnerability
                             if (z.type === ZombieType.MEGA_BOSS && z.isInvulnerable) {
                                 playSound(SOUNDS.SHIELD_HIT);
                                 return z;
                             }
                             if (z.isBoss && z.shieldActive && weapon?.toolType !== 'sword') {
                                playSound(SOUNDS.SHIELD_HIT);
                                return z;
                            }
                            playSound(SOUNDS.ZOMBIE_HURT, { volume: 0.6 });
                            const newHp = z.hp - attackDamage;
                             if(z.type === ZombieType.RUBY && newHp <= 0 && Math.random() < 0.2) {
                                setItemDrops(d => [...d, {id: `drop_ruby_${Date.now()}`, x: z.x, y: z.y, size: 20, item: ITEMS.ruby}]);
                            }
                            
                            const knockbackLevel = weapon?.enchantments?.find(e => e.type === Enchantment.KNOCKBACK)?.level || 0;
                            let newX = z.x;
                            let newY = z.y;
                            if (knockbackLevel > 0 && z.type !== ZombieType.MEGA_BOSS) { // Don't knockback mega boss
                                const angle = Math.atan2(z.y - newPlayerState.y, z.x - newPlayerState.x);
                                const force = knockbackLevel * 40; 
                                newX += Math.cos(angle) * force;
                                newY += Math.sin(angle) * force;
                            }

                            return { ...z, hp: newHp, x: newX, y: newY };
                        }
                        return z;
                    }));
                     setAnimals(prev => {
                        const newDrops: ItemDrop[] = [];
                        const remaining = prev.map(a => {
                            if (affectedTargetIds.has(a.id)) {
                                const newHp = a.hp - attackDamage;
                                if (a.type === AnimalType.POLAR_BEAR) {
                                    a.state = 'ATTACKING';
                                } else if (a.type === AnimalType.PENGUIN && a.state !== 'TAMED_IDLE' && a.state !== 'TAMED_FOLLOWING' && a.state !== 'SITTING') {
                                    a.state = 'ANGRY'; 
                                }

                                if(newHp <= 0) {
                                    newDrops.push({ id: `drop_food_${Date.now()}_${a.id}`, x: a.x, y: a.y, size: 20, item: ITEMS['food'] });
                                    if(a.type === AnimalType.SHEEP) newDrops.push({ id: `drop_wool_${Date.now()}_${a.id}`, x: a.x + 10, y: a.y + 10, size: 20, item: ITEMS['wool'] });
                                    if(a.type === AnimalType.COW) {
                                        newDrops.push({ id: `drop_food2_${Date.now()}_${a.id}`, x: a.x + 5, y: a.y + 5, size: 20, item: ITEMS['food'] });
                                        newDrops.push({ id: `drop_leather_${Date.now()}_${a.id}`, x: a.x - 5, y: a.y - 5, size: 20, item: ITEMS['leather'] });
                                    }
                                    if(a.type === AnimalType.POLAR_BEAR) {
                                        if (Math.random() < 0.5) newDrops.push({ id: `drop_fish_${Date.now()}_${a.id}`, x: a.x, y: a.y, size: 20, item: ITEMS['fish'] });
                                        else newDrops.push({ id: `drop_leather_${Date.now()}_${a.id}`, x: a.x, y: a.y, size: 20, item: ITEMS['leather'] });
                                    }
                                    return null;
                                }
                                
                                const knockbackLevel = weapon?.enchantments?.find(e => e.type === Enchantment.KNOCKBACK)?.level || 0;
                                let newX = a.x;
                                let newY = a.y;
                                if (knockbackLevel > 0) {
                                    const angle = Math.atan2(a.y - newPlayerState.y, a.x - newPlayerState.x);
                                    const force = knockbackLevel * 40;
                                    newX += Math.cos(angle) * force;
                                    newY += Math.sin(angle) * force;
                                }

                                return { ...a, hp: newHp, x: newX, y: newY };
                            }
                            return a;
                        }).filter((a): a is Animal => a !== null);
                        if (newDrops.length > 0) setItemDrops(d => [...d, ...newDrops]);
                        return remaining;
                    });
                    setDogs(prev => prev.map(d => affectedTargetIds.has(d.id) ? { ...d, hp: d.hp - attackDamage, state: DogState.HOSTILE } : d));
                    setDogs(ds => ds.map(d => {
                        if (d.ownerId === newPlayerState.id) {
                            const firstTargetId = Array.from(affectedTargetIds)[0];
                            if (firstTargetId) return { ...d, state: DogState.ATTACKING, targetId: firstTargetId };
                        }
                        return d;
                    }));
                }
            }
        }
        
        newPlayerState.weapon = weapon;
        return newPlayerState;
    });
  }, [player, mousePos, zombies, animals, dogs, handleExplosion]);

    useEffect(() => {
        if (localStorage.getItem(SAVE_KEY)) {
            setSaveExists(true);
        }
    }, []);

    useEffect(() => {
        if (gameState !== GameState.PLAYING) return;
        const intervalId = setInterval(saveGame, 60000); 
        return () => clearInterval(intervalId);
    }, [gameState, saveGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = true;

        switch (gameState) {
            case GameState.PLAYING:
                if (e.key >= '1' && e.key <= String(HOTBAR_SLOTS)) {
                    setPlayer(p => ({ ...p, activeSlot: parseInt(e.key) - 1 }));
                } else if (key === 'q') {
                    setGameState(GameState.INVENTORY);
                } else if (key === 'm') {
                    setCreativeMode(c => !c);
                } else if (key === 'r') {
                    handleEatFood();
                } else if (key === 'f') {
                    handleAttack();
                } else if (key === 'z') {
                    const activeItem = player.inventory[player.activeSlot]?.item;
                    if (activeItem && (activeItem.type === 'block' || activeItem.type === 'furniture' || ['workbench', 'chest', 'furnace', 'enchanting_table', 'tnt', 'bed'].includes(activeItem.id) || activeItem.id.includes('_door'))) {
                        const angle = Math.atan2(mousePos.y - window.innerHeight / 2, mousePos.x - window.innerWidth / 2);
                        const placementDist = TILE_SIZE * 1.5;
                        const targetX = player.x + Math.cos(angle) * placementDist;
                        const targetY = player.y + Math.sin(angle) * placementDist;
                        
                        const gridX = Math.floor(targetX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                        const gridY = Math.floor(targetY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

                        const isOccupied = [...buildings, ...resources].some(obj => obj.x === gridX && obj.y === gridY);
                        if (isOccupied) return;

                        playSound(SOUNDS.COLLECT_WOOD);
                        
                        let material = 'stone'; 
                        if(activeItem.id.includes('wood')) material = 'wood';
                        else if(activeItem.id.includes('astrilita')) material = 'astrilita';
                        else if(activeItem.id.includes('copper')) material = 'copper';
                        else if (activeItem.id.includes('ruby')) material = 'ruby_wood';
                        
                        const maxHp = BLOCK_HP[material] || 20;
                        const isDoor = activeItem.id.includes('_door') || activeItem.id === 'auto_door';
                        
                        let type: Building['type'] = 'block';
                        if (activeItem.type === 'furniture') type = 'furniture';
                        else if (isDoor) type = 'door';
                        else if (['workbench', 'chest', 'bed', 'furnace', 'enchanting_table', 'tnt'].includes(activeItem.id)) type = activeItem.id as any;

                        setBuildings(b => [...b, {
                            id: `building_${Date.now()}_${Math.random()}`,
                            x: gridX, y: gridY, size: TILE_SIZE,
                            type: type,
                            material: material,
                            hp: maxHp, maxHp: maxHp,
                            isOpen: false,
                        }]);

                        setPlayer(p => {
                            const newInventory = [...p.inventory];
                            const currentSlot = newInventory[p.activeSlot];
                            if (currentSlot.item && currentSlot.item.quantity > 1) {
                                currentSlot.item.quantity -= 1;
                            } else {
                                currentSlot.item = null;
                            }
                            return { ...p, inventory: newInventory };
                        });
                    }
                } else if (key === 'c' && creativeMode) {
                    setGameState(GameState.CREATIVE_INVENTORY);
                } else if (key === 'h' && creativeMode) {
                    setInvisible(i => !i);
                } else if (key === 'v' && creativeMode) {
                    setNoclip(n => !n);
                }
                break;
            case GameState.INVENTORY:
            case GameState.CREATIVE_INVENTORY:
            case GameState.WORKBENCH:
            case GameState.PORTAL_UI:
            case GameState.CHEST_UI:
            case GameState.FURNACE:
            case GameState.QUEST_UI:
            case GameState.VENDOR_SHOP:
            case GameState.NAMING_PET:
            case GameState.ENCHANTING:
            case GameState.CAVERN_CONFIRM:
                if (key === 'q' || key === 'escape') {
                    if (gameState === GameState.CHEST_UI) playSound(SOUNDS.CHEST_CLOSE);
                    setGameState(GameState.PLAYING);
                    setActivePortal(null);
                    setActiveChest(null);
                    setActiveFurnace(null);
                    setActiveEnchantingTable(null);
                    setActiveNPC(null);
                    setDogBeingNamed(null);
                }
                break;
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => { setMousePos({ x: e.clientX, y: e.clientY }); };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    if (!gameLoopRef.current) {
        gameLoopRef.current = requestAnimationFrame(mainLoop);
    }

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('contextmenu', handleContextMenu);
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }
    };
  }, [gameState, creativeMode, noclip, activePortal, activeChest, activeFurnace, activeEnchantingTable, activeNPC, dogBeingNamed, giveCreativeItem, spawnZombie, killAllZombies, teleportPlayer, clearInventory, handleCraft, handleEatFood, handleAttack, handleEnchant, player, buildings, resources, zombies, animals, dogs, npcs, itemDrops, mousePos, mainLoop, updatePlayerAndChestInventories, updatePlayerAndFurnaceInventories, updatePlayerAndEnchantingSlots, updatePlayerAndPortalInventories, language]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block bg-black"
        onContextMenu={(e) => e.preventDefault()}
      />
      <GameUI
        gameState={gameState}
        setGameState={setGameState}
        language={language}
        setLanguage={setLanguage}
        player={player}
        setPlayer={setPlayer}
        day={day}
        isNight={isNight}
        timeInCycle={timeInCycle}
        isBloodMoon={isBloodMoon}
        isRaining={isRaining}
        startNewGame={startNewGame}
        loadGame={loadGame}
        saveExists={saveExists}
        showSaveMessage={showSaveMessage}
        addToInventory={addToInventory}
        collectingState={collectingState}
        resources={[...resources, ...buildings, ...portals, ...npcs, ...dogs, ...animals]}
        camera={camera}
        creativeMode={creativeMode}
        noclip={noclip}
        invisible={invisible}
        giveCreativeItem={giveCreativeItem}
        spawnZombie={spawnZombie}
        spawnAnimal={spawnAnimal}
        killAllZombies={killAllZombies}
        clearInventory={clearInventory}
        teleportPlayer={teleportPlayer}
        manipulatePlayerStat={manipulatePlayerStat}
        updatePlayerInventory={updatePlayerInventory}
        handleCraft={handleCraft}
        toggleBloodMoon={toggleBloodMoon}
        toggleRain={toggleRain}
        getBiomeAt={getBiomeAt}
        currentBiome={currentBiome}
        activePortal={activePortal}
        updatePlayerAndPortalInventories={updatePlayerAndPortalInventories}
        enterRubyDimension={enterRubyDimension}
        isNearReturnPortal={isNearReturnPortal}
        activeChest={activeChest}
        updatePlayerAndChestInventories={updatePlayerAndChestInventories}
        activeFurnace={activeFurnace}
        updatePlayerAndFurnaceInventories={updatePlayerAndFurnaceInventories}
        activeEnchantingTable={activeEnchantingTable}
        updatePlayerAndEnchantingSlots={updatePlayerAndEnchantingSlots}
        enchantmentOptions={enchantmentOptions}
        setEnchantmentOptions={setEnchantmentOptions}
        handleEnchant={handleEnchant}
        activeNPC={activeNPC}
        showSleepConfirm={showSleepConfirm}
        setShowSleepConfirm={setShowSleepConfirm}
        skipNight={skipNight}
        dogBeingNamed={dogBeingNamed}
        handleNamePet={handleNamePet}
        zombies={zombies}
        setZombies={setZombies}
        setDay={setDay}
        setIsNight={setIsNight}
        setTimeInCycle={setTimeInCycle}
        setIsRaining={setIsRaining}
        mousePos={mousePos}
        enterCavern={enterCavern}
        returnFromCavern={returnFromCavern}
      />
    </>
  );
};

export default App;
