from fastapi import FastAPI
from pydantic import BaseModel
from random import uniform

app = FastAPI()

class DeliveryData(BaseModel):
    distance_km: float
    delay_minutes: float
    issue_type: str


class RiskRequest(BaseModel):
    order_id: str
    driver_id: str
    reason: str

@app.get("/")
def root():
    return {"status": "ML service running"}

@app.post("/predict-reassign")
def predict(data: DeliveryData):
    if data.issue_type == "vehicle_breakdown":
        return {
            "reassign": True,
            "predicted_delay": data.delay_minutes + 30,
            "reason": "Vehicle breakdown"
        }

    if data.delay_minutes > 20:
        return {
            "reassign": True,
            "predicted_delay": data.delay_minutes,
            "reason": "High delay"
        }

    return {
        "reassign": False,
        "predicted_delay": data.delay_minutes,
        "reason": "Delay acceptable"
    }


@app.post("/predict-risk")
def predict_risk(req: RiskRequest):
    """
    Return a simulated risk score (0.0 - 1.0) for a given delay event.
    This mirrors the lightweight heuristic used in the backend demo but
    exposes it as a separate ML microservice endpoint for integration.
    """
    reason = req.reason or ""
    base_risk = len(reason) / 100.0
    ml_noise = uniform(0.0, 0.3)
    risk_score = min(1.0, base_risk + ml_noise)
    return {"risk_score": risk_score}

