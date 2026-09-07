"""Build a self-contained review from the app's shared empty-state copy and CSS."""
import base64
import json
from html import escape
from pathlib import Path

root = Path(__file__).resolve().parents[1]
states = json.loads((root / 'src/components/empty-state/content.json').read_text())
shared_css = (root / 'src/app/empty-states.css').read_text()
entries = [
 ('Home', '/', 'recipes', False, 'empty'),
 ('Favorites', '/?view=favorites', 'favorites', False, 'empty'),
 ('Search: no matches', '/search · Command-K', 'search', True, 'empty'),
 ('Search: no history', '/search · Command-K', 'recent', True, 'empty'),
 ('Recipe: no selection', '/recipe', 'recipe', False, 'empty'),
 ('Settings: substitutions', '/profile · Settings dialog', 'substitutions', True, 'empty'),
 ('Home: load failure', '/ · /?view=favorites', 'loadError', False, 'error'),
 ('Changelog: unavailable', '/changelog', 'changelog', True, 'error'),
 ('Page not found', '/r/[slug] · /recipes/[slug] · unknown routes', 'notFound', False, 'error'),
 ('Favorites: unavailable', 'Retained component variant', 'favoritesError', False, 'legacy'),
 ('Cookbook grid', 'Older component', 'recipes', False, 'legacy'),
 ('Recipe list', 'Older component', 'recipes', False, 'legacy'),
]
css = '''*{box-sizing:border-box}html{color-scheme:dark;--bg:#0b0a0a;--panel:#171412;--color-text-heading:#fafaf9;--color-text-muted:#a8a29e;--color-border-light:#3a3633;--color-surface:#1c1918;--color-cream:#292524;--color-blue:#18a1f7;--font-sans:"Albert Sans",system-ui,sans-serif;--font-serif:"Domine",Georgia,serif}html.light{color-scheme:light;--bg:#fafaf9;--panel:#fff;--color-text-heading:#292524;--color-text-muted:#78716c;--color-border-light:#e7e5e4;--color-surface:#fff;--color-cream:#f5f5f4}body{margin:0;background:var(--bg);color:var(--color-text-heading);font:14px/1.5 var(--font-sans)}header,.toolbar,main,footer{max-width:1400px;margin:auto}header{padding:48px 32px 24px}.top{display:flex;align-items:center;justify-content:space-between;gap:20px}.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-size:11px;color:var(--color-text-muted)}h1{font:40px/1.2 var(--font-serif);margin:12px 0}header p{max-width:760px;color:var(--color-text-muted)}button,input{font:inherit}button{cursor:pointer;color:inherit;border:1px solid var(--color-border-light);background:var(--color-surface);border-radius:10px;padding:9px 14px}button:focus-visible,input:focus-visible{outline:2px solid var(--color-blue);outline-offset:3px}.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 32px 28px}.toolbar button[aria-pressed=true]{background:var(--color-text-heading);color:var(--bg)}input{margin-left:auto;min-width:200px;padding:10px 14px;border:1px solid var(--color-border-light);border-radius:10px;background:var(--color-surface);color:inherit}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;padding:0 32px 40px}.card{border:1px solid var(--color-border-light);border-radius:16px;overflow:hidden;min-width:0}.meta{padding:18px 24px;background:var(--panel);border-bottom:1px solid var(--color-border-light)}.meta h2{font-size:14px;margin:4px 0;font-weight:500}.meta small,.meta code{font-size:11px;color:var(--color-text-muted);overflow-wrap:anywhere}.meta small{letter-spacing:.08em;text-transform:uppercase}.preview{padding:24px;min-height:400px;display:flex;align-items:center;justify-content:center}.preview .empty-state{width:100%}.note{padding:12px 24px;border-top:1px solid var(--color-border-light);font-size:11px;color:var(--color-text-muted)}.card[hidden],#no-match[hidden]{display:none}#no-match{grid-column:1/-1;color:var(--color-text-muted)}footer{padding:0 32px 40px;color:var(--color-text-muted);font-size:12px}@media(max-width:760px){.grid{grid-template-columns:1fr;padding:0 16px 32px}header{padding:28px 16px 20px}h1{font-size:30px}.toolbar{padding:0 16px 24px}.toolbar input{width:100%;margin:8px 0 0}.preview{padding:12px;min-height:350px}footer{padding:0 16px 24px}}@media print{.toolbar,#theme{display:none}.card{break-inside:avoid}body{print-color-adjust:exact}}'''
# Embed the app's existing generated font files when available; the HTML still works offline.
font_css = ''
media = root / '.next/dev/static/media'
for family in ('Albert Sans', 'Domine'):
    for stylesheet in (root / '.next/dev/static/chunks').glob('*.css'):
        import re
        for block in re.findall(r'@font-face\s*\{[^}]+\}', stylesheet.read_text()):
            if ('font-family: "' + family + '"') not in block and ("font-family: '" + family + "'") not in block:
                continue
            match = re.search(r'url\(["\']?([^\)"\']+\.woff2)', block)
            if match and (media / Path(match.group(1)).name).exists():
                blob = base64.b64encode((media / Path(match.group(1)).name).read_bytes()).decode()
                font_css += re.sub(r'url\([^)]*\)', 'url(data:font/woff2;base64,'+blob+')', block)
        if family in font_css:
            break
