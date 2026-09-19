/**
 * Saved arrangements: "Save as..." saves every track with the settings they
 * play under, a list to load back (replacing the current tracks, with a
 * confirm when there are Custom edits nobody saved), rename and delete (with
 * a confirm), and the whole list as a JSON file out and in. The list lives in
 * the lab's own key with the rest of the bench's settings; the shapes,
 * validation and the migration of older single-track entries are in
 * sequencerTracks.ts.
 */
import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { describe, libraryFile, newId, parseLibrary, type SavedArrangement } from './sequencerTracks';

const FIELD = 'h-9 text-base md:text-base';

export default function SequencerLibrary({ library, trackCount, dirty, onSave, onLoad, onRename, onDelete, onImport }: {
  library: SavedArrangement[];
  trackCount: number;
  /** The current tracks have Custom edits not in any save: a load asks first. */
  dirty: boolean;
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onImport: (arrangements: SavedArrangement[]) => void;
}) {
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null);
  const [confirming, setConfirming] = useState<{ id: string; action: 'delete' | 'load' } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const save = () => {
    const n = name.trim() || `Arrangement ${new Date().toLocaleString()}`;
    onSave(n);
    setName('');
    setNote(`Saved "${n}".`);
  };

  const load = (t: SavedArrangement) => {
    onLoad(t.id);
    setConfirming(null);
    setNote(`Loaded "${t.name}".`);
  };

  const exportFile = () => {
    const blob = new Blob([libraryFile(library)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequencer-arrangements.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importFile = async (file: File) => {
    try {
      const list = parseLibrary(JSON.parse(await file.text()));
      // Fresh ids, so importing the same file twice gives two copies rather than clashes.
      onImport(list.map((t) => ({ ...t, id: newId() })));
      setNote(list.length ? `Imported ${list.length} arrangement${list.length === 1 ? '' : 's'}.` : 'No arrangements in that file.');
    } catch {
      setNote('That file is not a sequencer arrangements file.');
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-4" data-library="">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-xl font-semibold">Saved arrangements</h2>
        <Button variant="outline" className="text-base" onClick={exportFile} disabled={library.length === 0}>
          <Download /> Export JSON
        </Button>
        <Button variant="outline" className="text-base" onClick={() => fileRef.current?.click()}>
          <Upload /> Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Import arrangements file"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (f) void importFile(f);
          }}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1.5">
          <span className="text-base text-muted-foreground">Save as...</span>
          <Input aria-label="Arrangement name" placeholder="Name" className={FIELD} value={name}
            onChange={(e) => setName(e.currentTarget.value)} />
        </label>
        <Button className="text-base" onClick={save}>
          Save {trackCount} track{trackCount === 1 ? '' : 's'}
        </Button>
      </div>
      {note && <p className="text-base text-muted-foreground" role="status">{note}</p>}

      {library.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Nothing saved yet. An arrangement keeps every track&apos;s steps and settings, and the mode, key, instruments and tempo they play under.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {library.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-2" data-saved={t.name}>
              {renaming?.id === t.id ? (
                <form
                  className="flex min-w-48 flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (renaming.draft.trim()) onRename(t.id, renaming.draft.trim().slice(0, 80));
                    setRenaming(null);
                  }}
                >
                  <Input autoFocus aria-label="New name" className={FIELD} value={renaming.draft}
                    onChange={(e) => setRenaming({ id: t.id, draft: e.currentTarget.value })} />
                  <Button type="submit" className="text-base">OK</Button>
                  <Button type="button" variant="outline" className="text-base" onClick={() => setRenaming(null)}>Cancel</Button>
                </form>
              ) : (
                <div className="flex min-w-48 flex-1 flex-col">
                  <span className="text-base font-medium">{t.name}</span>
                  <span className="text-base text-muted-foreground">{describe(t)}</span>
                </div>
              )}
              {confirming?.id === t.id ? (
                <div className="flex flex-wrap items-center gap-2" data-confirm={confirming.action}>
                  {confirming.action === 'delete' ? (
                    <>
                      <span className="text-base">Delete &quot;{t.name}&quot;?</span>
                      <Button variant="destructive" className="text-base" onClick={() => { onDelete(t.id); setConfirming(null); }}>Delete</Button>
                    </>
                  ) : (
                    <>
                      <span className="text-base">Replace the current tracks? Their Custom edits are not saved.</span>
                      <Button variant="destructive" className="text-base" onClick={() => load(t)}>Replace</Button>
                    </>
                  )}
                  <Button variant="outline" className="text-base" onClick={() => setConfirming(null)}>Keep</Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="text-base"
                    onClick={() => (dirty ? setConfirming({ id: t.id, action: 'load' }) : load(t))}>
                    Load
                  </Button>
                  <Button variant="ghost" className="text-base" onClick={() => setRenaming({ id: t.id, draft: t.name })}>Rename</Button>
                  <Button variant="ghost" className="text-base" onClick={() => setConfirming({ id: t.id, action: 'delete' })}>Delete</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
