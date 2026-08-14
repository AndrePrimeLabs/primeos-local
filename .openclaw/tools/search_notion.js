const token = process.env.NOTION_API_KEY;
const query = process.argv.slice(2).join(' ');
if (!token) throw new Error('Missing NOTION_API_KEY');
(async () => {
  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, page_size: 10 })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  const data = JSON.parse(text);
  const items = (data.results || []).map(r => ({ object: r.object, id: r.id, url: r.url, title: Object.values(r.properties || {}).find(p => p.type === 'title')?.title?.map(t=>t.plain_text).join('') || r.title?.map?.(t=>t.plain_text).join('') || '' }));
  console.log(JSON.stringify(items, null, 2));
})().catch(err => { console.error('NOTION_SEARCH_FAILED:', err.message); process.exit(1); });
