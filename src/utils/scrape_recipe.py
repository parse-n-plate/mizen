import json
import sys
from bs4 import BeautifulSoup
from recipe_scrapers import scrape_me
import urllib.request
import re
import gzip

def parse_recipe(url):
    """
    Universal recipe scraper that works with any recipe website.
    Uses a multi-layered approach with comprehensive selectors.
    """
    
    # Layer 1: Try recipe-scrapers library first (works with many major sites)
    try:
        print(f"Layer 1: Attempting to scrape with recipe-scrapers library...", file=sys.stderr)
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
            print(f"Layer 1 SUCCESS: Found recipe with {len(ingredients)} ingredients and {len(instructions)} instructions", file=sys.stderr)
            print(json.dumps(result))
            return result
        else:
            print(f"Layer 1 returned incomplete data: title='{title}', ingredients={len(ingredients) if ingredients else 0}, instructions={len(instructions) if instructions else 0}", file=sys.stderr)
            raise Exception("Incomplete data from recipe_scrapers")
            
    except Exception as e:
        print(f"Layer 1 failed: {str(e)}", file=sys.stderr)
        print("Falling back to Layer 2: Custom HTML parsing...", file=sys.stderr)

    # Layer 2: Custom HTML parsing with comprehensive selectors
    try:
        # Fetch the webpage with proper headers
        req = urllib.request.Request(
            url,
            headers={ 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
        )
        page = urllib.request.urlopen(req)
        html_bytes = page.read()
        
        # Handle gzip-compressed content
        if page.info().get('Content-Encoding') == 'gzip':
            html_bytes = gzip.decompress(html_bytes)
        
        html = html_bytes.decode("utf-8")
        soup = BeautifulSoup(html, 'html.parser')
        
        print(f"Layer 2: Successfully fetched HTML from {url}", file=sys.stderr)
        
        # Extract recipe data using comprehensive selectors
        title = extract_title(soup)
        ingredients = extract_ingredients(soup)
        instructions = extract_instructions(soup)
        
        print(f"Layer 2 results: title='{title}', ingredients={len(ingredients)}, instructions={len(instructions)}", file=sys.stderr)

        # Validate we got meaningful data
        if title and ingredients and instructions and len(ingredients) > 0 and len(instructions) > 0:
            result = {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions
            }
            print(f"Layer 2 SUCCESS: Found recipe with {len(ingredients)} ingredients and {len(instructions)} instructions", file=sys.stderr)
            print(json.dumps(result))
            return result
        else:
            raise Exception(f"Failed to extract complete recipe data: title='{title}', ingredients={len(ingredients)}, instructions={len(instructions)}")
            
    except Exception as e:
        print(f"Layer 2 failed: {str(e)}", file=sys.stderr)
        error_result = { "error": f"Failed to scrape recipe from {url}: {str(e)}" }
        print(json.dumps(error_result))
        return error_result  # This will trigger AI fallback in frontend

def extract_title(soup):
    """
    Extract recipe title using comprehensive selectors for various recipe sites.
    """
    # Comprehensive list of title selectors used by different recipe websites
    title_selectors = [
        # Schema.org structured data
        'h1[itemprop="name"]',
        '[itemprop="name"]',
        
        # Just One Cookbook specific
        '.entry-title',
        '.post-title',
        'h1.entry-title',
        '.recipe-header h1',
        '.single-post h1',
        '.post-header h1',
        '.entry-header h1',
        
        # Common recipe title classes
        '.recipe-title',
        '.recipe-name',
        '.recipe-header h1',
        '.recipe-header h2',
        '.recipe-heading',
        '.recipe-name-title',
        
        # WordPress Recipe Plugin (WP Recipe Maker)
        '.wprm-recipe-name',
        '.wprm-recipe-title',
        
        # AllRecipes specific
        'h1[data-testid="recipe-title"]',
        '[data-testid="recipe-title"]',
        
        # Food Network
        '.recipe-title',
        '.recipe-header h1',
        
        # BBC Good Food
        '.recipe-header__title',
        '.recipe-title',
        
        # Serious Eats
        '.recipe-title',
        '.entry-title',
        
        # Generic fallbacks
        'h1',
        'h2',
        '.title',
        '.heading',
        '[class*="title"]',
        '[class*="heading"]',
        
        # JSON-LD structured data fallback
        'script[type="application/ld+json"]'
    ]
    
    for selector in title_selectors:
        try:
            if selector == 'script[type="application/ld+json"]':
                # Handle JSON-LD structured data
                scripts = soup.select(selector)
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        if isinstance(data, dict) and 'name' in data:
                            title = data['name'].strip()
                            if title and len(title) > 3:
                                print(f"Found title in JSON-LD: {title}", file=sys.stderr)
                                return title
                        elif isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict) and 'name' in item:
                                    title = item['name'].strip()
                                    if title and len(title) > 3:
                                        print(f"Found title in JSON-LD array: {title}", file=sys.stderr)
                                        return title
                    except (json.JSONDecodeError, KeyError):
                        continue
            else:
                # Handle regular HTML selectors
                title_tag = soup.select_one(selector)
                if title_tag:
                    title = title_tag.get_text(strip=True)
                    if title and len(title) > 3 and not title.lower().startswith(('skip to', 'jump to')):
                        print(f"Found title with selector '{selector}': {title}", file=sys.stderr)
                        return title
        except Exception as e:
            print(f"Error with selector '{selector}': {str(e)}", file=sys.stderr)
            continue
    
    print("No title found with any selector", file=sys.stderr)
    return ''

