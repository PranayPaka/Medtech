import { useState, useCallback } from 'react';
import { TriageInput, TriageResult, UrgencyLevel } from '@/types';
import { triageApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Rule-based fallback triage when ML is unavailable
function calculateFallbackTriage(input: TriageInput): Omit<TriageResult, 'id' | 'createdAt' | 'patientId'> {
  const symptoms = input.symptoms.toLowerCase();
  let urgencyLevel: UrgencyLevel = 5;
  let category: TriageResult['category'] = 'Normal';
  let explanation = '';
  let recommendedAction = '';

  // Emergency keywords
  const emergencyKeywords = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'stroke', 'heart attack', 'seizure', 'choking'];
  const highKeywords = ['high fever', 'severe pain', 'vomiting blood', 'head injury', 'fracture', 'allergic reaction'];
  const mediumKeywords = ['moderate pain', 'persistent fever', 'infection', 'dizziness', 'weakness'];
  const lowKeywords = ['mild pain', 'cold', 'cough', 'headache', 'fatigue'];

  if (emergencyKeywords.some(kw => symptoms.includes(kw))) {
    urgencyLevel = 1;
    category = 'Emergency';
    explanation = 'Patient symptoms indicate a potentially life-threatening condition requiring immediate attention.';
    recommendedAction = 'Immediate medical intervention required. Alert emergency team.';
  } else if (highKeywords.some(kw => symptoms.includes(kw))) {
    urgencyLevel = 2;
    category = 'High';
    explanation = 'Patient symptoms suggest a serious condition requiring urgent care.';
    recommendedAction = 'Prioritize for urgent care within 30 minutes.';
  } else if (mediumKeywords.some(kw => symptoms.includes(kw))) {
    urgencyLevel = 3;
    category = 'Medium';
    explanation = 'Patient symptoms indicate a condition requiring timely evaluation.';
    recommendedAction = 'Schedule for evaluation within 1-2 hours.';
  } else if (lowKeywords.some(kw => symptoms.includes(kw))) {
    urgencyLevel = 4;
    category = 'Low';
    explanation = 'Patient symptoms suggest a minor condition.';
    recommendedAction = 'Can wait for routine care. Monitor for changes.';
  } else {
    urgencyLevel = 5;
    category = 'Normal';
    explanation = 'Standard evaluation recommended. No urgent symptoms detected.';
    recommendedAction = 'Schedule routine appointment.';
  }

  // Adjust for age and vitals
  if (input.age < 5 || input.age > 70) {
    if (urgencyLevel > 1) urgencyLevel = (urgencyLevel - 1) as UrgencyLevel;
    explanation += ' Age factor increases priority.';
  }

  if (input.vitals) {
    const { temperature, oxygenSaturation, heartRate } = input.vitals;
    if (temperature && temperature > 39) {
      if (urgencyLevel > 2) urgencyLevel = (urgencyLevel - 1) as UrgencyLevel;
      explanation += ' High temperature noted.';
    }
    if (oxygenSaturation && oxygenSaturation < 94) {
      urgencyLevel = 1;
      category = 'Emergency';
      explanation += ' Low oxygen saturation - critical concern.';
    }
    if (heartRate && (heartRate > 120 || heartRate < 50)) {
      if (urgencyLevel > 2) urgencyLevel = 2;
      explanation += ' Abnormal heart rate detected.';
    }
  }

  return {
    patientName: input.patientName,
    urgencyLevel,
    category,
    explanation,
    confidence: 0.7,
    source: 'rule-based',
    symptoms: input.symptoms,
    recommendedAction,
  };
}

export function useTriage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submitTriage = useCallback(async (input: TriageInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to call the backend API
      const response = await triageApi.submit(input);
      setResult(response);
      toast({
        title: 'Triage Complete',
        description: `Patient classified as ${response.category} priority.`,
      });
    } catch (err) {
      // Fallback to rule-based triage
      console.warn('ML triage unavailable, using rule-based fallback:', err);

      const fallbackResult = calculateFallbackTriage(input);
      const mockResult: TriageResult = {
        id: `triage_${Date.now()}`,
        patientId: input.patientId || `patient_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...fallbackResult,
      };

      setResult(mockResult);
      toast({
        title: 'Triage Complete (Fallback)',
        description: `Patient classified as ${mockResult.category} priority. Note: Using rule-based assessment.`,
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    error,
    submitTriage,
    clearResult,
    setResult,
  };
}