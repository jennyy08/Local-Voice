import { NAV_LINKS } from "../../data/constants";   
import { MapPin, ExternalLink } from "lucide-react";
import AdminSignIn from "./AdminSignIn.tsx";

type FooterProps = {
    scrollTo: (id: string) => void;
    isAdmin: boolean;
};

export default function Footer({ scrollTo, isAdmin }: FooterProps) {    
    return (
        <footer className="bg-primary border-t border-white/8 py-14 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center">
                        <MapPin size={13} className="text-primary" />
                    </div>
                    <span className="font-display text-lg text-primary-foreground">Local Voice</span>
                    </div>
                    <p className="text-primary-foreground/40 text-sm leading-relaxed max-w-xs">
                    A civic-tech pilot enabling Ottawa residents to report local issues, track city responses, and increase informed participation in municipal government.
                    </p>
                    <a
                    href="https://glocalfoundation.ca"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-foreground/30 text-xs font-mono mt-4 leading-relaxed inline-block hover:text-primary-foreground/60 transition-colors"
                    >
                    Supported by GLOCAL Foundation&apos;s CANConnect Micro-grant program (Canada Service Corps).
                    </a>
                </div>

                <div>
                    <p className="font-mono text-[10px] text-accent/70 tracking-[0.2em] uppercase mb-4">Navigate</p>
                    <div className="space-y-2.5">
                    {NAV_LINKS.map((l) => (
                        <button
                        key={l.id}
                        onClick={() => scrollTo(l.id)}
                        className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/80 transition-colors"
                        >
                        {l.label}
                        </button>
                    ))}
                    </div>
                </div>

                <div>
                    <p className="font-mono text-[10px] text-accent/70 tracking-[0.2em] uppercase mb-4">Resources</p>
                    <div className="space-y-2.5">
                    {[
                        { label: "ottawa.ca / 311", href: "https://ottawa.ca/en/3-1-1" },
                        { label: "Ottawa Ward Finder", href: "https://ottawa.ca/en/city-hall/council-committees-and-boards/how-city-government-works/find-your-ward-and-councillor" },
                        { label: "City Council Calendar", href: "https://ottawa.ca/en/city-hall/council-committees-and-boards/agendas-minutes-and-videos/meetings-agendas-and-minutes" },
                        { label: "Budget Consultations", href: "https://ottawa.ca/en/city-hall/council-committees-and-boards/agendas-minutes-and-videos/meetings-agendas-and-minutes" },
                        { label: "Public Delegations", href: "https://ottawa.ca/en/city-hall/city-manager-administration-and-policies/policies/administrative-policies/delegation-powers-policy" },
                    ].map((resource) => (
                        <a
                        key={resource.label}
                        href={resource.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary-foreground/40 hover:text-primary-foreground/80 transition-colors"
                        >
                        {resource.label}
                        <ExternalLink size={9} className="flex-shrink-0" />
                        </a>
                    ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <p className="font-mono text-[10px] text-primary-foreground/25 tracking-wide">
                    &copy; 2026 Local Voice &middot; Ottawa, Ontario &middot; CANConnect Micro-grant Recipient
                </p>
                <p className="font-mono text-[10px] text-primary-foreground/25 tracking-wide">
                    GLOCAL Foundation &middot; Canada Service Corps
                </p>
                <AdminSignIn isAdmin={isAdmin} />
            </div>
        </footer>
    ) 
}