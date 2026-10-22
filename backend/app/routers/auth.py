from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, auth, models

router = APIRouter(prefix="/api/auth", tags=["Auth & User Management"])

def get_user_zone_name(db: Session, zone_id: int) -> str:
    if zone_id:
        cz = db.query(models.CommunityZone).filter(models.CommunityZone.id == zone_id).first()
        if cz:
            return cz.zone_name
    first_zone = db.query(models.CommunityZone).first()
    return first_zone.zone_name if first_zone else "Mumbai Central"

@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )

    user = crud.create_user(db, user_in)
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})

    zone_name = get_user_zone_name(db, user.zone_id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.full_name,
        "email": user.email,
        "zone": zone_name
    }

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, credentials.email)
    if not db_user or not auth.verify_password(credentials.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password"
        )

    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role, "user_id": db_user.id})

    zone_name = get_user_zone_name(db, db_user.zone_id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "name": db_user.full_name,
        "email": db_user.email,
        "zone": zone_name
    }

@router.get("/me")
def get_me(current_user: dict = Depends(auth.get_required_current_user)):
    """Returns authenticated user profile information."""
    return current_user
