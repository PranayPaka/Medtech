"""
ML Service Module
"""

from .triage_service import predict_triage
from .drug_service import predict_drug_recommendation

__all__ = ["predict_triage", "predict_drug_recommendation"]

