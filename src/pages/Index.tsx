import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow">
              <Activity className="h-6 w-6 text-primary animate-pulse-subtle" />
            </div>
            <span className="text-xl font-bold tracking-tight">Med tech</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors hidden sm:block">
              Medical Login
            </Link>
            <Link to="/login">
              <Button className="btn-premium rounded-full px-6 shadow-glow font-bold">Launch System</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 overflow-hidden">
        <section className="relative pt-24 pb-20 px-4">
          {/* Background Mesh Gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-10 pointer-events-none -z-10 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] blur-[100px]" />

          <div className="container mx-auto max-w-5xl text-center">
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 text-primary bg-primary/5 font-bold tracking-wider uppercase text-[10px] mb-8 animate-fade-in shadow-sm">
              Advanced Clinical Decision Support v2.0
            </Badge>

            <div className="animate-float">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-balance leading-[1.1]">
                The Future of <span className="text-primary italic">Clinical</span> Intelligence
              </h1>
              <p className="text-xl text-muted-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                Empowering healthcare professionals with AI-driven triage, intelligent drug verification, and high-fidelity record management.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Link to="/login">
                <Button size="lg" className="h-14 px-10 rounded-full btn-premium shadow-glow font-bold text-lg gap-3">
                  Access Portal
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-10 rounded-full border-border/50 hover:bg-muted font-bold text-lg">
                View Governance
              </Button>
            </div>

            {/* Features Glass Grid */}
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="medical-card p-8 group">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">AI Patient Triage</h3>
                <p className="text-muted-foreground/80 leading-relaxed text-sm">
                  Real-time urgency assessment powered by Gemini AI, analyzing vitals and symptoms for precise prioritization.
                </p>
              </div>

              <div className="medical-card p-8 group">
                <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center text-success mb-6 group-hover:bg-success group-hover:text-white transition-all duration-500 shadow-sm">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">Recommendation Hub</h3>
                <p className="text-muted-foreground/80 leading-relaxed text-sm">
                  Smart medication suggestions with cross-referencing for allergies and contraindications.
                </p>
              </div>

              <div className="medical-card p-8 group">
                <div className="h-14 w-14 rounded-2xl bg-foreground/10 flex items-center justify-center text-foreground mb-6 group-hover:bg-foreground group-hover:text-background transition-all duration-500 shadow-sm">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">Institutional Trust</h3>
                <p className="text-muted-foreground/80 leading-relaxed text-sm">
                  Blockchain-verified drug authenticity and HIPPA-aligned data protection for absolute integrity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Disclaimer */}
        <div className="container mx-auto px-4 pb-12">
          <div className="glass max-w-3xl mx-auto p-6 rounded-2xl border-primary/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left transition-all hover:border-primary/30">
            <div className="h-12 w-12 rounded-full bg-emergency/10 flex items-center justify-center text-emergency shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Medical Compliance Notice</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                MedTech Pro is a decision support system for authorized health institutions. AI outputs are supplementary suggestions for licensed medical professionals. Final authority rests with the treating physician.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border/50 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
          &copy; 2025 MedTech Global Systems &bull; Built for Clinical Excellence
        </p>
      </footer>
    </div>
  );
};

export default Index;
