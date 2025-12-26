import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, User, Stethoscope } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"doctor" | "patient">("doctor");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: "Success",
        description: `Logged in as ${userType === "doctor" ? "healthcare provider" : "patient"}!`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to login. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/login-hero.png"
            alt="Futuristic Clinical Lab"
            className="w-full h-full object-cover scale-105 animate-float opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 via-primary/20 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer" onClick={() => navigate("/")}>
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-glow">
              <Activity className="h-7 w-7 text-white animate-pulse-subtle" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white font-heading">
              Med tech
            </span>
          </div>

          <div className="space-y-8 max-w-lg">
            <Badge className="bg-white/20 text-white backdrop-blur-md border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]">
              Next-Gen Clinical Suite
            </Badge>
            <h2 className="text-6xl font-bold text-white leading-tight tracking-tight">
              Precision Care <br />
              <span className="text-white/60">Powered by</span> Intelligence.
            </h2>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="glass p-6 rounded-3xl border-white/10 hover:border-white/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors pr-0.5">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Clinical AI</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">Advanced diagnostics and triage logic.</p>
              </div>
              <div className="glass p-6 rounded-3xl border-white/10 hover:border-white/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-success transition-colors">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Real-time Bio</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">Instant vital synchronization & analysis.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <span>Security</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Privacy</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Compliance</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[100%] h-[100%] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md animate-fade-in relative">
          <div className="lg:hidden flex justify-center mb-10 relative">
            <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-glow relative z-10 transition-transform active:scale-95">
              <Activity className="h-10 w-10 text-white animate-pulse-subtle" />
            </div>
          </div>

          <Card className="glass overflow-hidden transition-all duration-500 hover:shadow-premium-lg border-white/20 dark:border-white/5 rounded-[2.5rem]">
            <CardHeader className="text-center pt-12 pb-2">
              <CardTitle className="text-4xl font-black tracking-tight font-heading">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground mt-3 font-medium text-base px-10">
                Log in to your professional clinical environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-12">
              <div className="mt-6 text-center mb-10">
                <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20 px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest">
                  Secure Provider Access
                </Badge>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Username / Email</Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@medical.com"
                      className="h-14 bg-muted/30 border-border/40 focus:border-primary transition-all rounded-2xl pl-12 text-base font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Credentials</Label>
                    <span className="text-[10px] text-primary font-bold cursor-pointer hover:underline uppercase tracking-tighter">Forgot?</span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-14 bg-muted/30 border-border/40 focus:border-primary transition-all rounded-2xl text-base px-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-14 btn-premium bg-primary hover:bg-primary-hover shadow-glow rounded-2xl font-bold text-lg transition-all active:scale-[0.98] mt-4" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Continue to Portal"
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-8 border-t border-dashed flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm font-medium">
                  <span className="text-muted-foreground">No account? </span>
                  <Link to="/register" className="text-primary hover:text-primary/80 transition-colors font-bold">
                    Register
                  </Link>
                </div>
                <Link to="/" className="text-xs text-muted-foreground/60 hover:text-foreground transition-all flex items-center gap-2 group font-bold">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Exit Portal</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="h-4 w-4 rounded-full bg-primary" />
            <div className="h-4 w-4 rounded-full bg-success" />
            <div className="h-4 w-4 rounded-full bg-emergency" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
