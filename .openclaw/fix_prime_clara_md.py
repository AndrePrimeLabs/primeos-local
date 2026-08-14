from pathlib import Path
import re

path = Path('.openclaw/data/prime-clara-notion.md')
text = path.read_text(encoding='utf8')
lines = text.splitlines()

# Normalize headings and blank lines
def normalize_heading(line):
    # remove trailing punctuation for headings
    if re.match(r'^(#{1,6})\s+.*$', line):
        line = re.sub(r'\s*[:\.]\s*$', '', line)
    return line

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # add blank line before headings if needed (except if first line)
    if re.match(r'^(#{1,6})\s+', line):
        if new_lines and new_lines[-1].strip() != '':
            new_lines.append('')
        line = normalize_heading(line)
        new_lines.append(line)
        # ensure blank line after heading unless next is blank or EOF
        if i + 1 < len(lines) and lines[i+1].strip() != '':
            new_lines.append('')
        i += 1
        continue
    # fenced code block handling
    if re.match(r'^```', line):
        if new_lines and new_lines[-1].strip() != '':
            new_lines.append('')
        new_lines.append(line)
        i += 1
        while i < len(lines) and not re.match(r'^```', lines[i]):
            new_lines.append(lines[i])
            i += 1
        if i < len(lines):
            new_lines.append(lines[i])
            i += 1
        if i < len(lines) and lines[i].strip() != '':
            new_lines.append('')
        continue
    # list block surrounding
    if re.match(r'^\s*([-+*]|•|\d+\.)\s+', line):
        if new_lines and new_lines[-1].strip() != '':
            new_lines.append('')
        while i < len(lines) and re.match(r'^\s*([-+*]|•|\d+\.)\s+', lines[i]):
            new_lines.append(lines[i])
            i += 1
        if i < len(lines) and lines[i].strip() != '':
            new_lines.append('')
        continue
    new_lines.append(line)
    i += 1

# fix duplicate top-level headings by demoting subsequent H1s to H2
seen_h1 = False
for idx, line in enumerate(new_lines):
    if re.match(r'^#\s+', line):
        if not seen_h1:
            seen_h1 = True
        else:
            new_lines[idx] = '#' + line

# remove multiple blank lines
final_lines = []
prev_blank = False
for line in new_lines:
    if line.strip() == '':
        if not prev_blank:
            final_lines.append('')
        prev_blank = True
    else:
        final_lines.append(line)
        prev_blank = False

path.write_text('\n'.join(final_lines) + ('\n' if text.endswith('\n') else ''), encoding='utf8')
print('fixed')
