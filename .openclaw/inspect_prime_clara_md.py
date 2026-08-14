from pathlib import Path
import re
p = Path('.openclaw/data/prime-clara-notion.md')
lines = p.read_text(encoding='utf8').splitlines()

def is_list(line):
    return bool(re.match(r'^[ \t]*([-+*]|•|\d+\.)\s+', line))

for i, line in enumerate(lines):
    if re.match(r'^(#+)\s+', line):
        above = lines[i-1] if i>0 else ''
        below = lines[i+1] if i+1 < len(lines) else ''
        if above.strip()!='':
            print(i+1, 'heading-above-not-blank', repr(line), repr(above))
        if below.strip()!='':
            print(i+1, 'heading-below-not-blank', repr(line), repr(below))
        if re.search(r'[:\.]\s*$', line):
            print(i+1, 'heading-trailing', repr(line))
    if line.strip().startswith('```'):
        above = lines[i-1] if i>0 else ''
        if above.strip()!='':
            print(i+1, 'fence-above-not-blank', repr(line), repr(above))
        # find closing fence
        j=i+1
        while j < len(lines) and not lines[j].strip().startswith('```'):
            j +=1
        if j < len(lines):
            after = lines[j+1] if j+1 < len(lines) else ''
            if after.strip()!='':
                print(j+1, 'fence-below-not-blank', repr(lines[j]), repr(after))
    if is_list(line):
        above=lines[i-1] if i>0 else ''
        below=lines[i+1] if i+1 < len(lines) else ''
        if above.strip()!='' and not is_list(above) and not re.match(r'^#+\s+', above):
            print(i+1, 'list-above-not-blank', repr(line), repr(above))
        if below.strip()!='' and not is_list(below) and not re.match(r'^#+\s+', below):
            print(i+1, 'list-below-not-blank', repr(line), repr(below))
