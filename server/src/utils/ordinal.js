const SPANISH_ORDINALS = [
  'Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Septima',
  'Octava', 'Novena', 'Decima',
];

export function spanishOrdinal(n) {
  return SPANISH_ORDINALS[n - 1] || `Clase ${n}`;
}
