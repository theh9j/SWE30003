from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from fastapi.responses import JSONResponse
from fastapi import Request
from sqlalchemy.orm import sessionmaker, Session
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
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    role = Column(String, nullable=False)   # "admin", "pharmacist", or "customer"
    status = Column(String, default="active")  # "active", "suspended", etc.

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
            status="active"
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
    username = request.cookies.get("session_user")
    if not username:
        return {"account": "Logged out"}

    account = db.query(Account).filter_by(username=username).first()
    if account:
        return {"account": "Logged in"}
    return {"account": "Logged out"}

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