import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, ClipboardList, Loader2, Pill, MessageSquare, Clock } from "lucide-react";
import { prescriptionsApi, triageApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Medication, TriageResult } from "@/types";
import { ThemeToggle } from "@/components/layout/ThemeToggle";


const CreatePrescription = () => {
    const [searchParams] = useSearchParams();
    const triageId = searchParams.get("triageId");
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [triageData, setTriageData] = useState<TriageResult | null>(null);

    const [formData, setFormData] = useState({
        patientId: "",
        patientName: "",
        diagnosis: "",
        instructions: "",
    });

    const [medications, setMedications] = useState<Medication[]>([
        { name: "", dosage: "", frequency: "", duration: "", notes: "" }
    ]);

    useEffect(() => {
        if (triageId) {
            const fetchTriage = async () => {
                setIsLoading(true);
                try {
                    const data = await triageApi.getById(triageId);
                    setTriageData(data);
                    setFormData({
                        patientId: data.patientId,
                        patientName: data.patientName,
                        diagnosis: `Based on triage: ${data.category} - ${data.symptoms.substring(0, 50)}...`,
                        instructions: "Follow as directed.",
                    });
                } catch (error) {
                    console.error("Failed to fetch triage data:", error);
                    toast({
                        title: "Error",
                        description: "Could not load patient triage data.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTriage();
        }
    }, [triageId, toast]);

    const addMedication = () => {
        setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId || !formData.patientName) {
            toast({ title: "Error", description: "Patient information missing.", variant: "destructive" });
            return;
        }

        // Filter out empty medications and validate
        const validMedications = medications.filter(
            med => med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
        );

        if (validMedications.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one medication with name, dosage, frequency, and duration.",
                variant: "destructive"
            });
            return;
        }

        if (!formData.diagnosis.trim()) {
            toast({
                title: "Error",
                description: "Please enter a diagnosis.",
                variant: "destructive"
            });
            return;
        }

        if (!formData.instructions.trim()) {
            toast({
                title: "Error",
                description: "Please enter instructions.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await prescriptionsApi.create({
                patientId: formData.patientId,
                patientName: formData.patientName,
                diagnosis: formData.diagnosis.trim(),
                medications: validMedications.map(med => ({
                    name: med.name.trim(),
                    dosage: med.dosage.trim(),
                    frequency: med.frequency.trim(),
                    duration: med.duration.trim(),
                    notes: med.notes?.trim() || undefined,
                })),
                instructions: formData.instructions.trim(),
            });

            toast({
                title: "Prescription Created",
                description: `Verification Hash: ${response.verificationHash}. Copied to clipboard.`,
            });
            navigator.clipboard.writeText(response.verificationHash);
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Prescription creation failed:", error);
            let errorMessage = error?.response?.data?.detail || error?.message || "Failed to create prescription.";

            // Handle specific error codes
            if (error?.status === 403) {
                errorMessage = "Access denied. You need to be logged in as a doctor, admin, or staff member to create prescriptions.";
            } else if (error?.status === 401) {
                errorMessage = "Please log in to create prescriptions.";
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                        <ClipboardList className="h-6 w-6 text-primary" />
                        <span className="text-lg font-semibold">New Digital Prescription</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Patient & Diagnosis Info */}
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">Patient Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="patientName">Patient Name</Label>
                                        <Input id="patientName" value={formData.patientName} readOnly className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="diagnosis">Diagnosis / Context</Label>
                                        <Textarea
                                            id="diagnosis"
                                            placeholder="Enter clinical diagnosis..."
                                            value={formData.diagnosis}
                                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                            required
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {triageData && (
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold uppercase text-primary">Triage Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Badge variant="outline" className="mb-2 bg-white">{triageData.category}</Badge>
                                        <p className="text-sm italic text-muted-foreground">"{triageData.symptoms}"</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Medications List */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Pill className="h-5 w-5 text-primary" />
                                    Prescribed Medications
                                </h2>
                                <Button type="button" variant="outline" size="sm" onClick={addMedication} className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Med
                                </Button>
                            </div>

                            {medications.map((med, index) => (
                                <Card key={index} className="relative group overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label>Medication Name</Label>
                                                <Input
                                                    placeholder="e.g. Amoxicillin"
                                                    value={med.name}
                                                    onChange={(e) => updateMedication(index, "name", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Dosage</Label>
                                                <Input
                                                    placeholder="e.g. 500mg"
                                                    value={med.dosage}
                                                    onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Frequency</Label>
                                                <Input
                                                    placeholder="e.g. 2 times a day"
                                                    value={med.frequency}
                                                    onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" /> Duration
                                                </Label>
                                                <Input
                                                    placeholder="e.g. 7 days"
                                                    value={med.duration}
                                                    onChange={(e) => updateMedication(index, "duration", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <MessageSquare className="h-3 w-3" /> Usage Notes
                                                </Label>
                                                <Input
                                                    placeholder="e.g. After food"
                                                    value={med.notes || ""}
                                                    onChange={(e) => updateMedication(index, "notes", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {medications.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeMedication(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase text-muted-foreground">General Instructions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="General instructions for the patient..."
                                        value={formData.instructions}
                                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                        required
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Link to="/dashboard">
                                    <Button variant="ghost" type="button">Cancel</Button>
                                </Link>
                                <Button type="submit" className="min-w-[200px]" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Issuing Digital Rx...</> : "Issue Digital Prescription"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default CreatePrescription;
