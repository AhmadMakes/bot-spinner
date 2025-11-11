import { createSupabaseServerComponentClient } from '@/lib/supabase/clients';
import { listBotsWithKnowledge } from '@/lib/supabase/bots';
import { KBUploadForm } from './kb-upload-form';

export default async function BotsPage() {
  const supabase = await createSupabaseServerComponentClient();
  const bots = await listBotsWithKnowledge(supabase);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 text-slate-50">
      <header>
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">Bots & Knowledge Bases</h1>
        <p className="mt-2 text-sm text-slate-400">
          Upload documents per bot to ground Gemini answers via File Search.
        </p>
      </header>

      {bots.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
          No bots yet. Seed one via Supabase or the admin interface.
        </p>
      )}

      <div className="space-y-6">
        {bots.map((bot) => (
          <section key={bot.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{bot.name}</h2>
                <p className="text-sm text-slate-400">{bot.description ?? 'No description provided.'}</p>
                <p className="text-xs text-slate-500">
                  File Search store: {bot.fileSearchStoreId ?? 'Not created yet'}
                </p>
              </div>
              <KBUploadForm botId={bot.id} />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-200">Knowledge Files</h3>
              {bot.kbFiles.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">No files uploaded yet.</p>
              )}
              <ul className="mt-3 space-y-3 text-sm">
                {bot.kbFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex flex-col rounded-xl border border-white/5 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{file.storagePath.split('/').pop()}</p>
                      <p className="text-xs text-slate-400">
                        Uploaded {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Status: <span className="text-white">{file.status}</span>
                      </p>
                      {file.errorMessage && (
                        <p className="text-xs text-rose-300">Error: {file.errorMessage}</p>
                      )}
                      {file.geminiFileId && (
                        <p className="text-xs text-slate-400">Gemini file: {file.geminiFileId}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
