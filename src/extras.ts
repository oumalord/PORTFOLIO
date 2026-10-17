import type { Content } from './content';

export interface CustomSection {
    id: string;
    title: string;
    text: string;
    image: string;
    video: string;
    buttonLabel: string;
    buttonUrl: string;
    dark: boolean;
    inNav: boolean;
}

export interface Extra {
    labels: {
        heroButton: string;
        heroButtonLink: string;
        address: string;
        phone: string;
        email: string;
        downloads: string;
        photoPlaceholder: string;
        badge: string;
    };
    order: string[];
    hidden: string[];
    custom: CustomSection[];
    downloads: { label: string; file: string }[];
    favicon: string;
    heroBackground: string;
    customCss: string;
    skills: { navLabel: string; heading: string; intro: string; groups: { title: string; tags: string[] }[] };
    projects: {
        navLabel: string;
        heading: string;
        intro: string;
        entries: { title: string; description: string; tags: string[]; image: string; repoUrl: string; demoUrl: string }[];
    };
    experience: {
        navLabel: string;
        heading: string;
        jobs: { role: string; company: string; period: string; location: string; points: string[] }[];
    };
    credentials: {
        navLabel: string;
        heading: string;
        records: { title: string; issuer: string; year: string; link: string }[];
    };
}

export type Full = Content & Extra;

export const EXTRA: Extra = {
    labels: {
        heroButton: 'Get in touch',
        heroButtonLink: '',
        address: 'Address',
        phone: 'Phone',
        email: 'Email',
        downloads: 'Downloads',
        photoPlaceholder: 'Your photo',
        badge: '',
    },
    order: ['hero', 'about', 'services', 'projects', 'experience', 'credentials', 'contact', 'partners'],
    hidden: [],
    custom: [],
    downloads: [],
    favicon: '',
    heroBackground: '',
    customCss: '',
    skills: {
        navLabel: 'Skills',
        heading: 'Tech stack & skills',
        intro: 'The languages, tools and platforms I use to build and run dependable systems.',
        groups: [
            { title: 'Languages', tags: ['TypeScript', 'JavaScript', 'Python', 'Java', 'SQL'] },
            { title: 'Frontend', tags: ['React', 'Next.js', 'Tailwind CSS', 'HTML & CSS'] },
            { title: 'Backend & Data', tags: ['Node.js', 'REST APIs', 'PostgreSQL', 'MongoDB'] },
            { title: 'Cloud & DevOps', tags: ['AWS', 'Docker', 'Linux', 'CI/CD', 'Git & GitHub'] },
            { title: 'IT & Infrastructure', tags: ['Networking', 'Windows & Linux admin', 'Troubleshooting', 'Security basics'] },
        ],
    },
    projects: {
        navLabel: 'Projects',
        heading: 'Selected projects',
        intro: 'Live projects I have built and deployed. Click any card to open the project.',
        entries: [
            { title: 'RentFlow', description: 'A rental property management platform covering property management, rent payments, maintenance requests and tenant communication.', tags: ['Property management', 'Web app'], image: '', repoUrl: '', demoUrl: 'https://demmy-frontend.vercel.app/' },
            { title: 'KGGA LMS', description: 'A learning management system for the Kenya Girl Guides Association, giving members and leaders a place to learn and train online.', tags: ['LMS', 'E-learning', 'Web app'], image: '', repoUrl: '', demoUrl: 'https://kenyagirlguidesassociationlms.co.ke' },
            { title: 'MalariaWatch Kenya', description: 'A web platform focused on malaria in Kenya.', tags: ['Health', 'Web app'], image: '', repoUrl: '', demoUrl: 'https://malariawatch.vercel.app/' },
            { title: "Braidy's Website", description: 'A live website project. Open it to see the full build.', tags: ['Website', 'Vercel'], image: '', repoUrl: '', demoUrl: 'https://braidywebsite.vercel.app/' },
            { title: "Braidy's SMS", description: 'A live web application. Open it to explore the project.', tags: ['Web app', 'Vercel'], image: '', repoUrl: '', demoUrl: 'https://braidys-sms.vercel.app/' },
            { title: 'Prints of Africa', description: 'An online and Nairobi-based fashion store for modest, elegant ready-to-wear outfits, with a size calculator, WhatsApp and M-Pesa ordering and delivery across Kenya.', tags: ['E-commerce', 'Fashion'], image: '', repoUrl: '', demoUrl: 'https://printsofafrica.vercel.app/' },
            { title: 'SafiGroom OS', description: 'A live web application. Open it to explore the project.', tags: ['Web app', 'Vercel'], image: '', repoUrl: '', demoUrl: 'https://safi-groom-os.vercel.app/' },
            { title: 'AmaniCode Solutions', description: 'Company website for AmaniCode, which builds software and digital platforms for African healthcare, education, agriculture, fintech and public services.', tags: ['Company website', 'Software'], image: '', repoUrl: '', demoUrl: 'https://amanicodesolutions.vercel.app/' },
        ],
    },
    experience: {
        navLabel: 'Experience',
        heading: 'Work experience',
        jobs: [
            {
                role: 'Software Engineer',
                company: 'Company Name',
                period: '2023 - Present',
                location: 'Remote',
                points: ['Built and shipped features used by thousands of users.', 'Improved performance and reliability through testing and monitoring.'],
            },
            {
                role: 'IT Support Specialist',
                company: 'Company Name',
                period: '2021 - 2023',
                location: 'On-site',
                points: ['Managed networks, devices and user accounts for the organisation.', 'Resolved technical incidents quickly and documented fixes.'],
            },
        ],
    },
    credentials: {
        navLabel: '',
        heading: 'Education & certifications',
        records: [
            { title: 'Bachelor of Science in Computer Science', issuer: 'University Name', year: '2021', link: '' },
            { title: 'Cloud or networking certification', issuer: 'Issuing organisation', year: '2024', link: '' },
        ],
    },
};

export const CORE_NAMES: Record<string, string> = {
    hero: 'Hero & stats',
    services: 'Services',
    about: 'About',
    contact: 'Contact call-to-action',
    partners: 'Partners banner',
    projects: 'Projects',
    experience: 'Experience',
    credentials: 'Education & certifications',
};

export function fill(c: Content): Full {
    const merged = { ...EXTRA, ...c } as Full;
    const placeholders = ['Project One', 'Project Two', 'Project Three'];
    const entries = merged.projects?.entries ?? [];
    if (entries.length > 0 && entries.every((e) => placeholders.includes(e.title))) {
        merged.projects = { ...merged.projects, entries: EXTRA.projects.entries, intro: EXTRA.projects.intro };
    }
    return merged;
}
