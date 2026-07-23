const SPANISH_ORDINALS = [
  'Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Septima',
  'Octava', 'Novena', 'Decima',
];

function spanishOrdinal(n) {
  return SPANISH_ORDINALS[n - 1] || `Clase ${n}`;
}

module.exports = { spanishOrdinal };
