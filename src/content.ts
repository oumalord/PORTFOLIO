import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface ServiceItem {
  title: string;
  description: string;
  image: string;
}

export interface Content {
  seo: { title: string };
  theme: {
    accent: string;
    dark: string;
    light: string;
    text: string;
    headingFont: string;
    bodyFont: string;
  };
  brand: { name: string; logo: string };
  nav: {
    home: string;
    about: string;
    services: string;
    gallery: string;
    contact: string;
  };
  hero: { name: string; roles: string[]; portrait: string; accents: string[] };
  stats: { value: string; label: string }[];
  services: { heading: string; intro: string; items: ServiceItem[] };
  about: {
    heading: string;
    subheading: string;
    paragraphs: string[];
    image: string;
  };
  contact: {
    heading: string;
    text: string;
    buttonLabel: string;
    whatsapp: string;
    phone: string;
    email: string;
    address: string;
  };
  partners: { heading: string; image: string };
  gallery: { heading: string; images: string[] };
  social: { label: string; url: string }[];
  footer: { copyright: string };
}

export type Urls = Record<string, string>;

export const FONT_CHOICES = [
  'Playfair Display',
  'Cormorant Garamond',
  'DM Serif Display',
  'Lora',
  'Poppins',
  'Montserrat',
  'Inter',
  'Space Grotesk',
  'JetBrains Mono',
];

export const DEFAULT_CONTENT: Content = {
  seo: { title: 'Your Name | Software Engineer & IT Professional' },
  theme: {
    accent: '#c9a24b',
    dark: '#14110f',
    light: '#faf7f2',
    text: '#2a2420',
    headingFont: 'Playfair Display',
    bodyFont: 'Poppins',
  },
  brand: { name: 'Your Name', logo: '' },
  nav: {
    home: 'Home',
    about: 'About Me',
    services: 'Services',
    gallery: 'Gallery',
    contact: 'Contact me',
  },
  hero: {
    name: 'Your Name',
    roles: [
      'Software Engineer',
      'Full-Stack & Cloud Developer',
      'IT Systems & Support Specialist',
    ],
    portrait: '',
    accents: [],
  },
  stats: [
    { value: '5+', label: 'Years in tech' },
    { value: '30+', label: 'Projects delivered' },
    { value: '15+', label: 'Systems and apps deployed' },
  ],
  services: {
    heading: 'What I do:',
    intro:
      'From custom software and apps to AI, databases, IT support and consulting, I help businesses build and run the technology they depend on.',
    items: [
      {
        title: 'Software Development',
        description: 'Full-stack web and mobile applications, REST APIs and automation, built with clean, tested and maintainable code.',
        image: '',
      },
      {
        title: 'App Development',
        description: 'Mobile and web applications designed around your users, built to be fast, reliable and easy to maintain.',
        image: '',
      },
      {
        title: 'Business Consultations',
        description: 'Practical advice that helps businesses choose the right technology, streamline operations and plan for growth.',
        image: '',
      },
      {
        title: 'AI & ML',
        description: 'Machine learning models and AI-powered features that automate work and turn your data into useful decisions.',
        image: '',
      },
      {
        title: 'Database Management',
        description: 'Database design, optimisation, backups and security so your data stays organised, fast and safe.',
        image: '',
      },
      {
        title: 'IT Support',
        description: 'Responsive help with hardware, software, networks and accounts to keep your team productive.',
        image: '',
      },
      {
        title: 'IT Consultation',
        description: 'Expert guidance on IT strategy, systems and infrastructure, from planning and selection to implementation.',
        image: '',
      },
    ],
  },
  about: {
    heading: 'About Me',
    subheading: 'Software Engineer & IT Professional',
    paragraphs: [
      'I am a software engineer and IT professional who enjoys turning real-world problems into dependable software. Replace this with your own story, background and what you are focused on right now.',
      'Add a second paragraph about the teams you work with, your engineering values and what you are looking for next.',
    ],
    image: '',
  },
  contact: {
    heading: 'Have a project or role in mind?',
    text: 'I am open to freelance projects, collaborations and full-time opportunities. Send a message and I will get back to you quickly.',
    buttonLabel: 'Get in touch',
    whatsapp: '+254700000000',
    phone: '+254 700 000 000',
    email: 'you@example.com',
    address: 'Remote / Worldwide',
  },
  partners: { heading: '', image: '' },
  gallery: { heading: 'Gallery', images: [] },
  social: [
    { label: 'GitHub', url: 'https://github.com/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'X', url: 'https://x.com/' },
  ],
  footer: { copyright: '© 2026 Your Name. All rights reserved.' },
};

function merge(base: any, over: any): any {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) {
    return over === undefined || over === null ? base : over;
  }
  const out: any = { ...base };
  if (over && typeof over === 'object') {
    for (const k of Object.keys(over)) {
      out[k] = k in base ? merge(base[k], over[k]) : over[k];
    }
  }
  return out;
}

export function mergeContent(saved: unknown): Content {
  return merge(DEFAULT_CONTENT, saved) as Content;
}

export function resolveUrl(urls: Urls, path: string): string {
  if (!path) {
    return '';
  }
  if (urls[path]) {
    return urls[path];
  }
  return path.startsWith('http') || path.startsWith('data:') ? path : '';
}

export function useSiteData() {
  const [state, setState] = useState<{
    content: Content;
    urls: Urls;
    loading: boolean;
  }>({
    content: DEFAULT_CONTENT,
    urls: {},
    loading: true,
  });

  const reload = useCallback(async () => {
    try {
      const res = await api.get<{ content: unknown; urls?: Urls }>('/api/site');
      setState({
        content: mergeContent(res.data.content),
        urls: res.data.urls || {},
        loading: false,
      });
    } catch (e) {
      console.error('Failed to load site', e);
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

export async function fileToUpload(
  file: File,
  maxDim = 1800
): Promise<{ data: string; contentType: string }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      'This image format is not supported. Please use JPG, PNG or WebP.'
    );
  }
  let scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not process image');
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', 0.85)
    );
    if (blob && blob.size < 3000000) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read image'));
        reader.readAsDataURL(blob);
      });
      return {
        data: dataUrl.split(',')[1],
        contentType: blob.type || 'image/webp',
      };
    }
    scale *= 0.75;
  }
  throw new Error('Image is too large even after compression');
}
