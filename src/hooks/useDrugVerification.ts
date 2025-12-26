import { useState, useCallback } from 'react';
import { DrugVerificationInput, DrugVerificationResult } from '@/types';
import { drugVerificationApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Rule-based fallback verification when ML is unavailable
function calculateFallbackVerification(input: DrugVerificationInput): Omit<DrugVerificationResult, 'id' | 'verifiedAt'> {
  // Simple rule-based check - in production, this would be more sophisticated
  const drugName = input.drugName || 'Unknown Drug';
  const batchNumber = input.batchNumber;

  // Simulate verification based on batch number format
  let isAuthentic = true;
  let confidence = 0.6;
  let verificationStatus: DrugVerificationResult['verificationStatus'] = 'authentic';
  let warningMessage: string | undefined;

  if (!batchNumber) {
    verificationStatus = 'unknown';
    confidence = 0.3;
    warningMessage = 'No batch number provided. Unable to fully verify authenticity.';
    isAuthentic = false;
  } else if (batchNumber.length < 6) {
    verificationStatus = 'suspicious';
    confidence = 0.5;
    warningMessage = 'Batch number format is unusual. Manual verification recommended.';
    isAuthentic = false;
  } else if (/^[A-Z]{2}[0-9]{6,}$/.test(batchNumber)) {
    verificationStatus = 'authentic';
    confidence = 0.75;
    isAuthentic = true;
  } else {
    verificationStatus = 'suspicious';
    confidence = 0.4;
    warningMessage = 'Batch number does not match expected format.';
    isAuthentic = false;
  }

  return {
    drugName,
    batchNumber,
    isAuthentic,
    confidence,
    verificationStatus,
    warningMessage,
    source: 'rule-based',
    details: {
      manufacturer: input.manufacturer || 'Unknown',
    },
  };
}

export function useDrugVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DrugVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const verifyDrug = useCallback(async (input: DrugVerificationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to call the backend API
      const response = await drugVerificationApi.verify(input);
      setResult(response);
      
      if (response.verificationStatus === 'authentic') {
        toast({
          title: 'Drug Verified',
          description: 'This medication appears to be authentic.',
        });
      } else {
        toast({
          title: 'Verification Warning',
          description: response.warningMessage || 'Unable to confirm authenticity.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      // Fallback to rule-based verification
      console.warn('ML drug verification unavailable, using rule-based fallback:', err);
      
      const fallbackResult = calculateFallbackVerification(input);
      const mockResult: DrugVerificationResult = {
        id: `verify_${Date.now()}`,
        verifiedAt: new Date().toISOString(),
        ...fallbackResult,
      };
      
      setResult(mockResult);
      
      if (mockResult.verificationStatus === 'authentic') {
        toast({
          title: 'Drug Verified (Fallback)',
          description: 'Basic verification passed. Note: Using rule-based assessment.',
        });
      } else {
        toast({
          title: 'Verification Warning',
          description: mockResult.warningMessage || 'Unable to confirm authenticity.',
          variant: 'destructive',
        });
      }
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
    verifyDrug,
    clearResult,
  };
}