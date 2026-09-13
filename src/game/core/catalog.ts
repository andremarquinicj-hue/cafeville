import type { Item, Recipe, Mission } from '@/types/game';
const food = (id: string) => `/assets/game/food/${id}.svg`;
export const RECIPES: Recipe[] = [
 { id:'espresso',name:'Café espresso',category:'Bebidas',cost:15,xp:5,seconds:15,shelfSeconds:900,portions:10,price:4,level:1,art:food('espresso') },
 { id:'pao_queijo',name:'Pão de queijo',category:'Salgados',cost:30,xp:10,seconds:30,shelfSeconds:1800,portions:20,price:4,level:1,art:food('pao_queijo') },
 { id:'brigadeiro',name:'Brigadeiro',category:'Doces',cost:55,xp:20,seconds:60,shelfSeconds:3600,portions:32,price:5,level:2,art:food('brigadeiro') },
 { id:'pizza_marguerita',name:'Pizza marguerita',category:'Pratos',cost:100,xp:45,seconds:120,shelfSeconds:3600,portions:50,price:6,level:3,art:food('pizza_marguerita') },
 { id:'croissant',name:'Croissant da casa',category:'Salgados',cost:180,xp:65,seconds:600,shelfSeconds:7200,portions:80,price:6,level:4,art:food('croissant') },
 { id:'bolo',name:'Bolo de morango',category:'Doces',cost:300,xp:110,seconds:1800,shelfSeconds:10800,portions:120,price:7,level:6,art:food('bolo') },
 { id:'lasanha',name:'Lasanha artesanal',category:'Pratos',cost:600,xp:200,seconds:7200,shelfSeconds:14400,portions:350,price:6,level:8,art:food('lasanha') },
 { id:'moqueca',name:'Moqueca brasileira',category:'Pratos',cost:1200,xp:400,seconds:14400,shelfSeconds:28800,portions:500,price:8,level:12,art:food('moqueca') },
];
const def = (id:string,name:string,kind:Item['kind'],price:number,level=1,width=1,height=1,color?:string):Item => ({id,name,kind,price,level,width,height,art:`/assets/game/${['stove','counter','fridge'].includes(kind)?'appliances':['plant','lamp'].includes(kind)?'decor':['floor','wall','door','window','theme'].includes(kind)?'walls':'furniture'}/${kind}.svg`,...(color?{color}:{})});
export const ITEMS:Item[] = [
 def('mesa_rustica','Mesa da casa','table',300),def('mesa_vintage','Mesa retrô','table',650,3),
 def('cadeira_bistro','Cadeira bistrô','chair',120),def('fogao_classico','Fogão clássico','stove',600),def('fogao_dourado','Fogão dourado','stove',2400,6),
 def('balcao_madeira','Balcão de madeira','counter',450),def('geladeira','Geladeira creme','fridge',800,2),
 def('planta_verde','Costela-de-adão','plant',180),def('luminaria','Luminária âmbar','lamp',350,2),def('sofa_verde','Sofá do jardim','sofa',900,4,2,1),
 def('piso_madeira','Madeira de mel','floor',250,1,1,1,'#d8ae78'),def('piso_creme','Ladrilho creme','floor',400,2,1,1,'#e6d6b2'),def('piso_verde','Ladrilho sálvia','floor',500,3,1,1,'#a5b695'),
 def('parede_creme','Parede baunilha','wall',250,1,1,1,'#f5e4ba'),def('parede_verde','Parede jardim','wall',450,3,1,1,'#b5c8a3'),def('porta_madeira','Entrada de madeira','door',350),def('janela_azul','Janela ensolarada','window',280),
 def('tema_jardim','Tema Jardim','theme',1500,5,1,1,'#71965a'),def('tema_outono','Tema Outono','theme',1500,5,1,1,'#b88447'),
];
export const MISSIONS:Mission[] = [
 {id:'serve20',name:'Uma mesa para todos',period:'daily',stat:'served',target:20,coins:150,xp:30},
 {id:'cook5',name:'A cozinha não para',period:'daily',stat:'cooked',target:5,coins:150,xp:25},
 {id:'visit3',name:'Café com os vizinhos',period:'daily',stat:'visits',target:3,coins:100,xp:20},
 {id:'serve100',name:'Semana de casa cheia',period:'weekly',stat:'served',target:100,coins:800,xp:150},
 {id:'earn1000',name:'Um negócio de sucesso',period:'weekly',stat:'earned',target:1000,coins:400,xp:80},
 {id:'buy2',name:'Do seu jeitinho',period:'total',stat:'bought',target:2,coins:100,xp:30,itemId:'planta_verde'},
 {id:'chef50',name:'Chef de mão cheia',period:'total',stat:'cooked',target:50,coins:1500,xp:300,itemId:'mesa_vintage'},
];
export const EXPANSIONS = [{size:10,level:4,cost:2500},{size:12,level:8,cost:6000},{size:14,level:12,cost:12000},{size:16,level:18,cost:24000}];
export const BRANCHES = [{id:'main',name:'Café principal',level:1},{id:'beach',name:'Café da praia',level:25},{id:'mountain',name:'Café da montanha',level:40}];
export const isStyle = (kind:Item['kind']) => ['floor','wall','door','window','theme'].includes(kind);
