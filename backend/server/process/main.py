from fastapi import FastAPI, HTTPException, Depends, Request, Response, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from fastapi.responses import JSONResponse
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Cookie
from datetime import date
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
    customer_id = Column(Integer)
    customer_name = Column(String)
    pharmacist_id = Column(Integer)
    pharmacist_name = Column(String)
    prescription_number = Column(String, unique=True)
    issued_date = Column(Date)
    notes = Column(String)

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
    customerId: str
    pharmacistUsername: str
    prescriptionNumber: str
    issuedDate: date
    notes: str | None = None

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

    model_config = {
        "from_attributes": True
    }

class UpdateCustomerData(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
        

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

    def hash_password(raw):
        return bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()

    # Create the admin account if it doesn't exist
    if not db.query(Account).filter(Account.username == "admin").first():
        admin = Account(
            username="admin",
            password=hash_password("test123"),
            email="wow@gmail.com",
            full_name="Test",
            role="admin",
            status="active",
        )
        db.add(admin)

    # Example customer accounts
    customer_data = [
        ("alice", "alice1@gmail.com", "Alice Johnson"),
        ("bob", "bob2@gmail.com", "Bob Smith"),
        ("carol", "carol3@gmail.com", "Carol White"),
        ("david", "david4@gmail.com", "David Brown"),
        ("eve", "eve5@gmail.com", "Eve Black"),
        ("frank","frank6@gmail.com", "Frank Green"),
        ("grace", "grace7@gmail.com", "Grace Lee"),
    ]

    random_addresses = [
        "123 Baker Street",
        "42 Wallaby Way"
    ]

    random_phones = [
        "0901234567",
        "0912345678",
        "0987654321"
    ]

    for i, (username, email, full_name) in enumerate(customer_data):
        if not db.query(Account).filter(Account.username == username).first():
            address = random_addresses.pop() if random_addresses else None
            phone = random_phones.pop() if random_phones else None

            db.add(Account(
                username=username,
                password=hash_password("test123"),
                email=email,
                full_name=full_name,
                role="customer",
                status="active",
                address=address,
                phone_number=phone
            ))

    # Example pharmacist accounts
    pharmacist_data = [
        ("pharma1", "pharma1@gmail.com", "Dr. John Med"),
        ("pharma2", "pharma2@gmail.com", "Dr. Jane Cure"),
        ("pharma3", "pharma3@gmail.com", "Dr. Amy Dose"),
    ]

    for username, email, full_name in pharmacist_data:
        if not db.query(Account).filter(Account.username == username).first():
            db.add(Account(
                username=username,
                password=hash_password("test123"),
                email=email,
                full_name=full_name,
                role="pharmacist",
                status="active"
            ))

    db.commit()
    db.close()


# === Login Endpoint ===
@app.post("/api/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.username == data.username).first()

    if not account or not bcrypt.checkpw(data.password.encode(), account.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if account.status != "active":
        raise HTTPException(status_code=403, detail="Account is suspended")

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
@app.put("/api/accounts/{target_username}/state")
def state_change_account(target_username: str, db: Session = Depends(get_db), request: Request = None):
    session_user = request.cookies.get("session_user")
    current = db.query(Account).filter(Account.username == session_user).first()
    if not current or current.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can toggle status")

    account = db.query(Account).filter(Account.username == target_username).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot change status of admin accounts")

    account.status = "suspended" if account.status == "active" else "active"
    db.commit()

    return {"message": f"Account status changed to {account.status}"}
    
@app.post("/api/users")
def create_customer(data: RegisterData, db: Session = Depends(get_db), request: Request = None):
    # Optional auth check
    session_user = request.cookies.get("session_user") if request else None
    if session_user:
        current = db.query(Account).filter(Account.username == session_user).first()
        if not current or current.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin can create customer accounts")

    # Check if username/email already exist
    if db.query(Account).filter(Account.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(Account).filter(Account.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Role must be customer
    if data.role != "customer":
        raise HTTPException(status_code=400, detail="Only 'customer' accounts can be created here")

    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

    customer = Account(
        username=data.username,
        password=hashed_pw,
        email=data.email,
        full_name=data.fullName,
        phone_number=data.phone,
        address=data.address,
        role="customer",
        status="active"
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {"message": "Customer account created", "id": customer.id}

@app.put("/api/users/{user_id}")
def update_customer(user_id: int, data: UpdateCustomerData, db: Session = Depends(get_db), request: Request = None):
    session_user = request.cookies.get("session_user")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    current = db.query(Account).filter(Account.username == session_user).first()
    if not current or current.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update customer info")

    customer = db.query(Account).filter(Account.id == user_id, Account.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.full_name = data.fullName
    customer.email = data.email
    customer.phone_number = data.phone
    customer.address = data.address

    db.commit()
    db.refresh(customer)

    return {"message": "Customer updated successfully"}

#Prescription
router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

@router.get("/", response_model=list[PrescriptionOut])
def get_prescriptions(db: Session = Depends(get_db)):
    return db.query(Prescription).all()

@app.post("/api/prescriptions")
def create_prescription(prescription: PrescriptionCreate, db: Session = Depends(get_db)):
    # Interpret customerId as username
    customer = db.query(Account).filter(Account.username == prescription.customerId).first()
    pharmacist = db.query(Account).filter(Account.username == prescription.pharmacistUsername).first()

    if not customer or customer.role != "customer":
        raise HTTPException(status_code=404, detail="Customer not found")
    if not pharmacist or pharmacist.role != "pharmacist":
        raise HTTPException(status_code=404, detail="Pharmacist not found")

    new_prescription = Prescription(
        customer_id=customer.username,
        customer_name=customer.full_name,
        pharmacist_id=pharmacist.username,
        pharmacist_name=pharmacist.full_name,
        prescription_number=prescription.pharmacistUsername,
        issued_date=prescription.issuedDate,
        notes=prescription.notes,
    )

    db.add(new_prescription)
    db.commit()

    return {"message": "Prescription created successfully"}

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




app.include_router(router)