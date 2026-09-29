const textValues = recipe => [
  recipe?.name,
  recipe?.nameHi,
  recipe?.nameHindi,
  recipe?.hindiName,
  recipe?.nameEn,
  recipe?.nameEnglish,
  recipe?.englishName,
  recipe?.translations?.hi?.name,
  recipe?.translations?.en?.name,
  recipe?.translations?.en?.title,
  recipe?.names?.hi,
  recipe?.names?.en,
]

export function matchesRecipeName(recipe, query) {
  const needle = String(query || '').trim().toLocaleLowerCase()
  if (!needle) return true
  return textValues(recipe).some(value => String(value || '').toLocaleLowerCase().includes(needle))
}

export function filterRecipes(recipes, query, selectedId) {
  const matching = recipes.filter(recipe => matchesRecipeName(recipe, query))
  const selected = recipes.find(recipe => String(recipe.id) === String(selectedId))
  return selected && !matching.some(recipe => String(recipe.id) === String(selected.id))
    ? [selected, ...matching]
    : matching
}
