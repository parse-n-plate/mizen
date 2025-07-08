import json
import sys
from bs4 import BeautifulSoup
from recipe_scrapers import scrape_me
import urllib.request

def parse_recipe(url):
    # Layer 1 validation and scrape
    try:
        url = sys.argv[1]
        scraper = scrape_me(url)

        result = {
            "title": scraper.title(),
            "ingredients": scraper.ingredients(),
            "instructions": scraper.instructions_list()
        }
        print(json.dumps(result))
        return result
    except Exception:
        pass

    # Layer 2 validation and scrape
    try:
        url = sys.argv[1]
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
        title_tag = soup.select_one('.wprm-recipe-name')
        title = title_tag.get_text(strip=True) if title_tag else ''
        # INGREDIENTS
        ingredient_items = soup.select('.wprm-recipe-ingredients-container li.wprm-recipe-ingredient')
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
        instruction_items = soup.select('.wprm-recipe-instructions-container .wprm-recipe-instruction-text')
        for step in instruction_items:
            step_text = step.get_text(strip=True)
            if step_text:
                instructions.append(step_text)

        # Final results from parsing recipe
        result = {
            "title": title,
            "ingredients": ingredients,
            "instructions": instructions
        }
        print(json.dumps(result))
        return result
    except Exception as e:
        print(json.dumps({ "error": str(e) }))

if __name__ == "__main__":
    url = sys.argv[1]
    parse_recipe(url)
