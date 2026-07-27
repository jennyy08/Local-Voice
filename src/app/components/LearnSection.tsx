import type { Dispatch, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";
import { LEARN_SECTIONS } from "../../data/learnSections"; 
 
type LearnSectionProps = {
  learnTab: string;
  setLearnTab: React.Dispatch<React.SetStateAction<string>>;
  activeLearn: typeof LEARN_SECTIONS[number];
};

export default function LearnSection({
    learnTab,
    setLearnTab,
    activeLearn,
}: LearnSectionProps) {
    return (
        <section id="learn" className="bg-primary py-20 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
            <div className="mb-10">
                <span className="font-mono text-[10px] text-accent/80 tracking-[0.22em] uppercase">Civic Literacy</span>
                <h2 className="font-display text-4xl sm:text-5xl text-primary-foreground mt-2 tracking-tight">
                Understand Your City
                </h2>
                <p className="text-primary-foreground/50 mt-3 max-w-xl text-sm leading-relaxed">
                Municipal government is closer to your daily life than any other level. Here is how it works.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-0">
                {LEARN_SECTIONS.map((s) => (
                <button
                    key={s.id}
                    onClick={() => setLearnTab(s.id)}
                    className={`px-4 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors rounded-t-sm -mb-px border-b-2 ${
                    learnTab === s.id
                        ? "text-accent border-accent bg-white/5"
                        : "text-primary-foreground/40 border-transparent hover:text-primary-foreground/70"
                    }`}
                >
                    {s.label}
                </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                <div className="md:col-span-2 space-y-5">
                <h3 className="font-display text-3xl text-primary-foreground tracking-tight">
                    {activeLearn.heading}
                </h3>
                {activeLearn.body.map((para, i) => (
                    <p key={i} className="text-primary-foreground/60 leading-relaxed text-sm sm:text-base">
                    {para}
                    </p>
                ))}
                </div>

                <div className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-sm p-6">
                    <div className="font-display text-5xl text-accent mb-2">{activeLearn.stat}</div>
                    <div className="font-mono text-[10px] text-primary-foreground/40 tracking-wide leading-relaxed uppercase">
                    {activeLearn.statLabel}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-sm p-5">
                    <p className="text-[10px] font-mono text-accent tracking-[0.2em] uppercase mb-4">Take Action</p>
                    <div className="space-y-3">
                    {[
                        "Find your ward & councillor at ottawa.ca",
                        "Attend an upcoming public consultation",
                        "File a service request via 311",
                        "Register to delegate at a committee meeting",
                    ].map((action) => (
                        <div key={action} className="flex items-start gap-2.5 text-sm text-primary-foreground/60">
                        <ChevronRight size={12} className="text-accent flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{action}</span>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
    )
}