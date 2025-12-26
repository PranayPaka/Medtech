import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDrugVerification } from "@/hooks/useDrugVerification";
import { Activity, ArrowLeft, Upload, Loader2, Shield, AlertTriangle, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const DrugVerification = () => {
  const { isLoading, result, verifyDrug, clearResult } = useDrugVerification();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const [formData, setFormData] = useState({
    drugName: "",
    batchNumber: "",
    manufacturer: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyDrug({
      imageFile: selectedFile || undefined,
      drugName: formData.drugName,
      batchNumber: formData.batchNumber,
      manufacturer: formData.manufacturer,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authentic': return <CheckCircle className="h-8 w-8 text-success" />;
      case 'suspicious': return <AlertTriangle className="h-8 w-8 text-warning" />;
      case 'counterfeit': return <XCircle className="h-8 w-8 text-destructive" />;
      default: return <Shield className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic': return "bg-success text-success-foreground";
      case 'suspicious': return "bg-warning text-warning-foreground";
      case 'counterfeit': return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/dashboard">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
            </div>
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Drug Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Verify Medication</CardTitle>
              <CardDescription>Upload image or enter drug details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  {selectedFile ? (
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload drug image</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drugName">Drug Name</Label>
                  <Input id="drugName" placeholder="e.g., Paracetamol 500mg" value={formData.drugName} onChange={(e) => setFormData({ ...formData, drugName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Number</Label>
                  <Input id="batch" placeholder="e.g., AB123456" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input id="manufacturer" placeholder="e.g., PharmaCorp" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify Drug"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Result</CardTitle>
              <CardDescription>Drug authenticity analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Submit drug information to verify authenticity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    {getStatusIcon(result.verificationStatus)}
                    <Badge className={`mt-2 ${getStatusColor(result.verificationStatus)}`}>
                      {result.verificationStatus.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-muted space-y-2">
                    <p><span className="font-medium">Drug:</span> {result.drugName}</p>
                    {result.batchNumber && <p><span className="font-medium">Batch:</span> {result.batchNumber}</p>}
                    <p><span className="font-medium">Confidence:</span> {(result.confidence * 100).toFixed(0)}%</p>
                  </div>

                  {result.warningMessage && (
                    <div className="p-4 rounded-lg border border-warning/50 bg-warning/10">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <p className="text-sm">{result.warningMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-2 mt-4">
                    <span className="text-sm font-medium">Verified by:</span>
                    {result.source === 'ml' ? (
                      <Badge variant="outline" className="border-success text-success bg-success/10 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Gemini AI Analysis
                      </Badge>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Badge variant="outline" className="border-warning text-warning bg-warning/10 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Rule-based Fallback
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">AI service unavailable</span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full" onClick={clearResult}>New Verification</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DrugVerification;