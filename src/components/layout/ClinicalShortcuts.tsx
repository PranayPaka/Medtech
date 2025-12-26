import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Stethoscope, Shield, ClipboardList, Zap, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ClinicalShortcuts = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    // Only show for medical staff
    const isMedicalStaff = isAuthenticated && (user?.role === "doctor" || user?.role === "staff");

    if (!isMedicalStaff) return null;

    const shortcuts = [
        { label: "New Triage", icon: Stethoscope, path: "/triage", color: "text-primary" },
        { label: "Clinical Records", icon: ClipboardList, path: "/prescriptions", color: "text-success" },
        { label: "Drug Verification", icon: Shield, path: "/drug-verification", color: "text-foreground" },
    ];

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
            {isOpen && (
                <div className="flex flex-col gap-2 animate-in slide-in-from-left-5 duration-300">
                    {shortcuts.map((shortcut) => (
                        <button
                            key={shortcut.path}
                            onClick={() => {
                                navigate(shortcut.path);
                                setIsOpen(false);
                            }}
                            className="glass flex items-center gap-3 px-4 py-3 rounded-2xl border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-premium-lg"
                        >
                            <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors`}>
                                <shortcut.icon className={`h-4 w-4 ${shortcut.color}`} />
                            </div>
                            <span className="text-sm font-bold text-foreground pr-2 font-heading">{shortcut.label}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            )}

            <Button
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
                className={`h-16 w-16 rounded-full shadow-premium-lg ${isOpen ? 'bg-foreground' : 'bg-primary'} hover:scale-110 active:scale-95 transition-all flex items-center justify-center p-0 border-4 border-background`}
            >
                {isOpen ? (
                    <X className="h-7 w-7 text-background animate-in fade-in zoom-in duration-300" />
                ) : (
                    <Zap className="h-7 w-7 text-white animate-pulse-subtle" />
                )}
            </Button>
        </div>
    );
};

export default ClinicalShortcuts;
