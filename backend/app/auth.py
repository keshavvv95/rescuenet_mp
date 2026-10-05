import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db

security = HTTPBearer(auto_error=False)

def get_password_hash(password: str) -> str:
    """Generates bcrypt hash for user passwords."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored bcrypt hash strictly."""
    if not hashed_password or not (hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")):
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) -> Optional[dict]:
    """Optional auth helper. Returns user dict if valid token supplied, otherwise None."""
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None
    
    from app.models import User, CommunityZone
    sub_email = (payload.get("sub") or "").strip().lower()
    user = db.query(User).filter(User.email == sub_email).first()
    if not user:
        return None

    zone_name = None
    if user.zone_id:
        cz = db.query(CommunityZone).filter(CommunityZone.id == user.zone_id).first()
        if cz:
            zone_name = cz.zone_name

    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "zone_id": user.zone_id,
        "zone_name": zone_name
    }

def get_required_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) -> dict:
    """Strict auth helper. Requires valid Bearer token and active DB user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    from app.models import User, CommunityZone
    sub_email = (payload.get("sub") or "").strip().lower()
    user = db.query(User).filter(User.email == sub_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    zone_name = None
    if user.zone_id:
        cz = db.query(CommunityZone).filter(CommunityZone.id == user.zone_id).first()
        if cz:
            zone_name = cz.zone_name

    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "zone_id": user.zone_id,
        "zone_name": zone_name
    }

def require_role(allowed_roles: List[str]):
    """Strict Role-Based Access Control (RBAC) dependency."""
    def role_checker(user: dict = Depends(get_required_current_user)):
        user_role = user.get("role", "citizen")
        if user_role not in allowed_roles and user_role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Role '{user_role}' does not have required permissions."
            )
        return user
    return role_checker
