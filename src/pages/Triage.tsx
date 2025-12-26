import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTriage } from "@/hooks/useTriage";
import {
  Activity,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  LogOut,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useToast } from "@/components/ui/use-toast";

const Triage = () => {
  const { isLoading, result, submitTriage, clearResult, setResult } = useTriage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    gender: "male" as const,
    symptoms: "",
    duration: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTriage({
      patientName: formData.patientName,
      age: parseInt(formData.age),
      gender: formData.gender,
      symptoms: formData.symptoms,
      duration: formData.duration,
      vitals: {
        bloodPressure: formData.bloodPressure || undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
      },
    });
  };

  const handleForceAI = async () => {
    setIsAiLoading(true);
    try {
      await submitTriage({
        patientName: formData.patientName,
        age: parseInt(formData.age),
        gender: formData.gender,
        symptoms: formData.symptoms,
        duration: formData.duration,
        vitals: {
          bloodPressure: formData.bloodPressure || undefined,
          heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
          oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
        },
        force_ai: true
      });

      toast({
        title: "AI Analysis Complete",
        description: "Triage updated with AI insights",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI opinion",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 1: return "bg-emergency text-emergency-foreground";
      case 2: return "bg-high-urgency text-high-urgency-foreground";
      case 3: return "bg-medium-urgency text-medium-urgency-foreground";
      case 4: return "bg-low-urgency text-low-urgency-foreground";
      default: return "bg-normal text-normal-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Patient Triage</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Medical Staff</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 hover:text-destructive gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="medical-card">
              <div className="px-8 py-6 border-b bg-muted/30">
                <h3 className="text-xl font-bold">New Assessment</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">Clinical Intake Form</p>
              </div>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Patient Full Name</Label>
                      <Input
                        id="name"
                        className="bg-muted/30 border-border/50 focus:border-primary transition-all rounded-xl"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        className="bg-muted/30 border-border/50 focus:border-primary transition-all rounded-xl"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Gender</Label>
                      <Select value={formData.gender} onValueChange={(v: any) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger className="bg-muted/30 border-border/50 focus:border-primary transition-all rounded-xl font-medium capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Symptom Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 48 hours"
                        className="bg-muted/30 border-border/50 focus:border-primary transition-all rounded-xl"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symptoms" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Detailed Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Please describe symptoms, severity, and any known triggers..."
                      className="bg-muted/30 border-border/50 focus:border-primary transition-all rounded-xl min-h-[120px] resize-none"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bp" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">BP (mmHg)</Label>
                      <Input id="bp" placeholder="120/80" className="bg-muted/20 border-border/30 rounded-lg h-9 text-sm" value={formData.bloodPressure} onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hr" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Heart Rate</Label>
                      <Input id="hr" type="number" placeholder="72" className="bg-muted/20 border-border/30 rounded-lg h-9 text-sm" value={formData.heartRate} onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Temp (°C)</Label>
                      <Input id="temp" type="number" step="0.1" placeholder="37.0" className="bg-muted/20 border-border/30 rounded-lg h-9 text-sm" value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="o2" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">O₂ Sat %</Label>
                      <Input id="o2" type="number" placeholder="98" className="bg-muted/20 border-border/30 rounded-lg h-9 text-sm" value={formData.oxygenSaturation} onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 btn-premium bg-primary hover:bg-primary/90 text-lg font-bold rounded-2xl shadow-glow transition-all active:scale-[0.98]" disabled={isLoading || isAiLoading}>
                    {isLoading ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Analyzing Biological Context...</> : "Generate Clinical Assessment"}
                  </Button>
                </form>
              </CardContent>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="medical-card sticky top-24 overflow-hidden h-fit">
              <div className="px-6 py-6 border-b bg-muted/20">
                <h3 className="text-lg font-bold">Assessment Result</h3>
              </div>
              <CardContent className="p-6">
                {!result ? (
                  <div className="text-center py-20 text-muted-foreground animate-pulse">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                      <Activity className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold tracking-tight">Ready for intake analysis</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Patient</p>
                        <p className="font-bold text-lg">{result.patientName}</p>
                      </div>
                      <Badge className={`${getUrgencyColor(result.urgencyLevel)} urgency-badge py-1.5 px-4 h-fit`}>
                        {result.category}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">AI Clinical Rationale</p>
                      <div className="p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 leading-relaxed text-sm italic font-medium">
                        {result.explanation}
                      </div>
                    </div>

                    {result.recommendedAction && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-success ml-1">Next Protocol Steps</p>
                        <div className="p-5 rounded-2xl border border-success/20 bg-success/[0.03] text-sm font-semibold text-success">
                          {result.recommendedAction}
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-dashed flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs px-2">
                        <span className="text-muted-foreground font-medium uppercase tracking-tighter">Certainty Score:</span>
                        <span className="font-bold text-primary">{(result.confidence * 100).toFixed(0)}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-full flex justify-center py-2 rounded-xl text-[10px] uppercase tracking-widest bg-muted/20 border-border/50">
                          Source: {result.source === 'ai' ? 'Gemini Clinical AI' : (result.source === 'ml' ? 'Local ML Core' : 'Base Rule Engine')}
                        </Badge>
                      </div>

                      {result.source !== 'ai' && (
                        <Button
                          variant="outline"
                          onClick={handleForceAI}
                          disabled={isAiLoading}
                          className="w-full h-11 gap-2 border-primary text-primary hover:bg-primary/5 rounded-xl font-bold transition-all shadow-sm"
                        >
                          {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Consult Gemini AI
                        </Button>
                      )}
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button
                        className="w-full h-12 btn-premium bg-primary text-white rounded-xl font-bold"
                        onClick={() => navigate("/dashboard")}
                      >
                        View in Queue
                      </Button>
                      <Button variant="ghost" className="w-full rounded-xl text-muted-foreground hover:text-foreground" onClick={clearResult}>
                        New Assessment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Triage;