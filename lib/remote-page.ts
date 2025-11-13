// lib/remote-page.ts
import "server-only";

export type RemotePage = {
  title?: string;
  body_md?: string;
};

export async function getRemotePage(slugKey: string): Promise<RemotePage | null> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!folderId || !apiKey) return null;

  // Helper to find a file by exact name in the folder
  async function findFile(name: string) {
    const q = encodeURIComponent(
      `'${folderId}' in parents and name='${name}' and trashed=false`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const file = data.files?.[0];
    return file || null;
  }

  // Try JSON: remote_xxx.json
  const jsonFile = await findFile(`${slugKey}.json`);
  if (jsonFile?.id) {
    const contentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${jsonFile.id}?alt=media&key=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!contentRes.ok) return null;
    const json = (await contentRes.json()) as RemotePage;
    return json.body_md ? json : { ...json, body_md: json.body_md ?? "" };
  }

  // Try MD: remote_xxx.md
  const mdFile = await findFile(`${slugKey}.md`);
  if (mdFile?.id) {
    const contentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${mdFile.id}?alt=media&key=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!contentRes.ok) return null;
    const body_md = await contentRes.text();
    return { title: slugKey, body_md };
  }

  return null;
}
