"use client";

import { useFormState } from "react-dom";
import { useRef, useState } from "react";
import { uploadKnowledgeFileAction, type UploadState } from "./actions";

const initialState: UploadState = {};
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function KBUploadForm({ botId }: { botId: string }) {
  const [state, formAction] = useFormState(uploadKnowledgeFileAction, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const file = fileRef.current?.files?.[0];
    if (file && file.size > MAX_FILE_BYTES) {
      event.preventDefault();
      setClientError("File must be under 4 MB to upload.");
      return;
    }
    setClientError(null);
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"
    >
      <input type="hidden" name="botId" value={botId} />
      <div className="space-y-1">
        <label htmlFor={`file-${botId}`} className="text-sm text-slate-300">
          Upload knowledge file (max 4 MB)
        </label>
        <input
          ref={fileRef}
          id={`file-${botId}`}
          name="file"
          type="file"
          required
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </div>
      {(clientError || state?.error) && (
        <p className="text-xs text-rose-300">{clientError ?? state.error}</p>
      )}
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
