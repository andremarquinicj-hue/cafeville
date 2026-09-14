import atlas from './atlas.json';

export type ArtBox = {x:number;y:number;w:number;h:number};
export type ArtFrame = ArtBox & {sheet:string;ox:number;oy:number;ui:ArtBox};
export type ArtSheet = {key:string;url:string;width:number;height:number};
export const ART_SHEETS:Record<string,ArtSheet> = atlas.sheets;
export const ART_FRAMES:Record<string,ArtFrame> = atlas.frames;

const defaults:Record<string,string> = {
 table:'mesa_rustica',chair:'cadeira_bistro',stove:'fogao_classico',
 counter:'balcao_madeira',fridge:'geladeira',sofa:'sofa_verde',
 plant:'planta_verde',lamp:'luminaria',
};

/** Keep saved item IDs and legacy SVG URLs compatible with the illustrated art. */
export function artFrameKey(src?:string,itemId?:string):string|undefined {
 if(itemId&&ART_FRAMES[`item-${itemId}`])return `item-${itemId}`;
 const character=src?.match(/\/characters\/(chef|waiter|cleaner|guest[0-5])(-seat)?-([0-3])\.svg(?:\?.*)?$/);
 if(character){const key=character[1]+(character[2]?'-seat':`-${character[3]}`);return ART_FRAMES[key]?key:undefined;}
 const object=src?.match(/\/game\/(?:furniture|appliances|decor)\/([a-z]+)\.svg(?:\?.*)?$/);
 return object&&defaults[object[1]]?`item-${defaults[object[1]]}`:undefined;
}

/** Pixel dimensions are for presentation only; grid/economy remain authoritative. */
export function furnitureSize(kind:string,frame:ArtFrame,wide=false):{width:number;height:number} {
 const heights:Record<string,number>={chair:76,fridge:124,plant:99,lamp:116};
 if(heights[kind])return {height:heights[kind],width:heights[kind]*frame.w/frame.h};
 const width=wide?140:kind==='counter'?86:kind==='stove'?83:89;
 return {width,height:width*frame.h/frame.w};
}
