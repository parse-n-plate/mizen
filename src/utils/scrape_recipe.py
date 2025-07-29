import json
import sys
from bs4 import BeautifulSoup
from recipe_scrapers import scrape_me
import urllib.request

def parse_recipe(url):
    # Layer 1 validation and scrape
    try:
        scraper = scrape_me(url)

        # Check if we got valid data
        title = scraper.title()
        ingredients = scraper.ingredients()
        instructions = scraper.instructions_list()
        
        # Validate that we got meaningful data
        if title and ingredients and instructions and len(ingredients) > 0 and len(instructions) > 0:
        result = {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions
        }
        print(json.dumps(result))
        return result
        else:
            print(f"Layer 1 returned empty data: title='{title}', ingredients={len(ingredients) if ingredients else 0}, instructions={len(instructions) if instructions else 0}")
            raise Exception("Empty data from recipe_scrapers")
            
    except Exception as e:
        print(f"Layer 1 failed: {str(e)}")
        pass

    # Layer 2 validation and scrape - AllRecipes specific
    try:
        req = urllib.request.Request(
            url,
            headers={ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
        )
        page = urllib.request.urlopen(req)
        html_bytes = page.read()
        html = html_bytes.decode("utf-8")
        soup = BeautifulSoup(html, 'html.parser')
        
        ingredients = []
        instructions = []
        title = ''
        
        # AllRecipes specific selectors
        if 'allrecipes.com' in url:
            print("Using AllRecipes specific selectors")
            
            # Title - try multiple selectors
            title_selectors = [
                'h1[data-testid="recipe-title"]',
                '.recipe-title',
                'h1',
                '[data-testid="recipe-title"]',
                '.recipe-header h1'
            ]
            
            for selector in title_selectors:
                title_tag = soup.select_one(selector)
                if title_tag:
                    title = title_tag.get_text(strip=True)
                    print(f"Found title with selector '{selector}': {title}")
                    break
            
            # Ingredients - try multiple selectors
            ingredient_selectors = [
                '[data-testid="ingredient-item"]',
                '.ingredients-item-name',
                '.ingredient-item',
                '.ingredients-list li',
                '[class*="ingredient"]'
            ]
            
            for selector in ingredient_selectors:
                ingredient_items = soup.select(selector)
                if ingredient_items:
                    print(f"Found {len(ingredient_items)} ingredients with selector '{selector}'")
                    for item in ingredient_items:
                        ingredient_text = item.get_text(strip=True)
                        if ingredient_text and len(ingredient_text) > 2:
                            ingredients.append(ingredient_text)
                    if ingredients:
                        break
            
            # Instructions - try multiple selectors
            instruction_selectors = [
                '[data-testid="instruction-step"]',
                '.instructions-section-item',
                '.paragraph',
                '.instructions-list li',
                '[class*="instruction"]'
            ]
            
            for selector in instruction_selectors:
                instruction_items = soup.select(selector)
                if instruction_items:
                    print(f"Found {len(instruction_items)} instructions with selector '{selector}'")
                    for step in instruction_items:
                        step_text = step.get_text(strip=True)
                        if step_text and len(step_text) > 10:  # Filter out short text
                            instructions.append(step_text)
                    if instructions:
                        break
        
        # Generic fallback for other sites
        else:
            title_tag = soup.select_one('.wprm-recipe-name') or soup.select_one('h1')
        title = title_tag.get_text(strip=True) if title_tag else ''
            
        # INGREDIENTS
            ingredient_items = soup.select('.wprm-recipe-ingredients-container li.wprm-recipe-ingredient') or soup.select('li[class*="ingredient"]')
        for item in ingredient_items:
            amount = item.select_one('.wprm-recipe-ingredient-amount')
            unit = item.select_one('.wprm-recipe-ingredient-unit')
            name = item.select_one('.wprm-recipe-ingredient-name')
            notes = item.select_one('.wprm-recipe-ingredient-notes')

            ingredients.append([
                name.text.strip().replace('-', '') if name else '',
                amount.text.strip().replace('-', '') if amount else '',
                unit.text.strip().replace('-', '') if unit else '',
                notes.text.strip().replace('-', '') if notes else ''
            ])

        # INSTRUCTIONS
            instruction_items = soup.select('.wprm-recipe-instructions-container .wprm-recipe-instruction-text') or soup.select('[class*="instruction"]')
        for step in instruction_items:
            step_text = step.get_text(strip=True)
            if step_text:
                instructions.append(step_text)

        print(f"Layer 2 results: title='{title}', ingredients={len(ingredients)}, instructions={len(instructions)}")

        # Final results from parsing recipe
        if title and ingredients and instructions:
        result = {
            "title": title,
            "ingredients": ingredients,
            "instructions": instructions
        }
        print(json.dumps(result))
        return result
        else:
            raise Exception(f"Failed to extract recipe data: title='{title}', ingredients={len(ingredients)}, instructions={len(instructions)}")
            
    except Exception as e:
        print(json.dumps({ "error": str(e) }))

if __name__ == "__main__":
    url = sys.argv[1]
    parse_recipe(url)
