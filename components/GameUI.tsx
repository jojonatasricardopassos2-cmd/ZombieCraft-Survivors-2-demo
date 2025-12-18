
import React, { useState, useEffect, useRef } from 'react';
import { GameState, ZombieType, Language, Biome, NPCType, Quest, Dog, AnimalType, Enchantment, EnchantmentOption, ItemEnchantment } from '../types';
import type { Player, CollectingState, ResourceNode, Item, Tool, Armor, InventorySlot, Building, Portal, NPC, Zombie, Animal } from '../types';
import { HOTBAR_SLOTS, CREATIVE_ITEMS, ITEMS, VENDOR_ITEMS, ENCHANTMENT_DATA, CRAFTING_RECIPES, PORTAL_REQUIREMENTS, translations, BLOOD_MOON_DURATION_MS, NIGHT_DURATION_MS, DAY_DURATION_MS, QUEST_LIST, WORLD_WIDTH, WORLD_HEIGHT, INVENTORY_CRAFTING_RECIPES, SMELT_TIME } from '../constants';
import { initAudioManager, playSound } from '../audioManager';
import { SOUNDS } from '../sounds';

interface GameUIProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  day: number;
  isNight: boolean;
  timeInCycle: number;
  isBloodMoon: boolean;
  isRaining: boolean;
  startNewGame: () => void;
  loadGame: () => void;
  saveExists: boolean;
  showSaveMessage: boolean;
  addToInventory: (item: any, quantity?: number) => boolean;
  collectingState: CollectingState | null;
  resources: (ResourceNode | Building | Portal | NPC | Dog | Animal)[];
  camera: { x: number; y: number };
  creativeMode: boolean;
  noclip: boolean;
  invisible: boolean;
  giveCreativeItem: (item: Item) => void;
  spawnZombie: (type: ZombieType) => void;
  spawnAnimal: (type: AnimalType) => void;
  killAllZombies: () => void;
  clearInventory: () => void;
  teleportPlayer: (pos: {x: number, y: number}) => void;
  manipulatePlayerStat: (stat: 'hp' | 'stamina' | 'energy', change: number) => void;
  updatePlayerInventory: (inventory: InventorySlot[], equipment: { weapon: Tool | null, armor: Armor | null, tool: Tool | null, offHand: InventorySlot }, craftingGrid: InventorySlot[], craftingOutput: InventorySlot) => void;
  handleCraft: (itemId: string) => void;
  toggleBloodMoon: () => void;
  toggleRain: () => void;
  getBiomeAt: (x: number, y: number, dimension: 'OVERWORLD' | 'RUBY' | 'CAVERN') => Biome;
  currentBiome: Biome;
  activePortal: Portal | null;
  updatePlayerAndPortalInventories: (playerInv: InventorySlot[], portalId: string, portalInv: InventorySlot[]) => void;
  enterRubyDimension: () => void;
  isNearReturnPortal: boolean;
  activeChest: Building | null;
  updatePlayerAndChestInventories: (playerInv: InventorySlot[], chestId: string, chestInv: InventorySlot[]) => void;
  activeFurnace: Building | null;
  updatePlayerAndFurnaceInventories: (playerInv: InventorySlot[], furnaceId: string, furnaceInv: InventorySlot[]) => void;
  activeEnchantingTable: Building | null;
  updatePlayerAndEnchantingSlots: (playerInv: InventorySlot[], enchantingSlots: InventorySlot[]) => void;
  enchantmentOptions: EnchantmentOption[];
  setEnchantmentOptions: React.Dispatch<React.SetStateAction<EnchantmentOption[]>>;
  handleEnchant: (enchantment: ItemEnchantment) => void;
  activeNPC: NPC | null;
  showSleepConfirm: boolean;
  setShowSleepConfirm: (show: boolean) => void;
  skipNight: () => void;
  dogBeingNamed: Dog | null;
  handleNamePet: (dogId: string, name: string) => void;
  zombies: Zombie[];
  setZombies: React.Dispatch<React.SetStateAction<Zombie[]>>;
  setDay: React.Dispatch<React.SetStateAction<number>>;
  setIsNight: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeInCycle: React.Dispatch<React.SetStateAction<number>>;
  setIsRaining: React.Dispatch<React.SetStateAction<boolean>>;
  mousePos: { x: number; y: number };
  enterCavern: () => void;
  returnFromCavern: () => void;
}

type SubPanelProps = GameUIProps & { t: (key: string) => string };

const getItemName = (item: Item, lang: Language) => {
    return lang === Language.PT ? item.name_pt : item.name;
};

const getDurabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
};

const Slot: React.FC<{ item: Item | null, onClick?: (e: React.MouseEvent) => void, onContextMenu?: (e: React.MouseEvent) => void, className?: string, label?: string, selected?: boolean }> = ({ item, onClick, onContextMenu, className = "w-12 h-12", label, selected }) => (
    <div 
        onClick={onClick} 
        onContextMenu={onContextMenu}
        className={`bg-slate-700 border-2 ${selected ? 'border-yellow-400' : 'border-slate-600'} flex items-center justify-center relative cursor-pointer hover:bg-slate-600 transition-colors ${className}`}
    >
        {label && !item && <span className="text-[10px] text-slate-400 absolute text-center pointer-events-none p-1">{label}</span>}
        {item && (
            <>
                <div className="flex flex-col items-center pointer-events-none">
                    <span className="text-[10px] leading-tight text-center px-0.5 w-full truncate">{item.name_pt}</span>
                    {item.quantity > 1 && <span className="absolute bottom-0 right-1 text-xs font-bold text-white">{item.quantity}</span>}
                </div>
                {item.durability !== undefined && item.maxDurability !== undefined && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-10/12 h-1 bg-gray-900 rounded-full pointer-events-none">
                        <div className={`h-full rounded-full ${getDurabilityColor(item.durability, item.maxDurability)}`} style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}></div>
                    </div>
                )}
            </>
        )}
    </div>
);

