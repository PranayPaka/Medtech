import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, Search, Shield, CheckCircle, AlertTriangle, Pill, User, ClipboardList, Loader2 } from "lucide-react";
import { prescriptionsApi } from "@/lib/api";
import { Prescription } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/layout/ThemeToggle";


const PharmacyDashboard = () => {
    const [searchParams] = useSearchParams();
    const hashParam = searchParams.get("hash");

    const [searchHash, setSearchHash] = useState(hashParam || "");
    const [isSearching, setIsSearching] = useState(false);
    const [prescription, setPrescription] = useState<Prescription | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (hashParam) {
            verifyHash(hashParam);
        }
    }, [hashParam]);

    const verifyHash = async (hash: string) => {
        setIsSearching(true);
        try {
            const result = await prescriptionsApi.verify(hash.trim().toUpperCase());
            setPrescription(result);
            toast({
                title: "Prescription Verified",
                description: `Patient: ${result.patientName}`,
            });
        } catch (error) {
            console.error("Verification failed:", error);
            setPrescription(null);
            toast({
                title: "Verification Failed",
                description: "Invalid or expired prescription hash.",
                variant: "destructive",
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchHash.trim()) return;
        verifyHash(searchHash);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
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
                            <Pill className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">Pharmacy Portal</span>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20">
                        Secure Verification Active
                    </Badge>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid md:grid-cols-12 gap-8">
                    {/* Search Section */}
                    <div className="md:col-span-4 space-y-6">
                        <Card className="border-primary/20 shadow-lg">
                            <CardHeader>
                                <CardTitle>Verification</CardTitle>
                                <CardDescription>Enter the 12-char prescription hash</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSearch} className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="e.g. A1B2-C3D4-E5F6"
                                            className="pl-10 uppercase font-mono"
                                            value={searchHash}
                                            onChange={(e) => setSearchHash(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isSearching}>
                                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Hash"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="pt-6 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <Shield className="h-4 w-4 mt-0.5 text-primary" />
                                    <p>Prescriptions are cryptographically signed and hash-verified against the hospital database.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="md:col-span-8">
                        {!prescription ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
                                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                                <h3 className="text-lg font-medium text-muted-foreground">Waiting for Prescription Hash</h3>
                                <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
                                    Scan the QR code or enter the verification hash provided on the patient's digital or paper slip.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-success/50 bg-success/5">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-success rounded-full">
                                                <CheckCircle className="h-6 w-6 text-success-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-success">Authentic Prescription</CardTitle>
                                                <CardDescription className="text-success/80">Hash: {prescription.verificationHash}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-success text-success-foreground hover:bg-success">Verified</Badge>
                                    </CardHeader>
                                </Card>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
                                                <User className="h-4 w-4" />
                                                Patient Details
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">{prescription.patientName}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Diagnosis: {prescription.diagnosis}</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-bold">
                                                <Activity className="h-4 w-4" />
                                                Prescribing Doctor
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">Dr. {prescription.doctorName}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Date: {new Date(prescription.createdAt).toLocaleDateString()}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Pill className="h-5 w-5 text-primary" />
                                            Medications
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="divide-y">
                                            {prescription.medications.map((med, idx) => (
                                                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-lg font-bold text-primary">{med.name}</p>
                                                            <p className="text-sm font-medium">{med.dosage} • {med.frequency}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Duration: {med.duration}</p>
                                                            {med.notes && <p className="text-xs italic text-muted-foreground mt-2">Notes: {med.notes}</p>}
                                                        </div>
                                                        <Link to={`/drug-verification?name=${encodeURIComponent(med.name)}`}>
                                                            <Button variant="outline" size="sm" className="gap-2">
                                                                <Shield className="h-4 w-4" />
                                                                Detect Counterfeit
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-amber-50 border-amber-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                                            <AlertTriangle className="h-4 w-4" />
                                            Pharmacist Instructions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                            {prescription.instructions}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PharmacyDashboard;
