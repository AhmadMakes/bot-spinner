"use client";

import { useFormState } from "react-dom";
import { uploadKnowledgeFileAction, type UploadState } from "./actions";

const initialState: UploadState = {};

export function KBUploadForm({ botId }: { botId: string }) {
  const [state, formAction] = useFormState(uploadKnowledgeFileAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <input type="hidden" name="botId" value={botId} />
      <div className="space-y-1">
        <label htmlFor={`file-${botId}`} className="text-sm text-slate-300">
          Upload knowledge file
        </label>
        <input
          id={`file-${botId}`}
          name="file"
          type="file"
          required
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </div>
      {state?.error && <p className="text-xs text-rose-300">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-300">{state.success}</p>}
      <button
        type="submit"
        className="rounded-lg bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
      >
        Upload
      </button>
    </form>
  );
}
