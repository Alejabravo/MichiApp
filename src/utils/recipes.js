// Recetario casero para michis + calculo de porciones
// Basado en recomendaciones veterinarias generales.
// NO reemplaza la visita al veterinario.

// Calcula la porcion diaria recomendada segun el peso (kg)
// Gatos adultos: 2-4% del peso corporal en comida humeda al dia
export function calculateDailyPortion(weightKg) {
  const w = parseFloat(weightKg);
  if (!w || w <= 0) return null;

  return {
    minGrams: Math.round(w * 1000 * 0.02), // 2%
    maxGrams: Math.round(w * 1000 * 0.04), // 4%
    mealsPerDay: w < 3 ? 4 : 3, // gatitos comen mas veces
    waterMl: Math.round(w * 60), // ~60ml por kg
  };
}

// Categoria de peso
export function getWeightCategory(weightKg) {
  const w = parseFloat(weightKg);
  if (!w) return 'Sin datos';
  if (w < 2.5) return 'Bajo peso';
  if (w < 4) return 'Peso ideal';
  if (w < 5.5) return 'Ligeramente alto';
  return 'Sobrepeso';
}

// Recetas caseras aptas para michis
// Nota: siempre complementar con taurina y suplementos veterinarios
export const RECIPES = [
  {
    id: 'pollo-arroz',
    title: 'Pollo con arroz y zanahoria',
    category: 'Plato principal',
    prepTime: '30 min',
    servings: '3-4 porciones',
    ingredients: [
      '500 g de pechuga de pollo sin hueso ni piel',
      '1 taza de arroz blanco',
      '1 zanahoria mediana',
      '1 cucharada de aceite de girasol',
      'Suplemento de taurina (segun indicacion veterinaria)',
      'Agua suficiente',
    ],
    steps: [
      'Cocinar el arroz en agua sin sal hasta que quede muy blandito.',
      'Hervir la pechuga de pollo en agua sin sal por 20 minutos.',
      'Pelar y cocinar la zanahoria hasta que este suave.',
      'Licuar o procesar todos los ingredientes hasta obtener una pasta.',
      'Agregar el aceite de girasol para aportar acidos grasos.',
      'Incorporar el suplemento de taurina segun la dosis recomendada.',
      'Dejar enfriar antes de servir.',
    ],
    tip: 'Apto para michis de cualquier edad. Refrigerar hasta 3 dias.',
  },
  {
    id: 'carne-calabaza',
    title: 'Carne molida con calabaza',
    category: 'Plato principal',
    prepTime: '35 min',
    servings: '4 porciones',
    ingredients: [
      '500 g de carne molida magra (res)',
      '1 taza de calabaza picada',
      '1/2 taza de arroz integral',
      '1 cucharadita de aceite de salmon',
      'Suplemento de taurina',
      'Calcio en polvo (opcional, segun veterinario)',
    ],
    steps: [
      'Cocinar el arroz integral en agua sin sal hasta que este muy suave.',
      'Cocinar la calabaza al vapor por 15 minutos.',
      'Dorar la carne molida en su propia grasa, sin aceite ni sal.',
      'Mezclar todo y procesar ligeramente.',
      'Agregar el aceite de salmon y el calcio.',
      'Servir tibio.',
    ],
    tip: 'Rica en hierro. Ideal para michis en crecimiento.',
  },
  {
    id: 'pescado-papa',
    title: 'Pescado con papa criolla',
    category: 'Plato principal',
    prepTime: '25 min',
    servings: '3 porciones',
    ingredients: [
      '400 g de filete de pescado blanco (tilapia o bocachico)',
      '500 g de papa criolla',
      '1 cucharada de aceite de coco',
      'Suplemento de taurina',
    ],
    steps: [
      'Hervir las papas criollas sin cascara hasta que esten muy suaves.',
      'Cocinar el pescado al vapor por 15 minutos.',
      'Verificar que no queden espinas.',
      'Mezclar todo y procesar.',
      'Agregar el aceite de coco.',
      'Dejar enfriar antes de servir.',
    ],
    tip: 'Aporta omega 3. Consultar con veterinario por espinas.',
  },
  {
    id: 'higado-arroz',
    title: 'Higado guisado con arroz',
    category: 'Plato ocasional',
    prepTime: '20 min',
    servings: '2 porciones',
    ingredients: [
      '200 g de higado de pollo',
      '1/2 taza de arroz blanco',
      '1 cucharada de aceite de girasol',
      'Perejil fresco',
    ],
    steps: [
      'Cocinar el arroz en agua sin sal.',
      'Cocinar el higado en agua hirviendo por 10 minutos.',
      'Procesar todo junto con el perejil.',
      'Agregar el aceite.',
      'Servir tibio.',
    ],
    tip: 'Solo 1-2 veces por semana. El higado es muy nutritivo pero alto en vitamina A.',
  },
  {
    id: 'sardinas',
    title: 'Sardinas con arroz integral',
    category: 'Plato principal',
    prepTime: '15 min',
    servings: '2 porciones',
    ingredients: [
      '1 lata de sardinas en agua (escurridas)',
      '1/2 taza de arroz integral cocido',
      '1 cucharada de aceite de oliva',
    ],
    steps: [
      'Escurrir bien las sardinas.',
      'Retirar cualquier espina grande.',
      'Mezclar con el arroz y el aceite.',
      'Procesar ligeramente.',
      'Servir a temperatura ambiente.',
    ],
    tip: 'Fuente natural de omega 3 y calcio. Rapida y economica.',
  },
  {
    id: 'menudencias',
    title: 'Menudencias guisadas',
    category: 'Plato ocasional',
    prepTime: '40 min',
    servings: '4 porciones',
    ingredients: [
      '300 g de menudencias de pollo (corazon, molleja)',
      '1/2 taza de arroz blanco',
      '1 zanahoria',
      '1 cucharada de aceite de girasol',
    ],
    steps: [
      'Lavar muy bien las menudencias.',
      'Hervir por 30 minutos en agua sin sal.',
      'Cocinar el arroz y la zanahoria por separado.',
      'Procesar todo junto.',
      'Agregar el aceite y servir.',
    ],
    tip: 'Solo 1 vez por semana. Muy ricas en proteinas.',
  },
];

// Snacks y premios seguros para michis
export const SNACKS = [
  {
    id: 'pollo-desecado',
    title: 'Trocitos de pollo deshidratado',
    description: 'Pechuga de pollo cortada en tiras finas, secada al horno a 70°C por 3 horas.',
    safe: true,
  },
  {
    id: 'atun-agua',
    title: 'Atun en agua',
    description: 'Pequenas porciones de atun en agua, sin sal. Ocasional.',
    safe: true,
  },
  {
    id: 'huevo-duro',
    title: 'Huevo duro',
    description: 'Huevo cocido y picado en trozos pequenos. Excelente fuente de proteina.',
    safe: true,
  },
  {
    id: 'calabaza-pura',
    title: 'Pure de calabaza',
    description: 'Calabaza cocida y hecha pure. Ayuda a la digestion.',
    safe: true,
  },
  {
    id: 'yogur-natural',
    title: 'Yogur natural sin azucar',
    description: 'Una cucharadita ocasional. Aporta probioticos.',
    safe: true,
  },
];

// Alimentos PROHIBIDOS
export const FORBIDDEN = [
  'Chocolate',
  'Cebolla',
  'Ajo',
  'Uvas y pasas',
  'Aguacate',
  'Alcohol',
  'Cafeina',
  'Huesos cocidos',
  'Leche de vaca',
  'Cítricos',
  'Lacteos en exceso',
  'Comida con sal o condimentos',
];