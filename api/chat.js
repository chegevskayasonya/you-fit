export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'На сервері не задано OPENAI_API_KEY (Vercel → Settings → Environment Variables, потім Redeploy)' });
  }

  try {
    const { messages, system } = req.body;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages
        ]
      })
    });
    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `OpenAI HTTP ${response.status}`;
      const code = data?.error?.code ? ` [${data.error.code}]` : '';
      return res.status(response.status).json({ error: `OpenAI: ${msg}${code}` });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'OpenAI повернув порожню відповідь' });
    return res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (e) {
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
