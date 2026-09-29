import { describe, expect, it } from 'vitest'
import { filterRecipes, matchesRecipeName } from './recipeSearch'

const recipes = [
  { id: 1, name: 'Rajma (राजमा) (demo)' },
  { id: 2, name: 'Chana masala (चना मसाला) (demo)' },
]

describe('bilingual recipe search', () => {
  it('matches either Hindi or English recipe names without case sensitivity', () => {
    expect(matchesRecipeName(recipes[0], 'rajMA')).toBe(true)
    expect(matchesRecipeName(recipes[0], 'राजमा')).toBe(true)
    expect(matchesRecipeName(recipes[1], 'मसाला')).toBe(true)
    expect(matchesRecipeName(recipes[1], 'chana')).toBe(true)
  })

  it('preserves the selected recipe when it falls outside the filtered matches', () => {
    expect(filterRecipes(recipes, 'masala', 1).map(recipe => recipe.id)).toEqual([1, 2])
    expect(filterRecipes(recipes, 'does not exist', 2).map(recipe => recipe.id)).toEqual([2])
  })
})
