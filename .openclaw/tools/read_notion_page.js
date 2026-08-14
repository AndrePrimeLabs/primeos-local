const pageIdRaw = process.argv[2];
const outPath = process.argv[3] || 'notion-page.md';
const token = process.env.NOTION_API_KEY;
if (!token) throw new Error('Missing NOTION_API_KEY');
const pageId = pageIdRaw.replace(/-/g, '').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
const headers = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2025-09-03',
  'Content-Type': 'application/json'
};
async function notion(path, init) {
  const res = await fetch(`https://api.notion.com/v1${path}`, { headers, ...init });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { const j = JSON.parse(text); msg = `${j.code || res.status}: ${j.message || text}`; } catch {}
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : {};
}
function rich(rt=[]) {
  return rt.map(x => x.plain_text || x.text?.content || '').join('');
}
function propsTitle(props={}) {
  for (const [k,v] of Object.entries(props)) if (v?.type === 'title') return rich(v.title);
  return '';
}
function blockToMd(b, depth=0) {
  const ind = '  '.repeat(Math.max(0, depth));
  switch (b.type) {
    case 'heading_1': return `# ${rich(b.heading_1.rich_text)}`;
    case 'heading_2': return `## ${rich(b.heading_2.rich_text)}`;
    case 'heading_3': return `### ${rich(b.heading_3.rich_text)}`;
    case 'paragraph': return rich(b.paragraph.rich_text);
    case 'bulleted_list_item': return `${ind}- ${rich(b.bulleted_list_item.rich_text)}`;
    case 'numbered_list_item': return `${ind}1. ${rich(b.numbered_list_item.rich_text)}`;
    case 'to_do': return `${ind}- [${b.to_do.checked ? 'x' : ' '}] ${rich(b.to_do.rich_text)}`;
    case 'quote': return `> ${rich(b.quote.rich_text)}`;
    case 'callout': return `> ${rich(b.callout.rich_text)}`;
    case 'toggle': return `${ind}<details><summary>${rich(b.toggle.rich_text)}</summary>`;
    case 'code': return `\`\`\`${b.code.language || ''}\n${rich(b.code.rich_text)}\n\`\`\``;
    case 'child_page': return `## ${b.child_page.title}`;
    case 'child_database': return `## Database: ${b.child_database.title}`;
    case 'divider': return '---';
    case 'table_row': return '| ' + b.table_row.cells.map(c => rich(c)).join(' | ') + ' |';
    default:
      if (b[b.type]?.rich_text) return rich(b[b.type].rich_text);
      return `<!-- unsupported block: ${b.type} -->`;
  }
}
async function children(id) {
  let results = [], cursor;
  do {
    const qs = new URLSearchParams({ page_size: '100' });
    if (cursor) qs.set('start_cursor', cursor);
    const data = await notion(`/blocks/${id}/children?${qs}`);
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return results;
}
async function walk(id, depth=0) {
  const blocks = await children(id);
  let lines = [];
  for (const b of blocks) {
    lines.push(blockToMd(b, depth));
    if (b.has_children) {
      lines.push(...await walk(b.id, depth + 1));
      if (b.type === 'toggle') lines.push('</details>');
    }
  }
  return lines;
}
(async () => {
  const page = await notion(`/pages/${pageId}`);
  const title = propsTitle(page.properties) || pageId;
  const lines = [`# ${title}`, '', `Source page: ${page.url || pageId}`, ''];
  lines.push(...await walk(pageId));
  const fs = require('fs');
  fs.mkdirSync(require('path').dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.filter(x => x !== undefined).join('\n').replace(/\n{3,}/g, '\n\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
})().catch(err => { console.error('NOTION_READ_FAILED:', err.message); process.exit(1); });
