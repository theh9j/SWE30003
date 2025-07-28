from fastapi import FastAPI, HTTPException, Depends, Request, Response, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from fastapi.responses import JSONResponse
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Cookie
import bcrypt
import os

# === FastAPI Setup ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Database Setup ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '../../../data.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()
logged_in_users = set()

# === Database Models ===
class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    role = Column(String, nullable=False)
    status = Column(String, default="active")

    created_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String, unique=True, nullable=False)

    customer_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    customer_name = Column(String, nullable=False)

    doctor_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    doctor_name = Column(String, nullable=False)

    issued_date = Column(DateTime, default=datetime.utcnow)

    notes = Column(String, nullable=True)  # ✅ NEW FIELD

    status = Column(String, default="pending")
    verified_at = Column(DateTime, nullable=True)
    dispensed_at = Column(DateTime, nullable=True)

Base.metadata.create_all(bind=engine)

# === Pydantic Schemas ===
class LoginData(BaseModel):
    username: str
    password: str

class RegisterData(BaseModel):
    username: str
    password: str
    email: EmailStr
    fullName: str
    phone: str | None = None
    address: str | None = None
    role: str  # Will validate below

class PrescriptionCreate(BaseModel):
    prescription_number: str
    customer_id: int
    doctor_name: str
    issued_date: Optional[datetime] = None
    notes: Optional[str] = None  # ✅ Already present

class PrescriptionUpdate(BaseModel):
    status: Optional[str] = None
    verified_at: Optional[datetime] = None
    dispensed_at: Optional[datetime] = None

class PrescriptionOut(BaseModel):
    id: int
    prescription_number: str
    customer_id: int
    customer_name: str
    doctor_id: int
    doctor_name: str
    issued_date: datetime
    notes: Optional[str]  # ✅ NEW
    status: str
    verified_at: Optional[datetime]
    dispensed_at: Optional[datetime]

    class Config:
        orm_mode = True
        

# === DB Dependency ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === Miscellaneous ===
def is_admin(user: Account) -> bool:
    return user.role == "admin"

# MANUAL LOGOUT (TEMP)
@app.get("/manual-logout")
def manual_logout():
    response = JSONResponse(content={"message": "Manually logged out"})
    response.delete_cookie("session_user")
    return response


# === Admin Account Creation ===
@app.on_event("startup")
def create_admin_account():
    db = SessionLocal()
    existing = db.query(Account).filter_by(username="admin").first()
    if not existing:
        hashed_pw = bcrypt.hashpw("test123".encode(), bcrypt.gensalt()).decode()
        admin_account = Account(
            username="admin",
            password=hashed_pw,
            email="wow@gmail.com",
            full_name="Test",
            phone_number=None,
            address=None,
            role="admin",
            status="active",
            created_at=None
        )
        db.add(admin_account)
        db.commit()
    db.close()

# === Login Endpoint ===
@app.post("/api/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.username == data.username).first()

    if not account or not bcrypt.checkpw(data.password.encode(), account.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    response = JSONResponse(content={
        "message": "Login successful",
        "user": account.username,
        "role": account.role,
    })

    response.set_cookie(
        key="session_user",
        value=account.username,
        httponly=True,
        samesite="Lax",  # or "Strict"
    )

    return response

# === Logout Endpoint ===
@app.post("/api/auth/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_user")
    return response

# === Register Endpoint ===
@app.post("/api/auth/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    if db.query(Account).filter(Account.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(Account).filter(Account.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    allowed_roles = {"customer", "pharmacist", "admin"}
    if data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

    account = Account(
        username=data.username,
        password=hashed_pw,
        email=data.email,
        full_name=data.fullName,
        phone_number=data.phone,
        address=data.address,
        role=data.role,
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return {"message": "Account created successfully", "user": account.username, "role": account.role}

@app.get("/api/auth/me")
def auth_me(request: Request, db: Session = Depends(get_db)):
    try:
        username = request.cookies.get("session_user")
        if not username:
            return Response(status_code=204)

        account = db.query(Account).filter(Account.username == username).first()
        if not account:
            return Response(status_code=204)

        return {
            "username": account.username,
            "full_name": account.full_name,
            "role": account.role,
            "createdAt": account.created_at
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

#ACCOUNT MANAGER
@app.put("/api/accounts/{target_id}/suspend")
def suspend_account(
    target_id: int,
    db: Session = Depends(get_db),
    requester: RegisterData = Depends()  # Replace with session-based auth later
):
    # Lookup admin who is making the request
    admin = db.query(Account).filter(Account.username == requester.username).first()
    if not admin or not is_admin(admin):
        raise HTTPException(status_code=403, detail="Only admins can perform this action")

    # Find target account
    target = db.query(Account).filter(Account.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Account not found")

    if target.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot modify admin accounts")

    # Suspend the account
    target.status = "suspended"
    db.commit()
    return {"message": f"{target.username} has been suspended"}

#Prescription
router = APIRouter(prefix="/api/prescriptions")

@router.get("/", response_model=list[PrescriptionOut])
def get_prescriptions(db: Session = Depends(get_db)):
    return db.query(Prescription).all()

@router.post("/", response_model=PrescriptionOut)
def create_prescription(
    data: PrescriptionCreate,
    db: Session = Depends(get_db),
    session_user: Optional[str] = Cookie(default=None)
):
    if not session_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    doctor = db.query(Account).filter_by(username=session_user).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    new = Prescription(
        prescription_number=data.prescription_number,
        customer_id=data.customer_id,
        customer_name=db.query(Account).filter_by(id=data.customer_id).first().full_name,
        doctor_id=doctor.id,
        doctor_name=data.doctor_name,
        issued_date=data.issued_date or datetime.utcnow(),
        status="pending",
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

#Customers
@app.get("/api/users")
def get_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Account)
    if role:
        query = query.filter(Account.role == role)
    users = query.all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name,
            "phone": user.phone_number,
            "address": user.address,
            "role": user.role,
            "isActive": user.status == "active",
            "createdAt": user.created_at
        }
        for user in users
    ]