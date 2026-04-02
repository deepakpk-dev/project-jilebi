export type DietaryFlag = 'veg' | 'spicy' | 'veg-spicy'

export type MenuItem = {
  id: string
  nameDE: string
  nameEN: string
  descDE: string
  descEN: string
  price: number
  dietary?: DietaryFlag
}

export type MenuCategory = 'starters' | 'mains' | 'desserts' | 'drinks'

export const menu: Record<MenuCategory, MenuItem[]> = {
  starters: [
    {
      id: 'samosa',
      nameDE: 'Samosa (2 Stück)',
      nameEN: 'Samosa (2 pcs)',
      descDE: 'Knusprige Teigtaschen mit gewürzten Kartoffeln und Erbsen',
      descEN: 'Crispy pastry filled with spiced potatoes and peas',
      price: 6.9,
      dietary: 'veg',
    },
    {
      id: 'chicken-tikka',
      nameDE: 'Chicken Tikka',
      nameEN: 'Chicken Tikka',
      descDE: 'Marinierte Hähnchenspieße aus dem Tandoor-Ofen',
      descEN: 'Marinated chicken skewers from the tandoor oven',
      price: 10.9,
    },
    {
      id: 'onion-bhaji',
      nameDE: 'Zwiebelküchlein',
      nameEN: 'Onion Bhaji',
      descDE: 'Frittierte Zwiebelringe in Kichererbsenteig mit Koriander',
      descEN: 'Fried onion rings in chickpea batter with coriander',
      price: 7.5,
      dietary: 'veg',
    },
  ],
  mains: [
    {
      id: 'butter-chicken',
      nameDE: 'Butter Chicken',
      nameEN: 'Butter Chicken',
      descDE: 'Zartes Hähnchen in cremiger Tomaten-Butter-Sauce',
      descEN: 'Tender chicken in a creamy tomato-butter sauce',
      price: 16.9,
    },
    {
      id: 'palak-paneer',
      nameDE: 'Palak Paneer',
      nameEN: 'Palak Paneer',
      descDE: 'Hausgemachter Frischkäse in würziger Spinatsauce',
      descEN: 'Homemade cottage cheese in a spiced spinach sauce',
      price: 14.9,
      dietary: 'veg',
    },
    {
      id: 'lamb-rogan-josh',
      nameDE: 'Lammrogan Josh',
      nameEN: 'Lamb Rogan Josh',
      descDE: 'Geschmortes Lammfleisch in aromatischer Kaschmir-Sauce',
      descEN: 'Braised lamb in aromatic Kashmiri sauce',
      price: 19.9,
      dietary: 'spicy',
    },
    {
      id: 'dal-makhani',
      nameDE: 'Dal Makhani',
      nameEN: 'Dal Makhani',
      descDE: 'Schwarze Linsen langsam gegart mit Butter und Gewürzen',
      descEN: 'Black lentils slow-cooked with butter and spices',
      price: 13.9,
      dietary: 'veg',
    },
  ],
  desserts: [
    {
      id: 'gulab-jamun',
      nameDE: 'Gulab Jamun',
      nameEN: 'Gulab Jamun',
      descDE: 'Milchteigbällchen in Rosenwasser-Zuckersirup',
      descEN: 'Milk dough balls in rose water sugar syrup',
      price: 5.9,
      dietary: 'veg',
    },
    {
      id: 'kulfi',
      nameDE: 'Pistazien-Kulfi',
      nameEN: 'Pistachio Kulfi',
      descDE: 'Traditionelles indisches Eis mit Pistazien und Kardamom',
      descEN: 'Traditional Indian ice cream with pistachios and cardamom',
      price: 5.5,
      dietary: 'veg',
    },
  ],
  drinks: [
    {
      id: 'mango-lassi',
      nameDE: 'Mango-Lassi',
      nameEN: 'Mango Lassi',
      descDE: 'Erfrischend mit Mango und Joghurt',
      descEN: 'Refreshing mango and yoghurt drink',
      price: 4.5,
      dietary: 'veg',
    },
    {
      id: 'masala-chai',
      nameDE: 'Masala Chai',
      nameEN: 'Masala Chai',
      descDE: 'Gewürztee mit Ingwer, Zimt und Kardamom',
      descEN: 'Spiced tea with ginger, cinnamon and cardamom',
      price: 3.5,
      dietary: 'veg',
    },
    {
      id: 'kingfisher',
      nameDE: 'Kingfisher Bier',
      nameEN: 'Kingfisher Beer',
      descDE: 'Indisches Lagerbier, 0,33 l',
      descEN: 'Indian lager beer, 330 ml',
      price: 4.9,
    },
  ],
}
