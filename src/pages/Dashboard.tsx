import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Stethoscope, Shield, Users, Clock, AlertTriangle, CheckCircle, Loader2, Pill, User, FileText, Heart, LogOut, ClipboardList } from "lucide-react";
import { triageApi, prescriptionsApi } from "@/lib/api";
import { TriageResult, Prescription } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

const getUrgencyConfig = (level: number) => {
  switch (level) {
    case 1: return { color: "bg-emergency text-emergency-foreground", tooltip: "EMERGENCY: Immediate life-saving intervention required." };
    case 2: return { color: "bg-high-urgency text-high-urgency-foreground", tooltip: "HIGH: Emergent condition; potential threat to life or limb." };
    case 3: return { color: "bg-medium-urgency text-medium-urgency-foreground", tooltip: "MEDIUM: Urgent condition; needs evaluation within 30-60 mins." };
    case 4: return { color: "bg-low-urgency text-low-urgency-foreground", tooltip: "LOW: Non-urgent; standard clinical queue." };
    default: return { color: "bg-normal text-normal-foreground", tooltip: "NORMAL: Routine assessment or follow-up." };
  }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPatient = user?.userType === "patient" || user?.role === "patient";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const [queue, setQueue] = useState<TriageResult[]>([]);
  const [myTriage, setMyTriage] = useState<TriageResult[]>([]);
  const [myPrescriptions, setMyPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    inQueue: 0,
    emergency: 0,
    avgWait: "18m",
    treatedToday: 47
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftStart] = useState(new Date());
  const [sessionTime, setSessionTime] = useState("00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const diff = Math.floor((now.getTime() - shiftStart.getTime()) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diff % 60).toString().padStart(2, '0');
      setSessionTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [shiftStart]);

  useEffect(() => {
    if (isPatient) {
      const fetchPatientData = async () => {
        try {
          // Fetch patient's triage results (would need patient ID linking)
          // For now, we'll show a message
          setIsLoading(false);
        } catch (error) {
          console.error("Failed to fetch patient data:", error);
          setIsLoading(false);
        }
      };
      fetchPatientData();
    } else {
      const fetchQueue = async () => {
        try {
          const response = await triageApi.getAll();
          const sortedItems = [...response.items].sort((a, b) => a.urgencyLevel - b.urgencyLevel);
          setQueue(sortedItems);

          setStats(prev => ({
            ...prev,
            inQueue: response.total,
            emergency: response.items.filter(i => i.urgencyLevel === 1).length
          }));
        } catch (error: any) {
          console.error("Failed to fetch triage queue:", error);
          if (error.status === 401 || error.status === 403) {
            handleLogout();
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchQueue();
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    }
  }, [isPatient]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <header className="glass sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer" onClick={() => navigate("/dashboard")}>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow">
                <Activity className="h-6 w-6 text-primary animate-pulse-subtle" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {isPatient ? "CarePortal" : "Med tech"}
              </span>
            </div>

            {!isPatient && (
              <div className="hidden xl:flex items-center gap-4 pl-6 border-l border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Clinical Time</span>
                  <span className="text-sm font-mono font-bold text-foreground tabular-nums">{format(currentTime, "HH:mm:ss")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Shift</span>
                  <span className="text-sm font-mono font-bold text-primary tabular-nums">{sessionTime}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-full border border-success/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-bold text-success uppercase tracking-tighter">AI Core Ready</span>
                </div>
              </div>
            )}
          </div>
          <nav className="flex items-center gap-2">
            {isPatient ? (
              <>
                <Link to="/triage">
                  <Button variant="outline" size="sm" className="gap-2 btn-premium rounded-full">
                    <Heart className="h-4 w-4" />
                    Request Triage
                  </Button>
                </Link>
                <Link to="/my-prescriptions">
                  <Button variant="default" size="sm" className="gap-2 btn-premium rounded-full shadow-glow">
                    <FileText className="h-4 w-4" />
                    My Records
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="hidden lg:flex items-center gap-1 mr-4">
                  <Link to="/triage">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-primary/5">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Triage
                    </Button>
                  </Link>
                  <Link to="/prescriptions">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-primary/5">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Prescriptions
                    </Button>
                  </Link>
                  <Link to="/drug-verification">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-primary/5">
                      <Shield className="h-4 w-4 text-primary" />
                      Verification
                    </Button>
                  </Link>
                </div>
                <Link to="/pharmacy">
                  <Button variant="default" size="sm" className="gap-2 btn-premium bg-primary hover:bg-primary/90 rounded-full shadow-glow">
                    <Pill className="h-4 w-4" />
                    Pharmacy Hub
                  </Button>
                </Link>
              </>
            )}
            <div className="ml-4 pl-4 border-l border-border/50 flex items-center gap-4">
              <ThemeToggle />
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground/80 leading-none">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">{user?.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isPatient ? (
          <div className="space-y-8">
            <div className="text-center py-8">
              <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
              <p className="text-muted-foreground">Manage your health records and requests</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Request Triage Assessment
                  </CardTitle>
                  <CardDescription>Get an AI-powered triage assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/triage">
                    <Button className="w-full">Start Triage Assessment</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Prescriptions
                  </CardTitle>
                  <CardDescription>View your prescription history</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/my-prescriptions">
                    <Button className="w-full" variant="outline">View Prescriptions</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="stat-card group">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">In Queue</p>
                    <p className="text-4xl font-bold tracking-tight">{stats.inQueue}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 w-fit px-2 py-0.5 rounded-full">
                  <Activity className="h-3 w-3" />
                  <span>+2 in last hour</span>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Emergency</p>
                    <p className="text-4xl font-bold tracking-tight text-emergency">{stats.emergency}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emergency/10 flex items-center justify-center text-emergency group-hover:bg-emergency group-hover:text-white transition-colors duration-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-medium text-emergency bg-emergency/10 w-fit px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Immediate Action Required</span>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg Wait</p>
                    <p className="text-4xl font-bold tracking-tight">{stats.avgWait}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-500">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span>Optimal range</span>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Treated Today</p>
                    <p className="text-4xl font-bold tracking-tight text-success">{stats.treatedToday}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-colors duration-500">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 w-fit px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  <span>Daily Target Reached</span>
                </div>
              </div>
            </div>
            <div className="medical-card overflow-hidden">
              <div className="px-6 py-6 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Patient Triage Queue</h3>
                  <p className="text-xs text-muted-foreground">Highest priority items needing immediate care</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-md px-2 py-1 text-[10px] uppercase tracking-tighter pulse-subtle">
                    Live Updates Active
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing patient data...</p>
                  </div>
                ) : queue.length === 0 ? (
                  <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success/30" />
                    <h4 className="text-lg font-bold text-foreground/50">Queue is Clear</h4>
                    <p className="text-sm text-muted-foreground">All patients have been triaged and attended to.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border bg-card transition-all duration-300 hover:shadow-premium-lg hover:border-primary/30 hover:bg-primary/[0.01]"
                      >
                        <div className="flex items-start gap-5">
                          <div className={`mt-1 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${getUrgencyConfig(item.urgencyLevel).color}`}>
                            <User className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-base">{item.patientName}</h4>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className={`${getUrgencyConfig(item.urgencyLevel).color} urgency-badge`}>
                                      {item.category}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[10px] font-bold">{getUrgencyConfig(item.urgencyLevel).tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span className={new Date(item.createdAt).getTime() < Date.now() - 3600000 ? "text-emergency font-bold" : ""}>
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span className="font-medium text-foreground/70">{item.symptoms}</span>
                            </p>

                            {/* Vitals Preview Chips */}
                            {item.vitals && (
                              <div className="flex gap-2 mt-2">
                                {item.vitals.temperature && (
                                  <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold px-1.5 py-0 h-5 border-none">
                                    {item.vitals.temperature}°C
                                  </Badge>
                                )}
                                {item.vitals.heartRate && (
                                  <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold px-1.5 py-0 h-5 border-none">
                                    {item.vitals.heartRate} BPM
                                  </Badge>
                                )}
                                {item.vitals.bloodPressure && (
                                  <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold px-1.5 py-0 h-5 border-none">
                                    {item.vitals.bloodPressure}
                                  </Badge>
                                )}
                                {item.vitals.oxygenSaturation && (
                                  <Badge variant="secondary" className={`text-[10px] font-bold px-1.5 py-0 h-5 border-none ${item.vitals.oxygenSaturation < 94 ? "bg-emergency/20 text-emergency" : "bg-muted/50 text-muted-foreground"}`}>
                                    {item.vitals.oxygenSaturation}% O2
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="mt-3 hidden group-hover:block animate-fade-in">
                              <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">AI Clinical Insight</p>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                  "{item.explanation.split('⚠️')[0].trim()}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex items-center gap-2 self-end md:self-center">
                          <Link to={`/create-prescription?triageId=${item.id}`}>
                            <Button className="btn-premium rounded-full px-6 shadow-glow transition-all hover:scale-105">
                              Attend Patient
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
            <div className="mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Aligned with HIPAA & Indian DPDP Act Principles</span>
              </div>
              <p className="max-w-md text-center md:text-right">
                ⚠️ MEDICAL DISCLAIMER: This is an AI-driven decision support system. All results must be verified by a licensed medical professional.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;