import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Triage from "./pages/Triage";
import CreatePrescription from "./pages/CreatePrescription";
import PatientPrescriptions from "./pages/PatientPrescriptions";
import ViewPrescriptions from "./pages/ViewPrescriptions";
import DrugVerification from "./pages/DrugVerification";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/chatbot/AIChatbot";
import ClinicalShortcuts from "./components/layout/ClinicalShortcuts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="care-connect-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/triage" element={<Triage />} />
              <Route path="/create-prescription" element={<CreatePrescription />} />
              <Route path="/prescriptions" element={<ViewPrescriptions />} />
              <Route path="/my-prescriptions" element={<PatientPrescriptions />} />
              <Route path="/drug-verification" element={<DrugVerification />} />
              <Route path="/pharmacy" element={<PharmacyDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIChatbot />
            <ClinicalShortcuts />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;