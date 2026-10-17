import { useEffect, useState } from 'react';
import type { CSSProperties, MouseEvent as RME, ReactNode } from 'react';
import { Brain, Briefcase, Code, Database, ExternalLink, Github, Headset, Lightbulb, Mail, MapPin, Menu, Phone, Smartphone, Sparkles, X } from 'lucide-react';
import { resolveUrl, useSiteData } from './content';
import type { Urls } from './content';
import { CORE_NAMES, fill } from './extras';
import './extra.css';

function pickIcon(title: string) {
    const t = title.toLowerCase();
    if (/\bai\b|\bml\b|machine|intelligen/.test(t)) {
        return Brain;
    }
    if (/database|\bdata\b/.test(t)) {
        return Database;
    }
    if (/\bapps?\b|mobile/.test(t)) {
        return Smartphone;
    }
    if (/support|help ?desk/.test(t)) {
        return Headset;
    }
    if (/business/.test(t)) {
        return Briefcase;
    }
    if (/consult|advis|strateg/.test(t)) {
        return Lightbulb;
    }
    if (/software|code|develop|web/.test(t)) {
        return Code;
    }
    return Sparkles;
}

function ServiceArt({ title, index }: { title: string; index: number }) {
    const Icon = pickIcon(title);
    return (
        <div className="svc-art" aria-hidden="true">
            <span className="svc-art-no">{String(index + 1).padStart(2, '0')}</span>
            <span className="svc-art-dots" />
            <div className="svc-art-ring">
                <Icon size={64} strokeWidth={1.4} />
            </div>
        </div>
    );
}

function Video({ src, urls }: { src: string; urls: Urls }) {
    if (!src) {
        return null;
    }
    const yt = src.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    const vm = src.match(/vimeo\.com\/(\d+)/);
    if (yt) {
        return <iframe className="vid" title="Video" allowFullScreen src={'https://www.youtube.com/embed/' + yt[1]} />;
    }
    if (vm) {
        return <iframe className="vid" title="Video" allowFullScreen src={'https://player.vimeo.com/video/' + vm[1]} />;
    }
    const u = resolveUrl(urls, src);
    return u ? <video className="vid" src={u} controls /> : null;
}

