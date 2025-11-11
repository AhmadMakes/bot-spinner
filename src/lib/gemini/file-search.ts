const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

const apiKey = process.env.GEMINI_API_KEY;
const location = process.env.GEMINI_FILE_SEARCH_LOCATION;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY');
}

if (!location) {
  throw new Error('Missing GEMINI_FILE_SEARCH_LOCATION');
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

  const sanitizedId = `bot_${botId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const url = `${API_ROOT}/${location}/fileSearchStores?key=${apiKey}&file_search_store_id=${encodeURIComponent(
    sanitizedId
  )}`;

  const body = JSON.stringify({
    config: {
      display_name: `bot-${botId}`,
    },
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (res.ok) {
    const data = await res.json();
    return data.name as string;
  }

  const errorText = await res.text();
  if (res.status === 409 || errorText.includes('ALREADY_EXISTS')) {
    return `${location}/fileSearchStores/${sanitizedId}`;
  }

  throw new Error(`Gemini File Search store error: status ${res.status} ${res.statusText} body=${errorText}`);
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
