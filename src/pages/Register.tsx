import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Loader2, User, Stethoscope } from "lucide-react";

const Register = () => {
    const [userType, setUserType] = useState<"doctor" | "patient">("doctor");
    const [doctorForm, setDoctorForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff" as "doctor" | "staff",
        department: "",
    });
    const [patientForm, setPatientForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleDoctorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await register({ ...doctorForm, userType: "doctor" });
            toast({
                title: "Account Created",
                description: "Registration successful! Welcome to the platform.",
            });
            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Registration Failed",
                description: error?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePatientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await register({ ...patientForm, userType: "patient" });
            toast({
                title: "Account Created",
                description: "Registration successful! Welcome to the platform.",
            });
            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Registration Failed",
                description: error?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Activity className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <CardDescription>Join the Med tech platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mt-4">
                        <form onSubmit={handleDoctorSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="doctor-name">Full Name</Label>
                                <Input
                                    id="doctor-name"
                                    placeholder="Dr. Jane Doe"
                                    value={doctorForm.name}
                                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctor-email">Email</Label>
                                <Input
                                    id="doctor-email"
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    value={doctorForm.email}
                                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctor-password">Password</Label>
                                <Input
                                    id="doctor-password"
                                    type="password"
                                    value={doctorForm.password}
                                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="doctor-role">Role</Label>
                                    <Select
                                        value={doctorForm.role}
                                        onValueChange={(v: any) => setDoctorForm({ ...doctorForm, role: v })}
                                    >
                                        <SelectTrigger id="doctor-role">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="doctor">Doctor</SelectItem>
                                            <SelectItem value="staff">Medical Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="doctor-department">Department</Label>
                                    <Input
                                        id="doctor-department"
                                        placeholder="Cardiology"
                                        value={doctorForm.department}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-primary">
                            ← Back to home
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