export default function Site() {
    const { content, urls, loading } = useSiteData();
    const c = fill(content);
    const [menuOpen, setMenuOpen] = useState(false);
    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const onChange = () => {
            setHash(window.location.hash);
            window.scrollTo(0, 0);
        };
        window.addEventListener('hashchange', onChange);
        return () => window.removeEventListener('hashchange', onChange);
    }, []);
    useEffect(() => {
        document.title = c.seo.title;
    }, [c.seo.title]);

    const favicon = resolveUrl(urls, c.favicon);
    useEffect(() => {
        if (!favicon) {
            return;
        }
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        const target = link;
        target.type = 'image/png';
        target.href = favicon;
        // Crop the favicon into a circle via canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                img,
                (img.naturalWidth - side) / 2,
                (img.naturalHeight - side) / 2,
                side,
                side,
                0,
                0,
                size,
                size
            );
            target.href = canvas.toDataURL('image/png');
        };
        img.src = favicon;
    }, [favicon]);

    if (loading) {
        return <div className="site-loading" />;
    }

    const domId = (id: string) => (id === 'hero' ? 'home' : id);
    const go = (id: string) => (e: RME) => {
        setMenuOpen(false);
        if (window.location.hash === '#/' + id || (id === 'home' && window.location.hash === '#/')) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const style = {
        '--accent': c.theme.accent,
        '--dark': c.theme.dark,
        '--light': c.theme.light,
        '--text': c.theme.text,
        '--hf': `'${c.theme.headingFont}'`,
        '--bf': `'${c.theme.bodyFont}'`,
    } as CSSProperties;

    const ids = [
        ...c.order,
        ...Object.keys(CORE_NAMES).filter((i) => !c.order.includes(i)),
        ...c.custom.map((s) => s.id).filter((i) => !c.order.includes(i)),
    ].filter(
        (id) => id !== 'skills' && !c.hidden.includes(id)
    );
    const coreNav: Record<string, string> = {
        hero: c.nav.home,
        services: c.nav.services,
        about: c.nav.about,
        contact: c.nav.contact,
        skills: c.skills.navLabel,
        projects: c.projects.navLabel,
        experience: c.experience.navLabel,
        credentials: c.credentials.navLabel,
    };
    const navItems: [string, string][] = [];
    ids.forEach((id) => {
        const cs = c.custom.find((s) => s.id === id);
        if (cs && cs.inNav) {
            navItems.push([id, cs.title]);
        } else if (coreNav[id]) {
            navItems.push([domId(id), coreNav[id]]);
        }
    });

    const pageIds = navItems.map(([id]) => id).filter((id) => id !== 'home');
    const current = hash.replace(/^#\/?/, '').split(/[?/]/)[0];
    const page = pageIds.includes(current) ? current : 'home';
    // Each nav item is its own page; everything not in the nav stays on Home
    const visibleIds = ids.filter((id) => {
        const dom = domId(id);
        return page === 'home' ? !pageIds.includes(dom) : dom === page;
    });

    const waDigits = c.contact.whatsapp.replace(/\D/g, '');
    const waLink = waDigits ? `https://wa.me/${waDigits}` : '#/';
    const phoneDigits = c.contact.phone.replace(/[^\d+]/g, '');
    const logo = resolveUrl(urls, c.brand.logo) || favicon;
    const portrait = resolveUrl(urls, c.hero.portrait);
    const accents = c.hero.accents.map((p) => resolveUrl(urls, p)).filter(Boolean).slice(0, 4);
    const aboutImg = resolveUrl(urls, c.about.image);
    const partnersImg = resolveUrl(urls, c.partners.image);
    const heroBg = resolveUrl(urls, c.heroBackground);

    const renderers: Record<string, () => ReactNode> = {
        hero: () => (
            <section
                id="home"
                className="hero"
                key="hero"
                style={heroBg ? { backgroundImage: `linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,.62)),url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
                <div className="wrap hero-in">
                    <div className="hero-copy">
                        {c.labels.badge && (
                            <span className='badge'>
                                <i />
                                {c.labels.badge}
                            </span>
                        )}
                        <h1>{c.hero.name}</h1>
                        <ul className="roles">
                            {c.hero.roles.filter(Boolean).map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                        {c.labels.heroButton && (
                            <a className="btn" href={c.labels.heroButtonLink || waLink} target="_blank" rel="noreferrer">
                                {c.labels.heroButton}
                            </a>
                        )}
                    </div>
                    <div className="hero-art">
                        {accents.map((src, i) => (
                            <img key={i} src={src} alt="" className={'acc acc' + i} />
                        ))}
                        {portrait ? (
                            <img src={portrait} alt={c.hero.name} className="portrait" />
                        ) : (
                            <div className="portrait ph">{c.labels.photoPlaceholder}</div>
                        )}
                    </div>
                </div>
                <div className="wrap stats">
                    {c.stats.map((s, i) => (
                        <div className="stat" key={i}>
                            <h4>{s.value}</h4>
                            <p>{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>
        ),
        services: () => (
            <section id="services" className="services" key="services">
                <div className="wrap">
                    <h2 className="sec-title">{c.services.heading}</h2>
                    <p className="sec-intro">{c.services.intro}</p>
                    {c.services.items.map((s, i) => {
                        const img = resolveUrl(urls, s.image);
                        return (
                            <article className={'svc' + (i % 2 ? ' rev' : '')} key={i}>
                                <div className="svc-img">{img ? <img src={img} alt={s.title} /> : <ServiceArt title={s.title} index={i} />}</div>
                                <div className="svc-copy">
                                    <span className="num">{String(i + 1).padStart(2, '0')}.</span>
                                    <h3>{s.title}</h3>
                                    <p>{s.description}</p>
                                </div>
                            </article>
                        );
                    })}
                    {devRenderers.skills()}
                </div>
            </section>
        ),
        about: () => (
            <section id="about" className="about" key="about">
                <div className="wrap about-in">
                    <div className="about-img">{aboutImg ? <img src={aboutImg} alt={c.about.subheading} /> : <div className="img-ph" />}</div>
                    <div className="about-copy">
                        <h2 className="sec-title left">{c.about.heading}</h2>
                        <h3>{c.about.subheading}</h3>
                        {c.about.paragraphs.filter(Boolean).map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                </div>
            </section>
        ),
        contact: () => (
            <section id="contact" className="cta" key="contact">
                <div className="wrap">
                    <h2>{c.contact.heading}</h2>
                    <p>{c.contact.text}</p>
                    {c.contact.buttonLabel && (
                        <a className="btn" href={waLink} target="_blank" rel="noreferrer">
                            {c.contact.buttonLabel}
                        </a>
                    )}
                </div>
            </section>
        ),
        partners: () =>
            partnersImg ? (
                <section className="partners" key="partners">
                    <div className="wrap">
                        {c.partners.heading && <h2 className="sec-title">{c.partners.heading}</h2>}
                        <img src={partnersImg} alt="Partners" />
                    </div>
                </section>
            ) : null,
    };

    const devRenderers: Record<string, () => ReactNode> = {
        skills: () => (
            <div id='skills' className='skills-inline'>
                <div className='wrap'>
                    <h2 className='sec-title'>{c.skills.heading}</h2>
                    <p className='sec-intro'>{c.skills.intro}</p>
                    <div className='skill-grid'>
                        {c.skills.groups.map((g, i) => (
                            <div className='skill-card' key={i}>
                                <h3>{g.title}</h3>
                                <div className='tags'>
                                    {g.tags.filter(Boolean).map((t, j) => (
                                        <span className='tag' key={j}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
        projects: () => (
            <section id='projects' className='dev-sec' key='projects'>
                <div className='wrap'>
                    <h2 className='sec-title'>{c.projects.heading}</h2>
                    <p className='sec-intro'>{c.projects.intro}</p>
                    <div className='proj-grid'>
                        {c.projects.entries.map((p, i) => {
                            const link = p.demoUrl || p.repoUrl;
                            const img = resolveUrl(urls, p.image) || (p.demoUrl ? 'https://s0.wp.com/mshots/v1/' + encodeURIComponent(p.demoUrl) + '?w=1000&h=625' : '');
                            return (
                                <article className='proj' key={i}>
                                    <div className='proj-shot'>{img ? <img src={img} alt={p.title + ' preview'} loading='lazy' /> : <div className='img-ph' />}</div>
                                    <div className='proj-body'>
                                        <h3>{link ? <a className='proj-link' href={link} target='_blank' rel='noreferrer'>{p.title}</a> : p.title}</h3>
                                        <p>{p.description}</p>
                                        <div className='tags'>
                                            {p.tags.filter(Boolean).map((t, j) => (
                                                <span className='tag' key={j}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                        <div className='links'>
                                            {p.repoUrl && (
                                                <a href={p.repoUrl} target='_blank' rel='noreferrer'>
                                                    <Github size={16} /> Code
                                                </a>
                                            )}
                                            {p.demoUrl && (
                                                <a href={p.demoUrl} target='_blank' rel='noreferrer'>
                                                    <ExternalLink size={16} /> Live demo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>
        ),
        experience: () => (
            <section id='experience' className='dev-sec dark' key='experience'>
                <div className='wrap'>
                    <h2 className='sec-title'>{c.experience.heading}</h2>
                    <div className='timeline'>
                        {c.experience.jobs.map((j, i) => (
                            <div className='job' key={i}>
                                <h3>
                                    {j.role}
                                    {j.company ? ' - ' + j.company : ''}
                                </h3>
                                <div className='meta'>{[j.period, j.location].filter(Boolean).join(' | ')}</div>
                                <ul>
                                    {j.points.filter(Boolean).map((pt, k) => (
                                        <li key={k}>{pt}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        ),
        credentials: () => (
            <section id='credentials' className='dev-sec' key='credentials'>
                <div className='wrap'>
                    <h2 className='sec-title'>{c.credentials.heading}</h2>
                    <div className='cred-grid'>
                        {c.credentials.records.map((r, i) => (
                            <div className='cred' key={i}>
                                <h3>{r.title}</h3>
                                <p>{[r.issuer, r.year].filter(Boolean).join(' | ')}</p>
                                {r.link && (
                                    <a href={r.link} target='_blank' rel='noreferrer'>
                                        View credential
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        ),
    };

    const customSection = (id: string): ReactNode => {
        const s = c.custom.find((x) => x.id === id);
        if (!s) {
            return null;
        }
        const img = resolveUrl(urls, s.image);
        return (
            <section id={s.id} key={s.id} className={'cs' + (s.dark ? ' dark' : '')}>
                <div className={'wrap cs-in' + (img ? '' : ' solo')}>
                    {img && <img src={img} alt={s.title} />}
                    <div>
                        <h2 className="sec-title left">{s.title}</h2>
                        {s.text.split('\n').filter(Boolean).map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                        <Video src={s.video} urls={urls} />
                        {s.buttonLabel && s.buttonUrl && (
                            <a className="btn" href={s.buttonUrl} target="_blank" rel="noreferrer">
                                {s.buttonLabel}
                            </a>
                        )}
                    </div>
                </div>
            </section>
        );
    };

    const downloads = c.downloads.filter((d) => d.file && resolveUrl(urls, d.file));

    return (
        <div className="site" style={style}>
            {c.customCss && <style>{c.customCss}</style>}
            <header className="hdr">
                <div className="wrap hdr-in">
                    <a href="#/" className="brand" onClick={go('home')}>
                        {logo ? <img src={logo} alt={c.brand.name} /> : <span>{c.brand.name}</span>}
                    </a>
                    <nav className={menuOpen ? 'nav open' : 'nav'}>
                        {navItems.map(([id, label]) => (
                            <a key={id} href={'#/' + id} onClick={go(id)}>
                                {label}
                            </a>
                        ))}
                    </nav>
                    <button className="burger" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>
            </header>

            {visibleIds.map((id) => {
                const render = renderers[id] ?? devRenderers[id];
                return render ? render() : customSection(id);
            })}

            <footer className="ftr">
                <div className="wrap">
                    <div className="ftr-cols">
                        <div>
                            <h5>
                                <MapPin size={16} /> {c.labels.address}
                            </h5>
                            <p>{c.contact.address}</p>
                        </div>
                        <div>
                            <h5>
                                <Phone size={16} /> {c.labels.phone}
                            </h5>
                            <p>
                                <a href={'tel:' + phoneDigits}>{c.contact.phone}</a>
                            </p>
                        </div>
                        <div>
                            <h5>
                                <Mail size={16} /> {c.labels.email}
                            </h5>
                            <p>
                                <a href={'mailto:' + c.contact.email}>{c.contact.email}</a>
                            </p>
                        </div>
                        {downloads.length > 0 && (
                            <div className="dl">
                                <h5>{c.labels.downloads}</h5>
                                {downloads.map((d, i) => (
                                    <a key={i} href={resolveUrl(urls, d.file)} target="_blank" rel="noreferrer">
                                        {d.label || 'Download'}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="ftr-bottom">
                        <span>{c.footer.copyright}</span>
                        <div className="social">
                            {c.social.filter((s) => s.url).map((s, i) => (
                                <a key={i} href={s.url} target="_blank" rel="noreferrer">
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
