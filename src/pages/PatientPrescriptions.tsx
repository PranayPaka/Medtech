import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Calendar, User, ClipboardList, Info, Loader2, Link as LinkIcon, LogOut } from "lucide-react";
import { prescriptionsApi } from "@/lib/api";
import { Prescription } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PatientPrescriptions = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        const fetchPrescriptions = async () => {
            if (!user) return;
            try {
                // In a real app, we'd use the user's patient ID. 
                // For this demo, we'll try to fetch by a fixed patient ID or from the user's meta
                // but for now let's assume we can fetch all and filter or use a demo ID
                const data = await prescriptionsApi.getByPatient(user.id);
                setPrescriptions(data);
            } catch (error) {
                console.error("Failed to fetch prescriptions:", error);
                toast({
                    title: "Error",
                    description: "Could not load your prescriptions.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrescriptions();
    }, [user, toast]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">My Digital Prescriptions</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                            Patient Portal
                        </Badge>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{user?.name}</span>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Retrieving your medical records...</p>
                    </div>
                ) : prescriptions.length === 0 ? (
                    <Card className="text-center py-16 bg-muted/20 border-dashed">
                        <CardContent>
                            <div className="p-4 bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Pill className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold">No prescriptions found</h3>
                            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                                Once your doctor issues a digital prescription, it will appear here for you to show at any pharmacy.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <Info className="h-4 w-4 text-primary shrink-0" />
                            <p>Present the <strong>Verification Hash</strong> or the QR code to your pharmacist to receive your medication.</p>
                        </div>

                        {prescriptions.map((px) => (
                            <Card key={px.id} className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-primary">
                                <CardHeader className="bg-muted/30">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                Prescription for {px.diagnosis}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1 font-medium text-foreground">
                                                    <User className="h-3 w-3" /> Dr. {px.doctorName || "Unknown"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> {new Date(px.createdAt).toLocaleDateString()}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Verification Hash</div>
                                            <Badge variant="default" className="text-md font-mono py-1 px-3 bg-primary text-primary-foreground">
                                                {px.verificationHash}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                                <Pill className="h-4 w-4" /> Meds & Dosage
                                            </h4>
                                            <div className="grid gap-3">
                                                {px.medications.map((med, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border group hover:bg-white hover:shadow-sm transition-all">
                                                        <div>
                                                            <p className="font-bold text-primary">{med.name}</p>
                                                            <p className="text-sm">{med.dosage} • {med.frequency}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Duration: {med.duration}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold text-muted-foreground">Instructions</Badge>
                                                            <p className="text-xs italic text-muted-foreground mt-1">{med.notes || "None"}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                                <Info className="h-4 w-4" /> Doctor's Instructions
                                            </h4>
                                            <p className="text-sm leading-relaxed">{px.instructions}</p>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Link to={`/pharmacy?hash=${px.verificationHash}`}>
                                                <Button variant="outline" size="sm" className="gap-2 text-primary hover:text-primary hover:bg-primary/5">
                                                    <LinkIcon className="h-4 w-4" /> Open in Pharmacy View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientPrescriptions;