def extract_ingredients(soup):
    """
    Extract ingredients using comprehensive selectors for various recipe sites.
    """
    ingredients = []
    
    # Comprehensive list of ingredient selectors
    ingredient_selectors = [
        # Schema.org structured data
        '[itemprop="ingredients"]',
        '[itemprop="recipeIngredient"]',
        
        # Just One Cookbook specific
        '.recipe-ingredients li',
        '.ingredients li',
        '.recipe-ingredients-list li',
        '.ingredients-list li',
        '.recipe-ingredient',
        '.ingredient-item',
        
        # WordPress Recipe Plugin (WP Recipe Maker)
        '.wprm-recipe-ingredients-container li.wprm-recipe-ingredient',
        '.wprm-recipe-ingredient',
        '.wprm-recipe-ingredients li',
        
        # AllRecipes specific
        '[data-testid="ingredient-item"]',
        '.ingredients-item-name',
        '.ingredient-item',
        '.ingredients-list li',
        
        # Food Network
        '.recipe-ingredients li',
        '.ingredients li',
        
        # BBC Good Food
        '.recipe-ingredients__list li',
        '.ingredients-list li',
        
        # Serious Eats
        '.recipe-ingredients li',
        '.ingredients li',
        
        # Generic ingredient patterns
        '[class*="ingredient"] li',
        '[class*="ingredient"]',
        'li[class*="ingredient"]',
        '.ingredients li',
        '.ingredients-list li',
        '.recipe-ingredients li',
        '.recipe-ingredients-list li',
        
        # JSON-LD structured data
        'script[type="application/ld+json"]'
    ]
    
    for selector in ingredient_selectors:
        try:
            if selector == 'script[type="application/ld+json"]':
                # Handle JSON-LD structured data
                scripts = soup.select(selector)
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        if isinstance(data, dict) and 'recipeIngredient' in data:
                            ingredients_list = data['recipeIngredient']
                            if isinstance(ingredients_list, list):
                                for ingredient in ingredients_list:
                                    if isinstance(ingredient, str) and ingredient.strip():
                                        ingredients.append(ingredient.strip())
                                if ingredients:
                                    print(f"Found {len(ingredients)} ingredients in JSON-LD", file=sys.stderr)
                                    return ingredients
                        elif isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict) and 'recipeIngredient' in item:
                                    ingredients_list = item['recipeIngredient']
                                    if isinstance(ingredients_list, list):
                                        for ingredient in ingredients_list:
                                            if isinstance(ingredient, str) and ingredient.strip():
                                                ingredients.append(ingredient.strip())
                                        if ingredients:
                                            print(f"Found {len(ingredients)} ingredients in JSON-LD array", file=sys.stderr)
                                            return ingredients
                    except (json.JSONDecodeError, KeyError):
                        continue
            else:
                # Handle regular HTML selectors
                ingredient_items = soup.select(selector)
                if ingredient_items:
                    print(f"Found {len(ingredient_items)} potential ingredients with selector '{selector}'", file=sys.stderr)
                    for item in ingredient_items:
                        ingredient_text = item.get_text(strip=True)
                        if ingredient_text and len(ingredient_text) > 2:
                            # Clean up the ingredient text
                            ingredient_text = re.sub(r'\s+', ' ', ingredient_text)  # Normalize whitespace
                            ingredients.append(ingredient_text)
                    
                    if ingredients:
                        print(f"Successfully extracted {len(ingredients)} ingredients with selector '{selector}'", file=sys.stderr)
                        return ingredients
        except Exception as e:
            print(f"Error with ingredient selector '{selector}': {str(e)}", file=sys.stderr)
            continue
    
    print("No ingredients found with any selector", file=sys.stderr)
    return []