const InventoryPanel: React.FC<SubPanelProps> = ({ player, setPlayer, setGameState, mousePos }) => {
    const [cursorItem, setCursorItem] = useState<Item | null>(null);

    useEffect(() => {
        const gridItems = player.craftingGrid.map(slot => slot.item?.id || null).filter(Boolean).sort();
        let resultItem: Item | null = null;
        if (gridItems.length > 0) {
            const recipeKey = JSON.stringify(gridItems);
            const recipe = INVENTORY_CRAFTING_RECIPES.get(recipeKey);
            if (recipe) resultItem = { ...recipe.result, quantity: recipe.quantity };
        }
        if (player.craftingOutput.item?.id !== resultItem?.id || player.craftingOutput.item?.quantity !== resultItem?.quantity) {
            setPlayer(p => ({ ...p, craftingOutput: { item: resultItem } }));
        }
    }, [player.craftingGrid, setPlayer]);

    const handleSlotClick = (slotType: 'inv' | 'armor' | 'weapon' | 'tool' | 'offhand' | 'craft' | 'output', index: number, e: React.MouseEvent) => {
        e.preventDefault();
        let currentItem: Item | null = null;
        if (slotType === 'inv') currentItem = player.inventory[index].item;
        else if (slotType === 'craft') currentItem = player.craftingGrid[index].item;
        else if (slotType === 'output') {
            if (player.craftingOutput.item && !cursorItem) {
                const craftedItem = { ...player.craftingOutput.item };
                setCursorItem(craftedItem);
                const newCraftGrid = player.craftingGrid.map(s => {
                    return { item: s.item && s.item.quantity > 1 ? { ...s.item, quantity: s.item.quantity - 1 } : null };
                });
                setPlayer(p => ({ ...p, craftingGrid: newCraftGrid, craftingOutput: { item: null } }));
                playSound(SOUNDS.CRAFT_SUCCESS);
            }
            return;
        } else if (slotType === 'armor') currentItem = player.armor;
        else if (slotType === 'weapon') currentItem = player.weapon;
        else if (slotType === 'tool') currentItem = player.tool;
        else if (slotType === 'offhand') currentItem = player.offHand.item;

        if (!cursorItem) {
            if (currentItem) {
                setCursorItem(currentItem);
                updatePlayerSlot(slotType, index, null);
                playSound(SOUNDS.ITEM_PICKUP);
            }
        } else {
             if (slotType === 'armor' && cursorItem.type !== 'armor') return;
             if (slotType === 'weapon' && cursorItem.type !== 'weapon') return;
             if (slotType === 'tool' && cursorItem.type !== 'tool') return;

             if (!currentItem) {
                updatePlayerSlot(slotType, index, cursorItem);
                setCursorItem(null);
                playSound(SOUNDS.ITEM_PICKUP);
             } else if (currentItem.id === cursorItem.id && currentItem.stackable && currentItem.quantity < currentItem.maxStack) {
                const space = currentItem.maxStack - currentItem.quantity;
                const toAdd = Math.min(space, cursorItem.quantity);
                updatePlayerSlot(slotType, index, { ...currentItem, quantity: currentItem.quantity + toAdd });
                setCursorItem(cursorItem.quantity - toAdd > 0 ? { ...cursorItem, quantity: cursorItem.quantity - toAdd } : null);
                playSound(SOUNDS.ITEM_PICKUP);
             } else {
                updatePlayerSlot(slotType, index, cursorItem);
                setCursorItem(currentItem);
                playSound(SOUNDS.ITEM_PICKUP);
             }
        }
    };

    const handleRightClick = (slotType: 'inv' | 'craft', index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const slotArray = slotType === 'inv' ? player.inventory : player.craftingGrid;
        const currentItem = slotArray[index].item;
        if (!cursorItem && currentItem) {
            const half = Math.ceil(currentItem.quantity / 2);
            setCursorItem({ ...currentItem, quantity: half });
            updatePlayerSlot(slotType, index, currentItem.quantity - half > 0 ? { ...currentItem, quantity: currentItem.quantity - half } : null);
            playSound(SOUNDS.ITEM_PICKUP);
        } else if (cursorItem) {
            const newItem = currentItem ? { ...currentItem, quantity: currentItem.quantity + 1 } : { ...cursorItem, quantity: 1 };
            updatePlayerSlot(slotType, index, newItem);
            setCursorItem(cursorItem.quantity > 1 ? { ...cursorItem, quantity: cursorItem.quantity - 1 } : null);
            playSound(SOUNDS.ITEM_PICKUP);
        }
    };

    const updatePlayerSlot = (type: string, index: number, item: Item | null) => {
        setPlayer(prev => {
            const p = { ...prev };
            if (type === 'inv') p.inventory = p.inventory.map((s, i) => i === index ? { item } : s);
            else if (type === 'craft') p.craftingGrid = p.craftingGrid.map((s, i) => i === index ? { item } : s);
            else if (type === 'armor') p.armor = item as Armor;
            else if (type === 'weapon') p.weapon = item as Tool;
            else if (type === 'tool') p.tool = item as Tool;
            else if (type === 'offhand') p.offHand = { item };
            return p;
        });
    };

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50 select-none">
            <div className="bg-slate-800 p-8 rounded-lg border-2 border-slate-600 shadow-2xl relative grid grid-cols-[auto_auto_auto] gap-10">
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4 mb-2">
                        <div className="border-2 border-dashed border-slate-500 rounded p-1"><Slot item={player.armor} label="Armadura" className="w-16 h-16 bg-slate-800/50" onClick={(e) => handleSlotClick('armor', 0, e)} /></div>
                        <div className="border-2 border-dashed border-slate-500 rounded p-1"><Slot item={player.tool} label="Ferramenta" className="w-16 h-16 bg-slate-800/50" onClick={(e) => handleSlotClick('tool', 0, e)} /></div>
                        <div className="border-2 border-dashed border-slate-500 rounded p-1"><Slot item={player.weapon} label="Arma" className="w-16 h-16 bg-slate-800/50" onClick={(e) => handleSlotClick('weapon', 0, e)} /></div>
                    </div>
                    <div className="w-full h-32 bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-2 rounded relative"><div className="w-16 h-16 bg-blue-600 border-2 border-black"></div></div>
                    <div className="border-2 border-dashed border-slate-500 rounded p-1 w-max"><Slot item={player.offHand.item} label="2ª Mão" className="w-16 h-16 bg-slate-800/50" onClick={(e) => handleSlotClick('offhand', 0, e)} /></div>
                </div>
                <div className="flex flex-col">
                    <h2 className="text-white text-lg font-bold mb-2 ml-1">Inventário</h2>
                    <div className="grid grid-cols-5 gap-2 bg-slate-900 p-3 rounded border border-slate-700">
                        {player.inventory.slice(0, 20).map((slot, i) => (<Slot key={i} item={slot.item} onClick={(e) => handleSlotClick('inv', i, e)} onContextMenu={(e) => handleRightClick('inv', i, e)} className="w-14 h-14"/>))}
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-white text-lg font-bold mb-2">Criação</h2>
                    <div className="flex flex-col items-center gap-6">
                        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded border border-slate-700">
                            {player.craftingGrid.slice(0, 4).map((slot, i) => (<Slot key={i} item={slot.item} onClick={(e) => handleSlotClick('craft', i, e)} onContextMenu={(e) => handleRightClick('craft', i, e)} className="w-14 h-14"/>))}
                        </div>
                        <div className="text-white text-3xl font-bold">↓</div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700"><Slot item={player.craftingOutput.item} onClick={(e) => handleSlotClick('output', 0, e)} className="w-20 h-20" /></div>
                    </div>
                </div>
                <button onClick={() => setGameState(GameState.PLAYING)} className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold border-2 border-slate-400 text-lg shadow-lg">X</button>
            </div>
            {cursorItem && <div className="fixed pointer-events-none z-[100]" style={{ left: mousePos.x + 10, top: mousePos.y + 10 }}><Slot item={cursorItem} className="border-yellow-400 shadow-lg w-14 h-14" /></div>}
        </div>
    );
};

// ... [Keep CraftingTablePanel, ChestPanel, FurnacePanel, VendorPanel, QuestPanel, EnchantingPanel as they are, no changes needed] ...

