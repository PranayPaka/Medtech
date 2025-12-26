
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Pill, Calendar, User, ClipboardList,
    Search, Loader2, Copy, CheckCircle2, ExternalLink, Trash2
} from "lucide-react";
import { prescriptionsApi } from "@/lib/api";
import { Prescription } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const ViewPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const data = await prescriptionsApi.getAll();
                setPrescriptions(data);
            } catch (error) {
                console.error("Failed to fetch prescriptions:", error);
                toast({
                    title: "Error",
                    description: "Could not load prescriptions.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrescriptions();
    }, [toast]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this prescription?")) return;

        try {
            await prescriptionsApi.delete(id);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
            toast({
                title: "Deleted",
                description: "Prescription has been removed.",
            });
        } catch (error: any) {
            console.error("Delete failed:", error);
            const errorMessage = error?.message || (error?.response?.data?.detail) || "Failed to delete prescription.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Verification hash copied to clipboard.",
        });
    };

    const filteredPrescriptions = prescriptions.filter(px =>
        px.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        px.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        px.verificationHash?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Link to="/dashboard">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">All Prescriptions</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by patient, diagnosis, or hash..."
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading medical records...</p>
                    </div>
                ) : filteredPrescriptions.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <p className="text-muted-foreground">No prescriptions found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredPrescriptions.map((px) => (
                            <Card key={px.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{px.patientName}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-3 w-3" /> {new Date(px.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono bg-muted py-1 px-3">
                                                {px.verificationHash}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(px.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Diagnosis</p>
                                            <p>{px.diagnosis}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Medications</p>
                                            <div className="flex flex-wrap gap-1">
                                                {px.medications.map((med: any, i: number) => (
                                                    <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                                                        {med.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex justify-end">
                                        <Link to={`/pharmacy?hash=${px.verificationHash}`}>
                                            <Button variant="ghost" size="sm" className="gap-2">
                                                <ExternalLink className="h-4 w-4" /> Pharmacy View
                                            </Button>
                                        </Link>
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

export default ViewPrescriptions;
