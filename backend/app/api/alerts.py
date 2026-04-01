from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_active_user
from ..database import get_db
from ..models import Alert, AlertEvent, User
from ..schemas import Alert as AlertSchema
from ..schemas import AlertCreate, AlertEvent as AlertEventSchema, AlertUpdate
from ..services.alert_monitor import alert_monitor_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/", response_model=AlertSchema)
async def create_alert(
    alert: AlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new alert."""
    db_alert = Alert(**alert.dict(), user_id=current_user.id)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.get("/", response_model=List[AlertSchema])
async def get_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all alerts for current user."""
    return db.query(Alert).filter(Alert.user_id == current_user.id).all()


@router.get("/events", response_model=List[AlertEventSchema])
async def get_alert_events(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get recent alert trigger events for current user."""
    events = (
        db.query(AlertEvent)
        .filter(AlertEvent.user_id == current_user.id)
        .order_by(AlertEvent.created_at.desc())
        .limit(100)
        .all()
    )
    return events


@router.post("/monitor/run")
async def run_alert_monitor_once(
    current_user: User = Depends(get_current_active_user),
):
    """Manually trigger one alert-monitor cycle."""
    await alert_monitor_service.check_alerts_once()
    return {"message": "Alert monitor cycle completed."}


@router.get("/monitor/status")
async def get_alert_monitor_status(
    current_user: User = Depends(get_current_active_user),
):
    """Get alert monitor runtime status."""
    return alert_monitor_service.status()


@router.get("/{alert_id}", response_model=AlertSchema)
async def get_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}", response_model=AlertSchema)
async def update_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    for field, value in alert_update.dict(exclude_unset=True).items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
