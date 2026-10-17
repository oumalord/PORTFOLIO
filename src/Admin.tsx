import { createContext, useContext, useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { api } from './api';
import { ArrowDown, ArrowUp, ExternalLink, LogOut, Plus, Save, Trash2, Upload } from 'lucide-react';
import { FONT_CHOICES, fileToUpload, resolveUrl, useSiteData } from './content';
import type { Urls } from './content';
import { CORE_NAMES, fill } from './extras';
import type { Full } from './extras';

const inp =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400';
const btn =
    'inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50';
const ghost =
    'inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50';

const msg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
const human = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

const LABELS: Record<string, string> = {
    demoUrl: 'Project link (the card opens this; its preview is made from it automatically)',
    repoUrl: 'Code link (optional)',
};

const TEMPLATES: Record<string, unknown> = {
    custom: { id: '', title: 'New section', text: '', image: '', video: '', buttonLabel: '', buttonUrl: '', dark: false, inNav: true },
    social: { label: '', url: '' },
    stats: { value: '', label: '' },
    items: { title: 'New service', description: '', image: '' },
    downloads: { label: '', file: '' },
    groups: { title: 'New group', tags: [] },
    entries: { title: 'New project', description: '', tags: [], image: '', repoUrl: '', demoUrl: '' },
    jobs: { role: '', company: '', period: '', location: '', points: [] },
    records: { title: '', issuer: '', year: '', link: '' },
};

const TAB_NAMES: Record<string, string> = {
    custom: 'Custom sections',
    seo: 'Browser title',
    labels: 'Text labels',
    credentials: 'Education & certs',
    skills: 'Skills (shown in Services)',
    layout: 'Layout',
    advanced: 'Advanced',
};

type Kind = 'image' | 'file' | 'color' | 'font' | 'long' | 'text';

function kindOf(k: string, top: string): Kind {
    if (top === 'theme' && /^(accent|dark|light|text)$/.test(k)) {
        return 'color';
    }
    if (/Font$/.test(k)) {
        return 'font';
    }
    if (/^(file|video)$/.test(k)) {
        return 'file';
    }
    if (/image|logo|portrait|accent|favicon|background/i.test(k)) {
        return 'image';
    }
    if (/^(text|description|intro|paragraphs|points|customCss)$/.test(k)) {
        return 'long';
    }
    return 'text';
}

const Ctx = createContext<{ upload: (f: File) => Promise<string>; urls: Urls }>({
    upload: async () => '',
    urls: {},
});

interface NodeProps {
    k: string;
    top: string;
    v: unknown;
    label?: string;
    onChange: (n: unknown) => void;
}

function Node({ k, top, v, label, onChange }: NodeProps) {
    const { upload, urls } = useContext(Ctx);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const title = label === undefined ? (LABELS[k] ?? human(k)) : label;

    const pickOne = async (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) {
            return;
        }
        setBusy(true);
        setErr('');
        try {
            onChange(await upload(f));
        } catch (ex) {
            setErr(msg(ex));
        }
        setBusy(false);
    };

    if (typeof v === 'boolean') {
        return (
            <label className="mb-3 flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} /> {human(k)}
            </label>
        );
    }

    if (typeof v === 'string') {
        const kd = kindOf(k, top);
        const src = resolveUrl(urls, v);
        let body: ReactNode;
        if (kd === 'color') {
            body = (
                <div className="flex gap-2">
                    <input type="color" className="h-9 w-12 cursor-pointer rounded border border-gray-300" value={v} onChange={(e) => onChange(e.target.value)} />
                    <input className={inp} value={v} onChange={(e) => onChange(e.target.value)} />
                </div>
            );
        } else if (kd === 'font') {
            body = (
                <select className={inp} value={v} onChange={(e) => onChange(e.target.value)}>
                    {FONT_CHOICES.map((f) => (
                        <option key={f}>{f}</option>
                    ))}
                </select>
            );
        } else if (kd === 'long') {
            body = <textarea className={inp + (k === 'customCss' ? ' font-mono' : '')} rows={k === 'customCss' ? 10 : 4} value={v} onChange={(e) => onChange(e.target.value)} />;
        } else if (kd === 'image') {
            body = (
                <div className="flex items-center gap-3">
                    <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-white">
                        {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-gray-400">No image</span>}
                    </div>
                    <label className={ghost + ' cursor-pointer'}>
                        <Upload size={14} /> {busy ? 'Uploading...' : src ? 'Replace' : 'Upload'}
                        <input type="file" accept="image/*" className="hidden" onChange={pickOne} disabled={busy} />
                    </label>
                    {v && (
                        <button type="button" className={ghost} onClick={() => onChange('')}>
                            <Trash2 size={14} /> Remove
                        </button>
                    )}
                </div>
            );
        } else if (kd === 'file') {
            body = (
                <div className="flex gap-2">
                    <input className={inp} value={v} placeholder={k === 'video' ? 'Paste a YouTube/Vimeo link, or upload an MP4' : 'Upload a file (PDF, MP4...)'} onChange={(e) => onChange(e.target.value)} />
                    <label className={ghost + ' cursor-pointer whitespace-nowrap'}>
                        <Upload size={14} /> {busy ? 'Uploading...' : 'Upload'}
                        <input type="file" accept="application/pdf,video/mp4,video/webm,image/*" className="hidden" onChange={pickOne} disabled={busy} />
                    </label>
                </div>
            );
        } else {
            body = <input className={inp} value={v} onChange={(e) => onChange(e.target.value)} />;
        }
        return (
            <div className="mb-3">
                {title && <span className="mb-1 block text-xs font-semibold text-gray-600">{title}</span>}
                {body}
                {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
            </div>
        );
    }

    if (Array.isArray(v)) {
        const arr = v as unknown[];
        const multiImage = kindOf(k, top) === 'image' && TEMPLATES[k] === undefined;
        const add = () => {
            const t = structuredClone(TEMPLATES[k] ?? '');
            if (t && typeof t === 'object' && 'id' in t) {
                (t as { id: string }).id = 'sec' + Date.now().toString(36);
            }
            onChange([...arr, t]);
        };
        const move = (i: number, d: number) => {
            const a = [...arr];
            const j = i + d;
            if (j < 0 || j >= a.length) {
                return;
            }
            [a[i], a[j]] = [a[j], a[i]];
            onChange(a);
        };
        const addMany = async (e: ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            setBusy(true);
            setErr('');
            const added: string[] = [];
            for (const f of files) {
                try {
                    added.push(await upload(f));
                } catch (ex) {
                    setErr(msg(ex));
                }
            }
            onChange([...arr, ...added]);
            setBusy(false);
        };
        return (
            <div className="mb-4">
                {title && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">{title}</p>}
                {arr.map((it, i) => (
                    <div key={i} className="mb-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-gray-500">#{i + 1}</span>
                            <div className="flex gap-1">
                                <button type="button" className={ghost + ' !px-2 !py-1'} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                                    <ArrowUp size={14} />
                                </button>
                                <button type="button" className={ghost + ' !px-2 !py-1'} aria-label="Move down" disabled={i === arr.length - 1} onClick={() => move(i, 1)}>
                                    <ArrowDown size={14} />
                                </button>
                                <button type="button" className={ghost + ' !px-2 !py-1'} aria-label="Delete" onClick={() => onChange(arr.filter((_, j) => j !== i))}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <Node k={k} top={top} v={it} label="" onChange={(n) => onChange(arr.map((x, j) => (j === i ? n : x)))} />
                    </div>
                ))}
                <div className="flex gap-2">
                    <button type="button" className={ghost} onClick={add}>
                        <Plus size={14} /> Add
                    </button>
                    {multiImage && (
                        <label className={ghost + ' cursor-pointer'}>
                            <Upload size={14} /> {busy ? 'Uploading...' : 'Upload several photos'}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={addMany} disabled={busy} />
                        </label>
                    )}
                </div>
                {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
            </div>
        );
    }

    if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        return (
            <div>
                {Object.keys(o)
                    .filter((x) => x !== 'id')
                    .map((x) => (
                        <Node key={x} k={x} top={top} v={o[x]} onChange={(n) => onChange({ ...o, [x]: n })} />
                    ))}
            </div>
        );
    }
    return null;
}

const b64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = () => reject(new Error('Could not read file'));
        r.readAsDataURL(blob);
    });

export default function Admin() {
    const site = useSiteData();
    const [phase, setPhase] = useState<'checking' | 'signedout' | 'ready'>('checking');
    const [draft, setDraft] = useState<Full | null>(null);
    const [extraUrls, setExtraUrls] = useState<Urls>({});
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [note, setNote] = useState('');
    const [authErr, setAuthErr] = useState('');
    const [tab, setTab] = useState('layout');
    const [password, setPassword] = useState('');

    const urls: Urls = { ...site.urls, ...extraUrls };

    const check = async () => {
        try {
            const res = await api.get<{ isOwner: boolean }>('/api/admin/status');
            setPhase(res.data.isOwner ? 'ready' : 'signedout');
        } catch {
            setPhase('signedout');
        }
    };

    useEffect(() => {
        check();
    }, []);

    useEffect(() => {
        if (phase === 'ready' && !site.loading && !draft) {
            setDraft(fill(site.content));
        }
    }, [phase, site.loading, site.content, draft]);

    const signIn = async () => {
        setAuthErr('');
        try {
            await api.post('/api/admin/login', { password });
            setPassword('');
            setPhase('checking');
            await check();
        } catch (e) {
            setAuthErr(msg(e));
        }
    };

    const signOut = async () => {
        await api.post('/api/admin/logout');
        setDraft(null);
        setPhase('signedout');
    };

    const edit = (fn: (d: Full) => Full) => {
        setDraft((p) => (p ? fn(structuredClone(p)) : p));
        setDirty(true);
        setNote('');
    };

    const upload = async (file: File): Promise<string> => {
        let data: string;
        let contentType = file.type;
        if (file.type.startsWith('image/') && file.type !== 'image/gif') {
            ({ data, contentType } = await fileToUpload(file));
        } else {
            if (file.size > 3900000) {
                throw new Error('This file is over about 4 MB. For big videos, paste a YouTube or Vimeo link instead.');
            }
            data = await b64(file);
        }
        const res = await api.post<{ path: string; url: string }>('/api/admin/image', { data, contentType });
        const path = res.data.path as string;
        setExtraUrls((u) => ({ ...u, [path]: res.data.url as string }));
        return path;
    };

    const save = async () => {
        if (!draft) {
            return;
        }
        setSaving(true);
        setNote('');
        try {
            await api.put('/api/admin/site', { content: draft });
            await site.reload();
            setDirty(false);
            setNote('Saved. Your live site is updated.');
        } catch (e) {
            setNote('Save failed: ' + msg(e));
        }
        setSaving(false);
    };

    const shell = (body: ReactNode) => (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">{body}</div>
        </div>
    );

    if (phase === 'checking') {
        return shell(<p className="text-gray-500">Loading...</p>);
    }
    if (phase === 'signedout') {
        return shell(
            <>
                <h1 className="mb-2 text-xl font-bold text-gray-900">Site admin</h1>
                <p className="mb-5 text-sm text-gray-600">Enter the admin password configured on the server.</p>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        signIn();
                    }}
                >
                    <input
                        type="password"
                        autoComplete="current-password"
                        className={inp + ' mb-3'}
                        placeholder="Admin password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <button className={btn} type="submit" disabled={!password}>
                    Sign in to manage your site
                    </button>
                </form>
                {authErr && <p className="mt-3 text-sm text-red-600">{authErr}</p>}
                <p className="mt-5 text-xs">
                    <a href="#/" className="text-gray-500 underline">
                        Back to site
                    </a>
                </p>
            </>
        );
    }
    if (!draft) {
        return shell(<p className="text-gray-500">Loading your content...</p>);
    }

    const d = draft;
    const rec = d as unknown as Record<string, unknown>;
    const skip = ['order', 'hidden', 'gallery'];
    const objKeys = Object.keys(rec).filter((k) => !skip.includes(k) && typeof rec[k] === 'object');
    const scalarKeys = Object.keys(rec).filter((k) => typeof rec[k] !== 'object');
    const tabs = ['layout', ...objKeys, 'advanced'];

    const ids = [
        ...d.order,
        ...Object.keys(CORE_NAMES).filter((i) => !d.order.includes(i)),
        ...d.custom.map((s) => s.id).filter((i) => !d.order.includes(i)),
    ].filter(
        (id) => CORE_NAMES[id] || d.custom.some((s) => s.id === id)
    );
    const secName = (id: string) => CORE_NAMES[id] ?? d.custom.find((s) => s.id === id)?.title ?? id;
    const moveSec = (i: number, dir: number) =>
        edit((x) => {
            const a = [...ids];
            const j = i + dir;
            if (j >= 0 && j < a.length) {
                [a[i], a[j]] = [a[j], a[i]];
            }
            x.order = a;
            return x;
        });
    const toggle = (id: string) =>
        edit((x) => {
            x.hidden = x.hidden.includes(id) ? x.hidden.filter((h) => h !== id) : [...x.hidden, id];
            return x;
        });

    return (
        <Ctx.Provider value={{ upload, urls }}>
            <div className="min-h-screen bg-gray-100 text-gray-900">
                <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <h1 className="text-base font-bold">Site admin</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            {note && <span className="text-xs text-gray-600">{note}</span>}
                            {dirty && !note && <span className="text-xs text-amber-600">Unsaved changes</span>}
                            <a href="#/" target="_blank" rel="noreferrer" className={ghost}>
                                <ExternalLink size={14} /> View site
                            </a>
                            <button className={btn} onClick={save} disabled={saving || !dirty}>
                                <Save size={14} /> {saving ? 'Saving...' : 'Save changes'}
                            </button>
                            <button className={ghost} onClick={signOut}>
                                <LogOut size={14} /> Sign out
                            </button>
                        </div>
                    </div>
                    <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ' + (tab === t ? 'border-amber-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800')}
                            >
                                {TAB_NAMES[t] ?? human(t)}
                            </button>
                        ))}
                    </div>
                </header>

                <main className="mx-auto max-w-5xl px-4 py-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        {tab === 'layout' && (
                            <div>
                                <p className="mb-3 text-sm text-gray-600">Reorder sections, or untick to hide one. Add new sections under "Custom sections".</p>
                                {ids.map((id, i) => (
                                    <div key={id} className="mb-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={!d.hidden.includes(id)} onChange={() => toggle(id)} /> {secName(id)}
                                        </label>
                                        <div className="flex gap-1">
                                            <button className={ghost + ' !px-2 !py-1'} aria-label="Move up" disabled={i === 0} onClick={() => moveSec(i, -1)}>
                                                <ArrowUp size={14} />
                                            </button>
                                            <button className={ghost + ' !px-2 !py-1'} aria-label="Move down" disabled={i === ids.length - 1} onClick={() => moveSec(i, 1)}>
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {tab === 'advanced' &&
                            scalarKeys.map((k) => (
                                <Node key={k} k={k} top="advanced" v={rec[k]} onChange={(n) => edit((x) => ({ ...x, [k]: n }) as Full)} />
                            ))}
                        {tab !== 'layout' && tab !== 'advanced' && objKeys.includes(tab) && (
                            <Node k={tab} top={tab} v={rec[tab]} label="" onChange={(n) => edit((x) => ({ ...x, [tab]: n }) as Full)} />
                        )}
                    </div>
                </main>
            </div>
        </Ctx.Provider>
    );
}