const CraftingTablePanel: React.FC<SubPanelProps> = ({ player, handleCraft, setGameState, t, language }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecipes = Object.keys(CRAFTING_RECIPES).filter(itemId => {
        const item = ITEMS[itemId];
        if (!item) return false;
        const name = getItemName(item, language).toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50 select-none">
            <div className="bg-slate-900 border-4 border-slate-600 w-[900px] h-[600px] flex flex-col relative rounded-lg shadow-2xl text-white">
                <div className="text-center text-3xl font-bold py-4 bg-slate-800 border-b-4 border-slate-600">Bancada de Trabalho</div>
                <div className="p-4 bg-slate-800 border-b border-slate-700">
                    <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:outline-none focus:border-yellow-500"
                    />
                </div>
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/2 bg-slate-900 p-4 overflow-y-auto border-r-[6px] border-black custom-scrollbar">
                        <div className="flex flex-col gap-2">
                            {filteredRecipes.map(itemId => {
                                const item = ITEMS[itemId];
                                if (!item) return null;
                                const recipe = CRAFTING_RECIPES[itemId];
                                const canCraft = Object.entries(recipe).every(([resId, amount]) => (player.inventory.reduce((sum, s) => s.item?.id === resId ? sum + s.item.quantity : sum, 0) || 0) >= amount);
                                
                                return (
                                    <div key={itemId} className="flex flex-col p-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button onClick={() => handleCraft(itemId)} disabled={!canCraft} className={`px-4 py-2 rounded font-bold text-sm min-w-[70px] ${canCraft ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-700 text-gray-500 cursor-not-allowed opacity-50'}`}>Criar</button>
                                            <div className="flex-1 ml-2"><span className="font-bold text-white text-lg">{getItemName(item, language)}</span></div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-2">
                                            {Object.entries(recipe).map(([resId, amount]) => {
                                                const resItem = ITEMS[resId];
                                                const playerHas = player.inventory.reduce((sum, s) => s.item?.id === resId ? sum + s.item.quantity : sum, 0);
                                                const hasEnough = playerHas >= amount;
                                                return (
                                                    <span key={resId} className={`text-xs px-2 py-1 rounded bg-black/30 ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                                                        {amount}x {getItemName(resItem, language)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="w-1/2 bg-slate-900 p-4 flex flex-col items-center relative">
                        <h3 className="text-center text-xl text-gray-300 mb-10 font-bold">Inventário</h3>
                        <div className="grid grid-cols-4 gap-3 bg-slate-800 p-4 rounded-lg border border-slate-700">
                            {player.inventory.slice(0, 16).map((slot, i) => (<Slot key={i} item={slot.item} className="w-16 h-16 bg-slate-700/50 border-slate-600"/>))}
                        </div>
                    </div>
                </div>
                <button onClick={() => setGameState(GameState.PLAYING)} className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-10 rounded border-2 border-red-800 shadow-xl">Fechar</button>
            </div>
        </div>
    );
};

const ChestPanel: React.FC<SubPanelProps> = ({ player, activeChest, updatePlayerAndChestInventories, setGameState }) => {
    if (!activeChest || !activeChest.inventory) return null;
    const handleTransfer = (from: 'player' | 'chest', index: number) => {
        const pInv = [...player.inventory];
        const cInv = [...activeChest.inventory!];
        const sourceInv = from === 'player' ? pInv : cInv;
        const targetInv = from === 'player' ? cInv : pInv;
        const itemToMove = sourceInv[index].item;
        if(!itemToMove) return;
        let left = itemToMove.quantity;
        for(let i=0; i<targetInv.length; i++) {
            if(targetInv[i].item?.id === itemToMove.id && targetInv[i].item!.quantity < targetInv[i].item!.maxStack) {
                const add = Math.min(left, targetInv[i].item!.maxStack - targetInv[i].item!.quantity);
                targetInv[i].item!.quantity += add;
                left -= add;
                if(left <= 0) break;
            }
        }
        if(left > 0) {
            for(let i=0; i<targetInv.length; i++) {
                if(!targetInv[i].item) {
                    targetInv[i].item = {...itemToMove, quantity: left};
                    left = 0;
                    break;
                }
            }
        }
        if(left < itemToMove.quantity) {
            if(left === 0) sourceInv[index].item = null;
            else sourceInv[index].item!.quantity = left;
            updatePlayerAndChestInventories(pInv, activeChest.id, cInv);
            playSound(SOUNDS.ITEM_PICKUP);
        }
    };
    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 flex flex-col gap-6 text-white max-w-4xl">
                <div><h2 className="text-xl mb-2 font-bold text-center">Baú</h2><div className="grid grid-cols-8 gap-2 bg-slate-900 p-4 rounded-lg">{activeChest.inventory.map((slot, i) => (<Slot key={i} item={slot.item} onClick={() => handleTransfer('chest', i)} />))}</div></div>
                <div><h2 className="text-xl mb-2 font-bold text-center">Inventário</h2><div className="grid grid-cols-8 gap-2 bg-slate-900 p-4 rounded-lg">{player.inventory.map((slot, i) => (<Slot key={i} item={slot.item} onClick={() => handleTransfer('player', i)} />))}</div></div>
                <button onClick={() => setGameState(GameState.PLAYING)} className="self-center bg-red-600 px-8 py-2 rounded font-bold">Fechar</button>
            </div>
        </div>
    );
};

const FurnacePanel: React.FC<SubPanelProps> = ({ player, activeFurnace, updatePlayerAndFurnaceInventories, setGameState }) => {
    if (!activeFurnace || !activeFurnace.inventory) return null;
    const handleTransfer = (from: 'player' | 'furnace', index: number) => {
        const pInv = [...player.inventory];
        const fInv = [...activeFurnace.inventory!];
        if (from === 'player') {
            const item = pInv[index].item;
            if (!item) return;
            let targetSlotIndex = -1;
            if (item.type === 'fuel' || item.fuelTime) targetSlotIndex = 1;
            else if (item.smeltResult || item.type === 'smeltable' || ['sand', 'clay', 'cactus', 'food', 'raw_meat', 'fish'].includes(item.id) || item.id.includes('_ore')) targetSlotIndex = 0;
            if (targetSlotIndex !== -1) {
                const targetItem = fInv[targetSlotIndex].item;
                if (targetItem && targetItem.id === item.id && targetItem.quantity < targetItem.maxStack) {
                    const toAdd = Math.min(item.quantity, targetItem.maxStack - targetItem.quantity);
                    targetItem.quantity += toAdd;
                    item.quantity -= toAdd;
                    if (item.quantity <= 0) pInv[index].item = null;
                } else if (!targetItem) {
                    fInv[targetSlotIndex].item = { ...item };
                    pInv[index].item = null;
                }
                updatePlayerAndFurnaceInventories(pInv, activeFurnace.id, fInv);
                playSound(SOUNDS.ITEM_PICKUP);
            }
        } else {
            const item = fInv[index].item;
            if (!item) return;
            let quantityLeft = item.quantity;
            for (let i = 0; i < pInv.length; i++) {
                if (pInv[i].item?.id === item.id && pInv[i].item!.quantity < pInv[i].item!.maxStack) {
                    const toAdd = Math.min(quantityLeft, pInv[i].item!.maxStack - pInv[i].item!.quantity);
                    pInv[i].item!.quantity += toAdd;
                    quantityLeft -= toAdd;
                    if (quantityLeft <= 0) break;
                }
            }
            if (quantityLeft > 0) {
                for (let i = 0; i < pInv.length; i++) {
                    if (!pInv[i].item) {
                        pInv[i].item = { ...item, quantity: quantityLeft };
                        quantityLeft = 0;
                        break;
                    }
                }
            }
            if (quantityLeft < item.quantity) {
                if (quantityLeft === 0) fInv[index].item = null;
                else fInv[index].item!.quantity = quantityLeft;
                updatePlayerAndFurnaceInventories(pInv, activeFurnace.id, fInv);
                playSound(SOUNDS.ITEM_PICKUP);
            }
        }
    };
    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50 select-none">
            <div className="bg-slate-900 border-4 border-slate-600 p-8 rounded-lg shadow-2xl flex gap-8 text-white relative min-w-[800px] min-h-[500px]">
                <button onClick={() => setGameState(GameState.PLAYING)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold">X</button>
                <div className="flex-1 flex flex-col">
                    <h2 className="text-3xl font-bold mb-8 pl-4">Fornalha</h2>
                    <div className="flex items-center justify-center gap-8 mt-4">
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col items-center"><span className="text-sm text-gray-400 mb-1">Entrada</span><Slot item={activeFurnace.inventory[0].item} onClick={() => handleTransfer('furnace', 0)} className="w-16 h-16 bg-slate-800 border-slate-600" /></div>
                            <div className="flex flex-col items-center"><span className="text-sm text-gray-400 mb-1">Combustível</span><Slot item={activeFurnace.inventory[1].item} onClick={() => handleTransfer('furnace', 1)} className="w-16 h-16 bg-slate-800 border-slate-600" /></div>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className={`text-3xl transition-opacity duration-500 ${activeFurnace.fuelLeft && activeFurnace.fuelLeft > 0 ? 'opacity-100' : 'opacity-20'}`}>🔥</div>
                            <div className="relative"><div className="text-6xl text-slate-700 select-none">➜</div><div className="absolute top-0 left-0 text-6xl text-white overflow-hidden select-none" style={{ width: `${Math.min(100, (activeFurnace.smeltProgress || 0) / SMELT_TIME * 100)}%` }}>➜</div></div>
                        </div>
                        <div className="flex flex-col items-center"><Slot item={activeFurnace.inventory[2].item} onClick={() => handleTransfer('furnace', 2)} className="w-24 h-24 bg-slate-800 border-slate-600" /></div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col border-l-2 border-slate-700 pl-8">
                    <h2 className="text-xl font-bold mb-4 text-center">Inventário</h2>
                    <div className="grid grid-cols-5 gap-2">{player.inventory.slice(0, 20).map((slot, i) => (<Slot key={i} item={slot.item} onClick={() => handleTransfer('player', i)} className="w-14 h-14 bg-slate-800 border-slate-600" />))}</div>
                </div>
            </div>
        </div>
    );
};

const VendorPanel: React.FC<SubPanelProps> = ({ player, setPlayer, setGameState, t, language }) => {
    const buyItem = (itemId: string) => {
        const price = VENDOR_ITEMS[itemId].price;
        if (player.money >= price) {
            setPlayer(p => {
                const newInv = [...p.inventory];
                let added = false;
                const itemToAdd = ITEMS[itemId];
                if (itemToAdd.stackable) {
                    for(const slot of newInv) {
                        if(slot.item?.id === itemId && slot.item.quantity < slot.item.maxStack) {
                            slot.item.quantity++;
                            added = true;
                            break;
                        }
                    }
                }
                if (!added) {
                    for(const slot of newInv) {
                        if(!slot.item) {
                            slot.item = { ...itemToAdd, quantity: 1 };
                            added = true;
                            break;
                        }
                    }
                }
                if (added) {
                    playSound(SOUNDS.BUY_ITEM);
                    return { ...p, inventory: newInv, money: p.money - price };
                }
                return p;
            });
        }
    };
    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 w-3/4 h-3/4 flex flex-col text-white">
                <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold">Loja do Claudio</h2><div className="text-yellow-400 font-bold text-xl">Moedas: {player.money}</div></div>
                <div className="grid grid-cols-4 gap-4 overflow-y-auto p-4 bg-slate-900 rounded flex-1">
                    {Object.keys(VENDOR_ITEMS).map(itemId => (
                        <div key={itemId} onClick={() => buyItem(itemId)} className="bg-slate-700 p-4 rounded border border-slate-600 hover:bg-slate-600 cursor-pointer flex flex-col items-center">
                            <span className="font-bold">{getItemName(ITEMS[itemId], language)}</span>
                            <span className="text-yellow-400 font-bold">${VENDOR_ITEMS[itemId].price}</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState(GameState.PLAYING)} className="mt-4 bg-red-600 px-8 py-2 rounded font-bold self-center">Sair</button>
            </div>
        </div>
    );
};

const QuestPanel: React.FC<SubPanelProps> = ({ player, setPlayer, setGameState, t, language }) => {
    const acceptQuest = (quest: Quest) => {
        setPlayer(p => ({ ...p, activeQuest: quest }));
        setGameState(GameState.PLAYING);
        playSound(SOUNDS.UI_CLICK);
    };
    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-600 text-white max-w-2xl w-full">
                <h2 className="text-3xl font-bold mb-6 text-center">Missões</h2>
                <div className="space-y-4">
                    {QUEST_LIST.map(quest => (
                        <div key={quest.id} className="bg-slate-700 p-4 rounded flex justify-between items-center">
                            <div><h3 className="font-bold text-lg">{language === Language.PT ? quest.description_pt : quest.description_en}</h3><p className="text-yellow-400">Recompensa: {quest.rewardMin}-{quest.rewardMax} Moedas</p></div>
                            <button onClick={() => acceptQuest(quest)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 font-bold">Aceitar</button>
                        </div>
                    ))}
                </div>
                <button onClick={() => setGameState(GameState.PLAYING)} className="mt-8 w-full bg-red-600 py-3 rounded font-bold text-xl">Fechar</button>
            </div>
        </div>
    );
};

const EnchantingPanel: React.FC<SubPanelProps> = ({ player, setPlayer, setGameState, handleEnchant, updatePlayerAndEnchantingSlots, enchantmentOptions, setEnchantmentOptions, language, t }) => {
    
    // Generate options when items are present
    useEffect(() => {
        const item = player.enchantingSlots[0].item;
        const crystal = player.enchantingSlots[1].item;

        if (item && crystal && enchantmentOptions.length === 0) {
            
            const itemType = item.type;
            const toolType = (item as Tool).toolType;

            const possibleEnchants = Object.values(ENCHANTMENT_DATA).filter(ench => {
                const type = (ench as any).type as Enchantment; // Assuming enum key matches, but we need the enum key from constant
                // Re-find the enum key for this data object
                const enumKey = Object.keys(ENCHANTMENT_DATA).find(key => ENCHANTMENT_DATA[key as Enchantment] === ench) as Enchantment;
                
                // --- STRICT FILTERING ---
                if (itemType === 'weapon' && toolType === 'sword') {
                    // Sword: Sharpness, Looting, Unbreaking, Mending, Knockback
                    return [Enchantment.SHARPNESS, Enchantment.LOOTING, Enchantment.UNBREAKING, Enchantment.MENDING, Enchantment.KNOCKBACK].includes(enumKey);
                } 
                
                if (itemType === 'tool' || toolType === 'axe' || toolType === 'pickaxe') {
                    // Tool/Axe/Pickaxe: Efficiency, Unbreaking, Mending
                    // Explicitly exclude Sharpness from Axe if strict
                    return [Enchantment.EFFICIENCY, Enchantment.UNBREAKING, Enchantment.MENDING].includes(enumKey);
                }

                if (itemType === 'armor') {
                    return [Enchantment.PROTECTION, Enchantment.THORNS, Enchantment.UNBREAKING, Enchantment.MENDING].includes(enumKey);
                }

                if (itemType === 'shield') {
                    return [Enchantment.UNBREAKING, Enchantment.MENDING].includes(enumKey);
                }

                if (['pistol', 'rifle', 'ak47', 'bow', 'bazooka'].includes(toolType || '')) {
                     // Ranged weapons
                     // Maybe Homing?
                     return [Enchantment.HOMING, Enchantment.UNBREAKING, Enchantment.MENDING].includes(enumKey);
                }

                return false;
            });

            if (possibleEnchants.length > 0) {
                const newOptions: EnchantmentOption[] = [];
                for (let i = 0; i < 3; i++) {
                    const data = possibleEnchants[Math.floor(Math.random() * possibleEnchants.length)];
                    const randomEnchKey = Object.keys(ENCHANTMENT_DATA).find(key => ENCHANTMENT_DATA[key as Enchantment] === data) as Enchantment;
                    
                    const level = Math.ceil(Math.random() * data.maxLevel);
                    
                    const desc = language === Language.PT ? data.description_pt : data.description_en;
                    const name = language === Language.PT ? data.name_pt : data.name_en;
                    
                    newOptions.push({
                        enchantment: { type: randomEnchKey, level },
                        description: `${name} ${'I'.repeat(level)}`
                    });
                }
                setEnchantmentOptions(newOptions);
            } else {
                 // No valid enchants found
                 setEnchantmentOptions([]);
            }

        } else if (!item || !crystal) {
            setEnchantmentOptions([]);
        }
    }, [player.enchantingSlots, enchantmentOptions.length, setEnchantmentOptions, language]);

    const handleTransfer = (index: number) => {
        // Move from inventory to enchanting slots
        const pInv = [...player.inventory];
        const eSlots = [...player.enchantingSlots];
        const item = pInv[index].item;
        
        if (!item) return;

        // Slot 0: Item, Slot 1: Crystal (Ruby Crystal usually, or Lapis in MC, here assumes Ruby/Crystal item)
        // Check if item is crystal
        if (item.id === 'ruby_crystal' || item.id === 'ruby') { // Assuming ruby is the catalyst
             if (!eSlots[1].item) {
                 eSlots[1].item = { ...item };
                 pInv[index].item = null;
             } else if (eSlots[1].item.id === item.id && eSlots[1].item.quantity < eSlots[1].item.maxStack) {
                 // Stack logic omitted for brevity in UI, usually just swap or fill
                 // Simple swap/fill
             }
        } else {
            // Put in item slot
            if (!eSlots[0].item) {
                eSlots[0].item = { ...item };
                pInv[index].item = null;
            }
        }
        updatePlayerAndEnchantingSlots(pInv, eSlots);
    };

    const returnItem = (slotIndex: number) => {
        const pInv = [...player.inventory];
        const eSlots = [...player.enchantingSlots];
        const item = eSlots[slotIndex].item;
        if (!item) return;

        // Find space
        for (let i = 0; i < pInv.length; i++) {
            if (!pInv[i].item) {
                pInv[i].item = item;
                eSlots[slotIndex].item = null;
                updatePlayerAndEnchantingSlots(pInv, eSlots);
                return;
            }
        }
    };

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50 select-none">
            <div className="bg-slate-900 border-4 border-slate-600 rounded-lg shadow-2xl flex w-[900px] h-[500px] text-white">
                
                {/* Left Side: Slots + Inventory */}
                <div className="w-1/2 p-6 border-r-4 border-black flex flex-col">
                    {/* Top Slots */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="flex gap-2">
                            <Slot item={player.enchantingSlots[0].item} onClick={() => returnItem(0)} className="w-16 h-16 bg-slate-800 border-slate-500" label="Item" />
                            <Slot item={player.enchantingSlots[1].item} onClick={() => returnItem(1)} className="w-16 h-16 bg-slate-800 border-slate-500" label="Cristal" />
                        </div>
                        <div className="text-4xl text-black">➡</div>
                    </div>

                    <div className="bg-black h-1 w-full mb-4"></div>

                    {/* Inventory */}
                    <h3 className="text-center mb-2">Inventário</h3>
                    <div className="grid grid-cols-5 gap-2 bg-slate-800 p-2 rounded">
                        {player.inventory.slice(0, 20).map((slot, i) => (
                            <Slot key={i} item={slot.item} onClick={() => handleTransfer(i)} className="w-12 h-12 border-slate-600" />
                        ))}
                    </div>
                </div>

                {/* Right Side: Options */}
                <div className="w-1/2 p-6 bg-slate-900 relative">
                    <h2 className="text-2xl font-bold mb-4 text-center">Mesa de Encantamentos</h2>
                    
                    <div className="flex flex-col gap-4">
                        {enchantmentOptions.length > 0 ? (
                            enchantmentOptions.map((opt, idx) => {
                                // Check if clickable
                                const currentItem = player.enchantingSlots[0].item;
                                const alreadyHas = currentItem?.enchantments?.some(e => e.type === opt.enchantment.type);
                                const isFull = (currentItem?.enchantments?.length || 0) >= 3;
                                const disabled = alreadyHas || isFull;

                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => !disabled && handleEnchant(opt.enchantment)}
                                        className={`p-4 border-2 rounded cursor-pointer transition-colors flex justify-between items-center
                                            ${disabled ? 'bg-slate-800 border-slate-700 text-gray-500 cursor-not-allowed' : 'bg-slate-800 border-yellow-600 hover:bg-slate-700 hover:border-yellow-400'}
                                        `}
                                    >
                                        <span className="font-bold text-lg">{opt.description}</span>
                                        <span className="text-sm bg-black px-2 py-1 rounded text-purple-400">?</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-gray-500 text-center mt-10 italic">
                                Coloque um item e um cristal para ver os encantamentos.
                            </div>
                        )}
                    </div>

                    {/* Preview Box (Visual filler from reference) */}
                    <div className="absolute bottom-6 left-6 right-6 h-32 bg-black border-2 border-slate-700 rounded opacity-50"></div>
                </div>

                <button onClick={() => setGameState(GameState.PLAYING)} className="absolute -top-4 -right-4 bg-red-600 w-10 h-10 rounded-full border-2 border-white font-bold flex items-center justify-center">X</button>
            </div>
        </div>
    );
};

const PortalPanel: React.FC<SubPanelProps> = ({ player, activePortal, updatePlayerAndPortalInventories, setGameState, enterRubyDimension, language }) => {
    if (!activePortal || !activePortal.inventory) return null;

    const requirements = PORTAL_REQUIREMENTS['RUBY'];
    const currentInventory = activePortal.inventory;

    // Check if requirements are met
    const satisfied = Object.entries(requirements).every(([reqId, reqQty]) => {
        const total = currentInventory.reduce((sum, slot) => slot.item?.id === reqId ? sum + slot.item.quantity : sum, 0);
        return total >= reqQty;
    });

    const handleTransfer = (from: 'player' | 'portal', index: number) => {
        const pInv = [...player.inventory];
        const portalInv = [...activePortal.inventory];
        
        const sourceInv = from === 'player' ? pInv : portalInv;
        const targetInv = from === 'player' ? portalInv : pInv;
        
        const itemToMove = sourceInv[index].item;
        
        if (!itemToMove) return;

        // Simple stack transfer logic
        let left = itemToMove.quantity;
        
        // Try to stack existing
        for (let i = 0; i < targetInv.length; i++) {
            if (targetInv[i].item?.id === itemToMove.id && targetInv[i].item!.quantity < targetInv[i].item!.maxStack) {
                const available = targetInv[i].item!.maxStack - targetInv[i].item!.quantity;
                const toAdd = Math.min(left, available);
                targetInv[i].item!.quantity += toAdd;
                left -= toAdd;
                if (left <= 0) break;
            }
        }
        
        // Use empty slot
        if (left > 0) {
            for (let i = 0; i < targetInv.length; i++) {
                if (!targetInv[i].item) {
                    targetInv[i].item = { ...itemToMove, quantity: left };
                    left = 0;
                    break;
                }
            }
        }

        // Update source
        if (left < itemToMove.quantity) {
            if (left === 0) sourceInv[index].item = null;
            else sourceInv[index].item!.quantity = left;
            
            updatePlayerAndPortalInventories(pInv, activePortal.id, portalInv);
            playSound(SOUNDS.ITEM_PICKUP);
        }
    };

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50 select-none">
            <div className="bg-slate-800 border-2 border-slate-600 rounded-lg p-6 w-[800px] h-[500px] flex flex-col relative shadow-2xl">
                
                {/* Header */}
                <div className="flex justify-between px-10 mb-4 text-xl font-normal text-white">
                    <span>Inventário</span>
                    <span className="mr-8">Oferenda do Portal</span>
                </div>

                {/* Content Grid */}
                <div className="flex justify-between px-4">
                    {/* Player Inventory - 4x5 Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {player.inventory.slice(0, 20).map((slot, i) => (
                            <Slot 
                                key={i} 
                                item={slot.item} 
                                onClick={() => handleTransfer('player', i)}
                                className="w-14 h-14 bg-slate-700/50 border-slate-600 rounded" 
                            />
                        ))}
                    </div>

                    {/* Spacer */}
                    <div className="w-10"></div>

                    {/* Portal Inventory - 1x5 Grid */}
                    <div className="flex flex-col w-[350px]">
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {activePortal.inventory.slice(0, 5).map((slot, i) => (
                                <Slot 
                                    key={i} 
                                    item={slot.item} 
                                    onClick={() => handleTransfer('portal', i)}
                                    className="w-14 h-14 bg-slate-700/50 border-purple-500 rounded" 
                                />
                            ))}
                        </div>

                        {/* Requirements List */}
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-700 h-full">
                            <h4 className="text-gray-400 mb-2 text-sm uppercase font-bold text-center">Requirements</h4>
                            <div className="space-y-1">
                                {Object.entries(requirements).map(([reqId, reqQty]) => {
                                    const itemDef = ITEMS[reqId];
                                    const currentQty = currentInventory.reduce((sum, slot) => slot.item?.id === reqId ? sum + slot.item.quantity : sum, 0);
                                    const isMet = currentQty >= reqQty;
                                    
                                    return (
                                        <div key={reqId} className={`flex justify-between text-sm ${isMet ? 'text-green-400' : 'text-red-400'}`}>
                                            <span>{getItemName(itemDef, language)}</span>
                                            <span>{currentQty}/{reqQty}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    {satisfied ? (
                        <button 
                            onClick={() => { playSound(SOUNDS.PORTAL_ACTIVATE); enterRubyDimension(); }}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded shadow-lg animate-pulse"
                        >
                            Entrar na Dimensão
                        </button>
                    ) : (
                        <button 
                            onClick={() => setGameState(GameState.PLAYING)} 
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded shadow-lg"
                        >
                            Fechar (Q/Esc)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const LoadingScreen: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-black pointer-events-none z-[100] flex flex-col justify-between p-4">
            <div className="absolute top-4 left-4 text-blue-500 font-bold text-5xl tracking-tighter">
                BAL GAMES
            </div>
            
            <div className="absolute bottom-4 right-4 flex items-center gap-4">
                <span className="text-white text-xl font-bold tracking-widest uppercase">CARREGANDO ...</span>
                <div className="w-16 h-16 border-8 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
};

const NamingPanel: React.FC<{
    dogBeingNamed: Dog;
    handleNamePet: (id: string, name: string) => void;
}> = ({ dogBeingNamed, handleNamePet }) => {
    const [name, setName] = useState('');

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-600 text-white text-center">
                <h2 className="text-2xl font-bold mb-4">Nomear Pet</h2>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Digite o nome..." 
                    className="p-2 rounded text-black mb-4 w-full"
                    autoFocus
                />
                <button 
                    onClick={() => handleNamePet(dogBeingNamed.id, name || 'Rex')} 
                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold"
                >
                    Confirmar
                </button>
            </div>
        </div>
    );
};

const MainMenu: React.FC<{
    onPlay: () => void;
    onContinue: () => void;
    saveExists: boolean;
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}> = ({ onPlay, onContinue, saveExists, t, language, setLanguage }) => {
    
    const handleAction = (action: () => void) => {
        playSound(SOUNDS.UI_CLICK);
        initAudioManager();
        action();
    }

    return (
      <div className="absolute inset-0 bg-[#252b2a] flex flex-col items-center justify-center text-white pointer-events-auto select-none font-sans">
        
        {/* Title Section */}
        <div className="flex flex-col items-center mb-10">
            <span className="text-gray-200 text-2xl mb-2 font-medium tracking-wide" style={{ fontFamily: 'sans-serif' }}>o começo</span>
            <div className="flex items-end gap-3">
                <div className="flex items-end">
                    <h1 className="text-9xl font-black mb-0 drop-shadow-xl text-[#e73636]" style={{ textShadow: '6px 6px 0px #000' }}>
                        Zomb
                    </h1>
                    {/* Blue Block 'i' */}
                    <div className="w-12 h-20 bg-[#0f172a] mb-3 mx-1 relative"> 
                         <div className="absolute inset-0 bg-[#1e3a8a]" style={{ boxShadow: '4px 4px 0px #000' }}></div>
                    </div>
                    <h1 className="text-9xl font-black mb-0 drop-shadow-xl text-[#e73636]" style={{ textShadow: '6px 6px 0px #000' }}>
                        eCraft
                    </h1>
                </div>
                <h1 className="text-9xl font-black text-[#facc15] drop-shadow-xl" style={{ textShadow: '6px 6px 0px #000' }}>2</h1>
            </div>
            <h2 className="text-4xl text-gray-300 tracking-widest mt-4 font-normal" style={{ textShadow: '2px 2px 0px #000' }}>Survivors</h2>
            <h3 className="text-8xl font-bold text-[#facc15] mt-8" style={{ textShadow: '4px 4px 0px #000' }}>demo</h3>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex gap-6">
                <button 
                    onClick={() => handleAction(onPlay)} 
                    className="bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-3 px-10 rounded shadow-[0_4px_0_#1e8449] active:shadow-none active:translate-y-[4px] transition-all text-2xl w-52"
                >
                    Jogar
                </button>
                <button 
                    onClick={() => saveExists ? handleAction(onContinue) : null} 
                    className={`bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 px-10 rounded shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-[4px] transition-all text-2xl w-52 ${!saveExists ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    saves
                </button>
            </div>
            <button 
                onClick={() => { playSound(SOUNDS.UI_CLICK); setLanguage(language === Language.EN ? Language.PT : Language.EN); }} 
                className="bg-[#525252] hover:bg-[#404040] text-gray-200 font-bold py-3 px-10 rounded shadow-[0_4px_0_#262626] active:shadow-none active:translate-y-[4px] transition-all text-xl w-40 mt-2"
            >
                opções
            </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 text-sm text-gray-400 font-medium">
            todos os direitos reservados, bal games 2025.
        </div>
        <div className="absolute bottom-4 right-4 text-sm text-gray-400 font-medium">
            versão demo: 0.0.0
        </div>
      </div>
    );
};

const HUD: React.FC<{ player: Player; day: number; isNight: boolean; timeInCycle: number; isBloodMoon: boolean; isRaining: boolean; setGameState: (state: GameState) => void; creativeMode: boolean; showSaveMessage: boolean; t: (key: string) => string; language: Language; currentBiome: Biome; isNearReturnPortal: boolean; collectingState: CollectingState | null; }> = ({ player, day, isNight, timeInCycle, isBloodMoon, isRaining, setGameState, creativeMode, showSaveMessage, t, language, currentBiome, isNearReturnPortal, collectingState }) => {
    const cycleDuration = isNight ? (isBloodMoon ? BLOOD_MOON_DURATION_MS : NIGHT_DURATION_MS) : DAY_DURATION_MS;
    const timePercentage = (timeInCycle / cycleDuration) * 100;
    const equippedWeapon = player.weapon;
    const isFirearm = equippedWeapon && ['pistol', 'rifle', 'ak47'].includes(equippedWeapon.toolType);
    const shield = player.offHand.item?.type === 'shield' ? player.offHand.item : null;

    return (
        <div className="w-full h-full relative pointer-events-none">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 p-2 rounded-lg text-center">
                <p className="text-xl font-bold">{t('day')} {day} {creativeMode && <span className="text-purple-400">{t('creative')}</span>}</p>
                 <p className="text-sm text-gray-300">{t('biome')}: {currentBiome}</p>
                 {isBloodMoon && <p className="text-red-500 font-bold animate-pulse">{t('bloodMoon')}</p>}
                 {isRaining && <p className="text-blue-400 font-bold">{t('rain')}</p>}
                 {player.dimension === 'OVERWORLD' && <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-yellow-400" style={{ width: `${isNight ? 100-timePercentage : timePercentage}%` }}></div>
                </div>}
            </div>

            {isNearReturnPortal && (
                 <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-purple-800 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                    {t('returnToOverworld')}
                </div>
            )}
            
            {player.activeQuest && (
                <div className="absolute top-1/4 right-4 bg-yellow-800 bg-opacity-70 p-3 rounded-lg border-2 border-yellow-600">
                    <h3 className="text-lg font-bold text-yellow-300">{t('objective')}</h3>
                    <p>{language === Language.PT ? player.activeQuest.description_pt : player.activeQuest.description_en}</p>
                </div>
            )}
            
            {player.discountEffect && (
                 <div className="absolute top-1/4 left-4 bg-green-800 bg-opacity-70 p-3 rounded-lg border-2 border-green-600">
                    <h3 className="text-lg font-bold text-green-300">Vigor Active!</h3>
                    <p>50% Store Discount</p>
                </div>
            )}

            {showSaveMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                    {t('gameSaved')}
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-4 rounded-lg w-72 space-y-2">
                 <div>
                    <span className="text-red-500 font-bold">{t('hp')}:</span>
                    <div className="w-full bg-gray-700 rounded-full h-5">
                        <div className="bg-red-600 h-5 rounded-full" style={{ width: `${creativeMode ? 100 : (player.hp / player.maxHp) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <span className="text-blue-500 font-bold">{t('stamina')}:</span>
                    <div className="w-full bg-gray-700 rounded-full h-5">
                        <div className="bg-blue-500 h-5 rounded-full" style={{ width: `${creativeMode ? 100 : (player.stamina / player.maxStamina) * 100}%` }}></div>
                    </div>
                </div>
                 <div>
                    <span className="text-yellow-400 font-bold">{t('energy')}:</span>
                    <div className="w-full bg-gray-700 rounded-full h-5">
                        <div className="bg-yellow-400 h-5 rounded-full" style={{ width: `${creativeMode ? 100 : (player.energy / player.maxEnergy) * 100}%` }}></div>
                    </div>
                </div>
                {shield && shield.durability && shield.durability > 0 && shield.maxDurability && (
                     <div>
                        <span className="text-gray-400 font-bold">{t('shield')}:</span>
                        <div className="w-full bg-gray-700 rounded-full h-5">
                            <div className="bg-gray-400 h-5 rounded-full" style={{ width: `${(shield.durability / shield.maxDurability) * 100}%` }}></div>
                        </div>
                    </div>
                )}
                <div className="text-yellow-600 font-bold">{t('yourCoins')}: {player.money}</div>
                {isFirearm && (
                     <div>
                        <span className="text-yellow-500 font-bold">{t('ammo')}: {player.ammo}</span>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 pointer-events-auto">
                {player.inventory.slice(0, HOTBAR_SLOTS).map((slot, index) => (
                    <div key={index} className={`w-16 h-16 bg-gray-800 bg-opacity-70 border-2 rounded-lg flex items-center justify-center relative ${player.activeSlot === index ? 'border-yellow-400 scale-110' : 'border-gray-500'}`}>
                        {slot.item && (
                            <>
                                <div className='w-full h-full flex flex-col items-center justify-center p-1'>
                                    <span className={`text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full text-center ${slot.item.enchantments && slot.item.enchantments.length > 0 ? 'text-purple-400' : ''}`} title={getItemName(slot.item, language)}>{getItemName(slot.item, language)}</span>
                                    <span className='text-lg font-bold'>{slot.item.quantity}</span>
                                </div>
                                {slot.item.durability !== undefined && slot.item.maxDurability !== undefined && (
                                     <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10/12 h-1.5 bg-gray-900 rounded-full">
                                        <div
                                            className={`h-full rounded-full ${getDurabilityColor(slot.item.durability, slot.item.maxDurability)}`}
                                            style={{ width: `${(slot.item.durability / slot.item.maxDurability) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                            </>
                        )}
                        <span className="absolute bottom-0 right-1 text-xs">{index + 1}</span>
                    </div>
                ))}
            </div>

            {/* Collecting Progress Bar */}
            {collectingState && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16 w-40 h-4 bg-gray-800 border-2 border-white rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 origin-left transition-all duration-75" style={{ width: `${collectingState.progress * 100}%` }}></div>
                </div>
            )}

             <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.SHOP); }} className="absolute bottom-24 right-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg hidden pointer-events-auto">{t('shop')}</button>
        </div>
    );
};

const CreativePanel: React.FC<SubPanelProps> = (props) => {
    const handleClick = (action: () => void) => {
        playSound(SOUNDS.UI_CLICK);
        action();
    };
    return (
        <div className="absolute top-1/4 left-4 bg-gray-800 bg-opacity-80 p-4 rounded-lg w-72 text-sm space-y-2 overflow-y-auto max-h-[70vh] pointer-events-auto">
            <h3 className="text-lg font-bold text-purple-400 text-center">{props.t('creativeTools')}</h3>
            
            {/* Added requested buttons */}
            <button onClick={() => handleClick(props.clearInventory)} className="w-full bg-red-700 hover:bg-red-800 p-2 rounded font-bold">Clear Inventory</button>
            <button onClick={() => handleClick(props.killAllZombies)} className="w-full bg-orange-700 hover:bg-orange-800 p-2 rounded font-bold">Kill All Zombies</button>
            <button onClick={() => handleClick(() => props.spawnZombie(ZombieType.NORMAL))} className="w-full bg-green-700 hover:bg-green-800 p-2 rounded font-bold">Spawn Zombie</button>

            <button onClick={() => handleClick(() => props.setGameState(GameState.CREATIVE_INVENTORY))} className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded">{props.t('itemMenu')}</button>
            <div className='text-center'>
                <p className={props.noclip ? 'text-green-400' : 'text-red-400'}>{props.t('flyNoclip')}: {props.noclip ? props.t('on') : props.t('off')}</p>
                <p className={props.invisible ? 'text-green-400' : 'text-red-400'}>{props.t('invisibility')}: {props.invisible ? props.t('on') : props.t('off')}</p>
            </div>
            {/* World Controls */}
            <div>
                 <h4 className="font-bold">{props.t('worldControls')}</h4>
                 <div className="grid grid-cols-2 gap-2 mt-1">
                    <button onClick={() => handleClick(() => { props.setDay((d: number) => d + 1); props.setTimeInCycle(0); props.setIsNight(false); })} className={`bg-gray-600 hover:bg-gray-700 p-1 rounded`}>{props.t('skipDay')}</button>
                    <button onClick={() => handleClick(() => props.setIsNight((n: boolean) => !n))} className={`bg-gray-600 hover:bg-gray-700 p-1 rounded`}>{props.t('toggleDayNight')}</button>
                    <button onClick={() => handleClick(props.toggleBloodMoon)} className={`${props.isBloodMoon ? 'bg-red-800 hover:bg-red-900' : 'bg-gray-600 hover:bg-gray-700'} p-1 rounded`}>{props.t('bloodMoon')}</button>
                    <button onClick={() => handleClick(() => {
                        // Toggle rain handled via hook in parent usually, but here we just flip state if possible or use prop
                        // App passes toggleRain, usage:
                        props.toggleRain();
                    })} className={`${props.isRaining ? 'bg-blue-800 hover:bg-blue-900' : 'bg-gray-600 hover:bg-gray-700'} p-1 rounded`}>{props.t('rain')}</button>
                 </div>
            </div>
            {/* Player Cheats */}
            <div>
                <h4 className="font-bold">{props.t('playerCheats')}</h4>
                <div className="grid grid-cols-3 gap-1 mt-1">
                    <button onClick={() => handleClick(() => props.setPlayer((p: Player) => ({...p, hp: p.maxHp})))} className="bg-green-700 hover:bg-green-800 p-1 rounded">{props.t('heal')}</button>
                    <button onClick={() => handleClick(() => props.setPlayer((p: Player) => ({...p, stamina: p.maxStamina, energy: p.maxEnergy})))} className="bg-blue-700 hover:bg-blue-800 p-1 rounded">{props.t('maxStats')}</button>
                    <button onClick={() => handleClick(() => props.setPlayer((p: Player) => ({...p, money: p.money + 100})))} className="bg-yellow-600 hover:bg-yellow-700 p-1 rounded">{props.t('giveMoney')}</button>
                    <button onClick={() => handleClick(() => props.setPlayer((p: Player) => ({...p, ammo: p.ammo + 50})))} className="bg-yellow-700 hover:bg-yellow-800 p-1 rounded">{props.t('giveAmmo')}</button>
                </div>
            </div>
             {/* Teleport */}
             <div>
                <h4 className="font-bold">{props.t('teleport')}</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <button onClick={() => handleClick(() => props.teleportPlayer({x:WORLD_WIDTH/2, y:WORLD_HEIGHT/2}))} className="bg-blue-600 hover:bg-blue-700 p-1 rounded">{props.t('center')}</button>
                    <button onClick={() => handleClick(() => props.teleportPlayer({x:100, y:100}))} className="bg-blue-600 hover:bg-blue-700 p-1 rounded">{props.t('border')}</button>
                </div>
            </div>
        </div>
    );
};

const CreativeInventoryPanel: React.FC<SubPanelProps> = ({ setGameState, giveCreativeItem, t, language }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = CREATIVE_ITEMS.filter(item => 
        getItemName(item, language).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center p-4 pointer-events-auto z-50">
            <h2 className="text-4xl font-bold mb-4">{t('inventory')}</h2>
            <div className="w-full max-w-4xl mb-4">
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
                />
            </div>
            <div className="w-full max-w-4xl h-[60vh] bg-gray-800 rounded-lg p-4 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                    {filteredItems.map(item => (
                        <div key={item.id} title={getItemName(item, language)} onClick={() => giveCreativeItem(item)}
                            className="w-20 h-20 bg-gray-700 hover:bg-gray-600 rounded flex flex-col items-center justify-center p-1 cursor-pointer border border-gray-600">
                            <span className="text-xs text-center truncate w-full">{getItemName(item, language)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={() => setGameState(GameState.PLAYING)} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">{t('close')}</button>
        </div>
    );
};

const CavernConfirmUI: React.FC<{
    enterCavern: () => void;
    returnFromCavern: () => void;
    setGameState: (state: GameState) => void;
    targetDimension: 'CAVERN' | 'OVERWORLD';
    t: (key: string) => string;
}> = ({ enterCavern, returnFromCavern, setGameState, targetDimension, t }) => {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white pointer-events-auto z-50">
            <h2 className="text-3xl mb-8">{targetDimension === 'CAVERN' ? t('cavernConfirm') : t('cavernReturnConfirm')}</h2>
            <div className="flex gap-4">
                <button 
                    onClick={() => {
                        playSound(SOUNDS.PORTAL_ACTIVATE);
                        if (targetDimension === 'CAVERN') enterCavern();
                        else returnFromCavern();
                        setGameState(GameState.PLAYING);
                    }} 
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded text-xl font-bold"
                >
                    {t('yes')}
                </button>
                <button 
                    onClick={() => setGameState(GameState.PLAYING)} 
                    className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded text-xl font-bold"
                >
                    {t('no')}
                </button>
            </div>
        </div>
    );
};

const GameUI: React.FC<GameUIProps> = (props) => {
  const { gameState, setGameState, language, setLanguage, player, saveExists, startNewGame, loadGame, activePortal } = props;

  const t = (key: string) => {
      const translation = translations[language][key];
      return translation || key;
  };

  if (gameState === GameState.MENU) {
      return <MainMenu onPlay={startNewGame} onContinue={loadGame} saveExists={saveExists} t={t} language={language} setLanguage={setLanguage} />;
  }

  if (gameState === GameState.LOADING) {
      return <LoadingScreen />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
       <HUD 
         player={player} 
         day={props.day} 
         isNight={props.isNight} 
         timeInCycle={props.timeInCycle} 
         isBloodMoon={props.isBloodMoon} 
         isRaining={props.isRaining}
         setGameState={setGameState}
         creativeMode={props.creativeMode}
         showSaveMessage={props.showSaveMessage}
         t={t}
         language={language}
         currentBiome={props.currentBiome}
         isNearReturnPortal={props.isNearReturnPortal}
         collectingState={props.collectingState}
       />

       <div className="pointer-events-auto">
            {gameState === GameState.CREATIVE_INVENTORY && (
                <CreativeInventoryPanel {...props} t={t} />
            )}
            
            {gameState === GameState.PLAYING && props.creativeMode && (
                <CreativePanel {...props} t={t} />
            )}

            {gameState === GameState.INVENTORY && (
                <InventoryPanel {...props} t={t} />
            )}

            {gameState === GameState.WORKBENCH && (
                <CraftingTablePanel {...props} t={t} />
            )}

            {gameState === GameState.CHEST_UI && (
                <ChestPanel {...props} t={t} />
            )}

            {gameState === GameState.FURNACE && (
                <FurnacePanel {...props} t={t} />
            )}

            {gameState === GameState.VENDOR_SHOP && (
                <VendorPanel {...props} t={t} />
            )}

            {gameState === GameState.QUEST_UI && (
                <QuestPanel {...props} t={t} />
            )}

            {gameState === GameState.ENCHANTING && (
                <EnchantingPanel {...props} t={t} />
            )}
            
            {gameState === GameState.NAMING_PET && props.dogBeingNamed && (
                <NamingPanel dogBeingNamed={props.dogBeingNamed} handleNamePet={props.handleNamePet} />
            )}

            {gameState === GameState.PORTAL_UI && activePortal && (
                <PortalPanel {...props} t={t} />
            )}
            
            {gameState === GameState.CAVERN_CONFIRM && activePortal && (
                <CavernConfirmUI 
                    enterCavern={props.enterCavern}
                    returnFromCavern={props.returnFromCavern}
                    setGameState={setGameState}
                    targetDimension={activePortal.targetDimension === 'CAVERN' ? 'CAVERN' : 'OVERWORLD'}
                    t={t}
                />
            )}
            
            {gameState === GameState.GAME_OVER && (
                 <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex flex-col items-center justify-center text-white pointer-events-auto z-50">
                    <h1 className="text-8xl font-bold mb-8 text-black" style={{textShadow: '2px 2px 4px red'}}>{t('youDied')}</h1>
                     <button onClick={startNewGame} className="bg-white text-black font-bold py-4 px-8 rounded-lg text-2xl hover:bg-gray-300">{t('restart')}</button>
                 </div>
            )}
            
            {props.showSleepConfirm && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white pointer-events-auto z-50">
                    <h2 className="text-3xl mb-4">{t('skipNight')}</h2>
                    <div className="flex gap-4">
                        <button onClick={() => { props.skipNight(); }} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-xl">{t('yes')}</button>
                        <button onClick={() => props.setShowSleepConfirm(false)} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded text-xl">{t('no')}</button>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default GameUI;