cards = []
for i, (page, route, variant, compact, kind) in enumerate(entries, 1):
    state = states[variant]
    asset = root / 'public' / state['illustration'].lstrip('/')
    illustration = 'data:image/svg+xml;base64,' + base64.b64encode(asset.read_bytes()).decode()
    cards.append(f'''<article class="card" data-kind="{kind}"><div class="meta"><small>{i:02} / {escape(page)}</small><h2>{escape(state['title'])}</h2><code>{escape(route)}</code></div><div class="preview"><div class="empty-state{' empty-state--compact' if compact else ''}"><img class="empty-state__illustration" src="{illustration}" alt="" width="96" height="80"><div class="empty-state__copy"><h3 class="empty-state__title">{escape(state['title'])}</h3><p class="empty-state__description">{escape(state['description'])}</p></div><span class="empty-state__action">{escape(state['action'])}</span></div></div><div class="note">{'Compact' if compact else 'Standard'} layout · Existing Mizen illustration · Shared app copy and styles</div></article>''')
html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mizen · Empty states</title><style>''' + font_css + css + shared_css + '''</style></head><body><header><div class="top"><div><div class="eyebrow">Mizen / interface review</div><h1>A place for every beginning</h1></div><button id="theme">Switch to light</button></div><p>One illustration, a clear heading, a short description, and one next step. The same empty-state component is used throughout the app, with a compact layout for smaller spaces.</p></header><div class="toolbar" aria-label="Gallery filters"><button data-filter="all" aria-pressed="true">All states · 12</button><button data-filter="empty" aria-pressed="false">Empty · 6</button><button data-filter="error" aria-pressed="false">Errors / missing · 3</button><button data-filter="legacy" aria-pressed="false">Older components · 3</button><input type="search" id="find" aria-label="Find a page or state" placeholder="Find a page or state…"></div><main class="grid">''' + ''.join(cards) + '''<p id="no-match" hidden>No matching states.</p></main><footer>These previews use the app’s shared copy and stylesheet. Illustrations and available app fonts are embedded for offline viewing. Preview buttons are illustrative; actions are connected in the app. Regenerate with python3 scripts/build-empty-state-gallery.py.</footer><script>let filter='all';const cards=[...document.querySelectorAll('.card')];const find=document.querySelector('#find');function update(){let count=0;for(const card of cards){card.hidden=!(filter==='all'||card.dataset.kind===filter)||!card.textContent.toLowerCase().includes(find.value.toLowerCase());if(!card.hidden)count++;}document.querySelector('#no-match').hidden=count>0;}document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));find.addEventListener('input',update);document.querySelector('#theme').addEventListener('click',event=>{event.target.textContent=document.documentElement.classList.toggle('light')?'Switch to dark':'Switch to light';});</script></body></html>'''
(root / 'public/reviews/empty-states.html').write_text(html)
print('Built 12 empty-state previews with embedded illustrations.')
