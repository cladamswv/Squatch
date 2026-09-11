from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
required=[
 'package.json','index.html','capacitor.config.ts','vite.config.ts','tsconfig.json',
 'src/main.ts','src/game.ts','src/world.ts','src/player.ts','src/factory.ts','src/ui.ts','src/style.css',
 '.github/workflows/android-apk.yml','.github/workflows/pages.yml','public/icon.png','public/logo.png','README.md'
]
missing=[p for p in required if not (root/p).exists()]
if missing:
 print('Missing required files:'); print('\n'.join(missing)); sys.exit(1)
text=(root/'src/game.ts').read_text()+ (root/'src/world.ts').read_text()
for token in ['Sighting','Mothman','Freight Train','pepperoni','dailyMissions','WorldGenerator']:
 if token not in text:
  print('Missing expected game token:',token); sys.exit(1)
print(f'OK: repository structure validated ({sum(1 for p in root.rglob("*") if p.is_file())} files).')
