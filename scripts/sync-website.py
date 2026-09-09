#!/usr/bin/env python3
"""Build the browser tools and sync their generated files to the portfolio checkout."""
from pathlib import Path
import shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT.parent/'brianrenshaw-app-site'
if not (SITE/'scripts/check_site.py').exists():raise SystemExit('Expected sibling brianrenshaw-app-site checkout')
subprocess.run(['npm','run','build'],cwd=ROOT/'frontend',check=True)
dest=SITE/'site/spreadsheet-tools'
if dest.exists():shutil.rmtree(dest)
shutil.copytree(ROOT/'frontend/dist',dest)
subprocess.run(['python3','scripts/check_site.py'],cwd=SITE,check=True)
print('Generated site/spreadsheet-tools/. Review, commit and push both repositories to publish.')
