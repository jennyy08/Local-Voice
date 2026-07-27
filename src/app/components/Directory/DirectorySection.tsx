
import { Search, Phone } from "lucide-react";
import ContactCard from "./ContactCard";

type Contact = {
    name: string;
    role: string;
    phone: string;
    email: string;
};

type DirectoryProps = {
    contactSearch: string;
    setContactSearch: (v: string) => void;
    visibleContacts: Contact[];
};

export default function Directory({ contactSearch, setContactSearch, visibleContacts }: DirectoryProps) {
    return (
        <section id="directory" className="bg-secondary py-20 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-5">
                <div>
                <span className="font-mono text-[10px] text-accent tracking-[0.22em] uppercase">
                    Municipal Contacts
                </span>
                <h2 className="font-display text-4xl sm:text-5xl text-foreground mt-2 tracking-tight">
                    Who to Call
                </h2>
                </div>
                <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-60 placeholder:text-muted-foreground"
                />
                </div>
            </div>

            {visibleContacts.length === 0 ? (
                <div className="mb-10 rounded-sm border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
                No contacts match "{contactSearch}" yet. Try a broader search term.
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {visibleContacts.map((c) => (
                    <ContactCard key={c.name} contact={c} />
                ))}
                </div>
            )}

            {/* 311 CTA banner */}
            <div className="bg-primary rounded-sm p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                <h3 className="font-display text-2xl text-primary-foreground tracking-tight">
                    Not sure who to contact?
                </h3>
                <p className="text-primary-foreground/50 text-sm mt-1 max-w-md leading-relaxed">
                    Ottawa 311 handles all non-emergency city service requests and will route your issue to the right department.
                </p>
                </div>
                <a
                href="tel:311"
                className="bg-accent text-primary font-semibold px-6 py-3.5 rounded-sm flex items-center gap-2 hover:bg-accent/90 transition-colors text-sm flex-shrink-0 whitespace-nowrap"
                >
                <Phone size={15} />
                Call 3-1-1
                </a>
            </div>
            </div>
        </section>
    )
}