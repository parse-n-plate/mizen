from recipe_scrapers import scrape_me
import sys
import json

def main():
    try:
        url = sys.argv[1]
        scraper = scrape_me(url)

        result = {
            "title": scraper.title(),
            "ingredients": scraper.ingredients(),
            "instructions": scraper.instructions_list()
        }

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({ "error": str(e) }))

if __name__ == "__main__":
    main()