def extract_instructions(soup):
    """
    Extract cooking instructions using comprehensive selectors for various recipe sites.
    """
    instructions = []
    
    # Comprehensive list of instruction selectors
    instruction_selectors = [
        # Schema.org structured data
        '[itemprop="recipeInstructions"]',
        '[itemprop="instructions"]',
        
        # Just One Cookbook specific
        '.recipe-instructions li',
        '.instructions li',
        '.recipe-instructions-list li',
        '.instructions-list li',
        '.recipe-instruction',
        '.instruction-item',
        '.recipe-steps li',
        '.recipe-method li',
        
        # WordPress Recipe Plugin (WP Recipe Maker)
        '.wprm-recipe-instructions-container .wprm-recipe-instruction-text',
        '.wprm-recipe-instruction-text',
        '.wprm-recipe-instructions li',
        
        # AllRecipes specific
        '[data-testid="instruction-step"]',
        '.instructions-section-item',
        '.paragraph',
        '.instructions-list li',
        
        # Food Network
        '.recipe-instructions li',
        '.instructions li',
        '.recipe-steps li',
        
        # BBC Good Food
        '.recipe-method__list li',
        '.method-list li',
        '.instructions li',
        
        # Serious Eats
        '.recipe-instructions li',
        '.instructions li',
        '.recipe-steps li',
        
        # Generic instruction patterns
        '[class*="instruction"]',
        '[class*="step"]',
        '[class*="method"]',
        '.instructions li',
        '.instructions-list li',
        '.recipe-instructions li',
        '.recipe-instructions-list li',
        '.recipe-steps li',
        '.recipe-method li',
        '.method li',
        '.steps li',
        
        # JSON-LD structured data
        'script[type="application/ld+json"]'
    ]
    
    for selector in instruction_selectors:
        try:
            if selector == 'script[type="application/ld+json"]':
                # Handle JSON-LD structured data
                scripts = soup.select(selector)
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        if isinstance(data, dict) and 'recipeInstructions' in data:
                            instructions_list = data['recipeInstructions']
                            if isinstance(instructions_list, list):
                                for instruction in instructions_list:
                                    if isinstance(instruction, str) and instruction.strip():
                                        instructions.append(instruction.strip())
                                    elif isinstance(instruction, dict) and 'text' in instruction:
                                        instructions.append(instruction['text'].strip())
                                if instructions:
                                    print(f"Found {len(instructions)} instructions in JSON-LD", file=sys.stderr)
                                    return instructions
                        elif isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict) and 'recipeInstructions' in item:
                                    instructions_list = item['recipeInstructions']
                                    if isinstance(instructions_list, list):
                                        for instruction in instructions_list:
                                            if isinstance(instruction, str) and instruction.strip():
                                                instructions.append(instruction.strip())
                                            elif isinstance(instruction, dict) and 'text' in instruction:
                                                instructions.append(instruction['text'].strip())
                                        if instructions:
                                            print(f"Found {len(instructions)} instructions in JSON-LD array", file=sys.stderr)
                                            return instructions
                    except (json.JSONDecodeError, KeyError):
                        continue
            else:
                # Handle regular HTML selectors
                instruction_items = soup.select(selector)
                if instruction_items:
                    print(f"Found {len(instruction_items)} potential instructions with selector '{selector}'", file=sys.stderr)
                    for step in instruction_items:
                        step_text = step.get_text(strip=True)
                        if step_text and len(step_text) > 10:  # Filter out very short text
                            # Clean up the instruction text
                            step_text = re.sub(r'\s+', ' ', step_text)  # Normalize whitespace
                            instructions.append(step_text)
                    
                    if instructions:
                        print(f"Successfully extracted {len(instructions)} instructions with selector '{selector}'", file=sys.stderr)
                        return instructions
        except Exception as e:
            print(f"Error with instruction selector '{selector}': {str(e)}", file=sys.stderr)
            continue
    
    print("No instructions found with any selector", file=sys.stderr)
    return []

if __name__ == "__main__":
    url = sys.argv[1]
    parse_recipe(url)
