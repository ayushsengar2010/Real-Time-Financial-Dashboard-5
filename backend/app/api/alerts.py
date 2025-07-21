from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Alert
from ..schemas import AlertCreate, Alert as AlertSchema, AlertUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/", response_model=AlertSchema)
async def create_alert(
    alert: AlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new price alert"""
    db_alert = Alert(
        **alert.dict(),
        user_id=current_user.id
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/", response_model=List[AlertSchema])
async def get_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all alerts for current user"""
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id).all()
    return alerts

@router.get("/{alert_id}", response_model=AlertSchema)
async def get_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific alert"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert

@router.put("/{alert_id}", response_model=AlertSchema)
async def update_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an alert"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    
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
    db: Session = Depends(get_db)
):
    """Delete an alert"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"} 