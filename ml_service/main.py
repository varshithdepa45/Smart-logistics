from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class DeliveryData(BaseModel):
    distance_km: float
    delay_minutes: float
    issue_type: str

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

