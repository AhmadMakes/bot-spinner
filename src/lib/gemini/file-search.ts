const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY');
}

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${res.statusText} - ${errorText}`);
  }
  return res.json();
};

export const ensureFileSearchStore = async (botId: string, existingStore?: string | null) => {
  if (existingStore) {
    return existingStore;
  }

  const body = JSON.stringify({
    config: {
      display_name: `bot-${botId}`,
    },
  });

  const store = await fetchJson(`${API_ROOT}/fileSearchStores?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  return store.name as string;
};

export const uploadDocumentToStore = async (opts: {
  storeName: string;
  buffer: ArrayBuffer;
  filename: string;
  mimeType: string | null;
}) => {
  const form = new FormData();
  form.append(
    'config',
    new Blob([JSON.stringify({ display_name: opts.filename })], {
      type: 'application/json',
    })
  );
  form.append(
    'file',
    new Blob([opts.buffer], { type: opts.mimeType || 'application/octet-stream' }),
    opts.filename
  );

  const uploadRes = await fetchJson(
    `${API_ROOT}/${encodeURIComponent(opts.storeName)}:uploadFile?key=${apiKey}`,
    {
      method: 'POST',
      body: form,
    }
  );

  let operation = uploadRes;
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    operation = await fetchJson(`${API_ROOT}/${operation.name}?key=${apiKey}`);
  }

  if (operation.error) {
    throw new Error(operation.error.message);
  }

  const fileName = operation.response?.files?.[0]?.name;
  if (!fileName) {
    throw new Error('Gemini upload succeeded but no file name returned.');
  }

  return fileName as string;
};
