"""Add reviewed demo catalog records through the existing local API, never replace them."""
import argparse
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit


def request(base, route, payload=None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = Request(base + route, data=body, headers={'Content-Type': 'application/json'})
    with urlopen(req, timeout=30) as response:
        return json.load(response)


def unique_names(records):
    counts = Counter(x['name'].casefold() for x in records)
    duplicates = [name for name, count in counts.items() if count > 1]
    if duplicates:
        raise ValueError('Duplicate names need manager review: ' + ', '.join(duplicates))
    return {x['name'].casefold(): x for x in records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8086/api/prep')
    parser.add_argument('--catalog', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/demo-recipe-catalog.json')
    parser.add_argument('--apply', action='store_true', help='Add missing records; default is preview only.')
    args = parser.parse_args()
    url = urlsplit(args.base_url)
    if url.scheme != 'http' or url.hostname not in ('127.0.0.1', 'localhost') or url.port not in (8086, 8087) or url.path != '/api/prep' or url.query or url.username:
        raise ValueError('Use only the named local demo or isolated validation API.')
    catalog = json.loads(args.catalog.read_text(encoding='utf-8-sig'))
    if catalog.get('schemaVersion') != 1 or catalog.get('fictional') is not True or catalog.get('requiresKitchenReview') is not True:
        raise ValueError('Expected explicitly fictional, review-required catalog.')
    recipes = catalog['recipes']
    unique_names(recipes)
    ingredient_units = {}
    for recipe in recipes:
        if not 1 <= len(recipe['name']) <= 120 or '(demo)' not in recipe['name']:
            raise ValueError('Use bounded, explicitly demo recipe names.')
        if not recipe['ingredients'] or len(recipe['ingredients']) > 50:
            raise ValueError('Each recipe requires 1–50 ingredient lines.')
        unique_names(recipe['ingredients'])
        if not set(recipe['suggestedMeals']).issubset({'BREAKFAST', 'LUNCH', 'DINNER'}):
            raise ValueError('Invalid suggested meal; suggestions do not create plans.')
        for line in recipe['ingredients']:
            unit, quantity = line['unit'], Decimal(line['quantityPerPortion'])
            if unit not in ('kg', 'l') or not quantity.is_finite() or quantity <= 0 or quantity.as_tuple().exponent < -9:
                raise ValueError('Invalid positive exact per-portion quantity/unit.')
            if not 1 <= len(line['name']) <= 120:
                raise ValueError('Invalid ingredient name.')
            key = line['name'].casefold()
            if ingredient_units.setdefault(key, unit) != unit:
                raise ValueError('Catalog mixes incompatible units for one ingredient.')
    existing_ingredients = unique_names(request(args.base_url, '/ingredients'))
    existing_recipes = unique_names(request(args.base_url, '/recipes'))
    for name, unit in ingredient_units.items():
        if name in existing_ingredients and existing_ingredients[name]['baseUnit'] != ('g' if unit == 'kg' else 'ml'):
            raise ValueError('Existing ingredient has incompatible units: ' + name)
    pending = [r for r in recipes if r['name'].casefold() not in existing_recipes]
    result = {'apply': args.apply, 'catalogRecipes': len(recipes), 'recipesToAdd': len(pending), 'createdRecipes': [], 'createdIngredients': [], 'skippedRecipes': len(recipes) - len(pending)}
    if args.apply:
        for recipe in pending:
            lines = []
            for line in recipe['ingredients']:
                key = line['name'].casefold()
                if key not in existing_ingredients:
                    item = request(args.base_url, '/ingredients', {'name': line['name'], 'unit': 'L' if line['unit'] == 'l' else line['unit']})
                    existing_ingredients[key] = item
                    result['createdIngredients'].append({'id': item['id'], 'name': item['name']})
                lines.append({'ingredientId': existing_ingredients[key]['id'], 'unit': line['unit'], 'quantity': line['quantityPerPortion']})
            created = request(args.base_url, '/recipes', {'name': recipe['name'], 'ingredients': lines})
            result['createdRecipes'].append({'id': created['id'], 'name': created['name']})
        # No automatic write retry: if a response is uncertain, rerun reconciles by name.
        after = unique_names(request(args.base_url, '/recipes'))
        for recipe in recipes:
            actual = after[recipe['name'].casefold()]
            if recipe in pending:
                expected = {(existing_ingredients[l['name'].casefold()]['id'], l['unit']): Decimal(l['quantityPerPortion']) for l in recipe['ingredients']}
                saved = {(l['ingredientId'], l['unit']): Decimal(l['quantity']) for l in actual['ingredients']}
                if expected != saved:
                    raise ValueError('Saved quantities differ for ' + recipe['name'])
        result['activeRecipesAfter'] = len(after)
        result['allCatalogNamesPresent'] = True
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
