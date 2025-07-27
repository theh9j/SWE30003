from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
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
    role = Column(String, nullable=False)  # "user", "pharmacist", "admin"

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

# === Login Endpoint ===
@app.post("/api/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.username == data.username).first()
    if not account:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(data.password.encode(), account.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user": account.username,
        "role": account.role,
    }

# === Register Endpoint ===
@app.post("/api/auth/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    if db.query(Account).filter(Account.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(Account).filter(Account.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate role
    allowed_roles = {"user", "pharmacist", "admin"}
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
