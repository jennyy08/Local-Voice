import { Phone, Mail, User, Headphones, Car, Trash2, HeartPulse, Scale, type LucideIcon } from "lucide-react";

type Contact = {
  name: string;
  role: string;
  phone: string;
  email: string;
};

// Map contact names to relevant icons
const CONTACT_ICONS: Record<string, LucideIcon> = {
  "Coun. Ariel Troster": User,
  "City of Ottawa 311": Headphones,
  "Roads & Traffic Management": Car,
  "Waste Management Services": Trash2,
  "Ottawa Public Health": HeartPulse,
  "Ottawa By-law Services": Scale,
};

export default function ContactCard({ contact }: { contact: Contact }) {
  const Icon = CONTACT_ICONS[contact.name] || User;

  return (
    <div
      className="bg-card border border-border rounded-sm p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground text-sm leading-tight group-hover:text-accent transition-colors">
            {contact.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{contact.role}</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <a
          href={`tel:${contact.phone}`}
          className="flex items-center gap-2 text-xs text-foreground hover:text-accent transition-colors"
        >
          <Phone size={11} className="text-muted-foreground flex-shrink-0" />
          {contact.phone}
        </a>
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-2 text-xs text-foreground hover:text-accent transition-colors truncate"
        >
          <Mail size={11} className="text-muted-foreground flex-shrink-0" />
          <span className="truncate">{contact.email}</span>
        </a>
      </div>
    </div>
  );
}
