const DROP = '@@DROP-LINE@@';

export function convertObsidian(md: string): { body: string; attachments: string[]; title?: string } {
  const attachments: string[] = [];
  let title: string | undefined;
  let body = md;

  const h1 = body.match(/^# (.+)\n?/m);
  if (h1) { title = h1[1].trim(); body = body.replace(h1[0], ''); }

  body = body.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_m, file: string) => {
    const name = file.trim();
    const i = attachments.push(name);
    return `![](./img-${String(i).padStart(2, '0')}${name.slice(name.lastIndexOf('.'))})`;
  });
  body = body.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_m, note: string, label?: string) => (label ?? note).trim());
  body = body.replace(/^> \[!\w+\][ ]*(.*)$/gm, (_m, t: string) => (t.trim() ? `> **${t.trim()}**` : DROP));
  body = body.split('\n').filter((line) => line !== DROP).join('\n');
  body = body.replace(/==([^=\n]+)==/g, '**$1**');

  return { body: body.trim(), attachments, title };
}
