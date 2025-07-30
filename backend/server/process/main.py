from fastapi import FastAPI, HTTPException, Depends, Request, Response, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine, DateTime, ForeignKey, Date, Float, Boolean, Text
from sqlalchemy.orm import relationship
from typing import Optional
from datetime import datetime
import random
from datetime import timedelta
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

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    medicines = relationship("Medicine", back_populates="category")

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, nullable=False, unique=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    description = Column(Text, nullable=True)
    dosage = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    requires_prescription = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    category = relationship("Category", back_populates="medicines")
    inventory_items = relationship("Inventory", back_populates="medicine")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"))
    quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=10)
    batch_number = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)
    supplier = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    medicine = relationship("Medicine", back_populates="inventory_items")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String)
    customer_name = Column(String)

    pharmacist_id = Column(String) 
    doctor_name = Column(String) 

    prescription_number = Column(String, unique=True)
    issued_date = Column(Date)
    notes = Column(String)

    status = Column(String, default="Active")
    verified_at = Column(DateTime, nullable=True)
    dispensed_at = Column(DateTime, nullable=True)
    doctor_id = Column(Integer, nullable=True)

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
    prescriptionNumber: str
    customerId: str
    customerName: str
    doctorId: Optional[int] = None
    doctorName: Optional[str] = None
    issuedDate: date
    notes: Optional[str]
    status: str
    verifiedAt: Optional[datetime] = None
    dispensedAt: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class UpdateCustomerData(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class MedicineCreate(BaseModel):
    name: str
    sku: str
    categoryId: int
    description: Optional[str] = None
    dosage: Optional[str] = None
    manufacturer: Optional[str] = None
    price: float
    requiresPrescription: bool = False

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    categoryId: Optional[int] = None
    description: Optional[str] = None
    dosage: Optional[str] = None
    manufacturer: Optional[str] = None
    price: Optional[float] = None
    requiresPrescription: Optional[bool] = None

class MedicineOut(BaseModel):
    id: int
    name: str
    sku: str
    categoryId: int
    description: Optional[str]
    dosage: Optional[str]
    manufacturer: Optional[str]
    price: float
    requiresPrescription: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class InventoryCreate(BaseModel):
    medicineId: int
    quantity: int
    minStockLevel: int = 10
    batchNumber: Optional[str] = None
    expiryDate: Optional[date] = None
    supplier: Optional[str] = None

class InventoryOut(BaseModel):
    id: int
    medicineId: int
    quantity: int
    minStockLevel: int
    batchNumber: Optional[str]
    expiryDate: Optional[date]
    supplier: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            medicineId=obj.medicine_id,
            quantity=obj.quantity,
            minStockLevel=obj.min_stock_level,
            batchNumber=obj.batch_number,
            expiryDate=obj.expiry_date,
            supplier=obj.supplier,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )

# === DB Dependency ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === Helper Functions ===
def get_current_user(request: Request, db: Session):
    username = request.cookies.get("session_user")
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = db.query(Account).filter(Account.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def is_admin(user: Account) -> bool:
    return user.role == "admin"

def is_pharmacist_or_admin(user: Account) -> bool:
    return user.role in ["pharmacist", "admin"]

# MANUAL LOGOUT (TEMP)
@app.get("/manual-logout")
def manual_logout():
    response = JSONResponse(content={"message": "Manually logged out"})
    response.delete_cookie("session_user")
    return response

# === Admin Account Creation ===
@app.on_event("startup")
def on_boot():
    db = SessionLocal()

    def hash_password(raw):
        return bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()

    # Create admin account
    if not db.query(Account).filter(Account.username == "admin").first():
        db.add(Account(
            username="admin",
            password=hash_password("test123"),
            email="wow@gmail.com",
            full_name="Test",
            role="admin",
            status="active",
        ))

    # Seed customers
    customer_data = [
        ("alice", "alice1@gmail.com", "Alice Johnson"),
        ("bob", "bob2@gmail.com", "Bob Smith"),
        ("carol", "carol3@gmail.com", "Carol White"),
        ("david", "david4@gmail.com", "David Brown"),
        ("eve", "eve5@gmail.com", "Eve Black"),
        ("frank", "frank6@gmail.com", "Frank Green"),
        ("grace", "grace7@gmail.com", "Grace Lee"),
    ]
    addresses = ["123 Baker Street", "42 Wallaby Way"]
    phones = ["0901234567", "0912345678", "0987654321"]

    for username, email, full_name in customer_data:
        if not db.query(Account).filter(Account.username == username).first():
            db.add(Account(
                username=username,
                password=hash_password("test123"),
                email=email,
                full_name=full_name,
                role="customer",
                status="active",
                address=addresses.pop() if addresses else None,
                phone_number=phones.pop() if phones else None
            ))

    # Seed pharmacists
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

    db.commit()  # Commit users before using them

    # Seed categories
    categories_data = [
        ("Pain Relief", "Medications for pain management"),
        ("Antibiotics", "Antimicrobial medications"),
        ("Vitamins", "Vitamin supplements"),
        ("Heart Medication", "Cardiovascular medications"),
        ("Diabetes", "Diabetes management medications"),
        ("Cold & Flu", "Medications for cold and flu symptoms"),
    ]

    for name, description in categories_data:
        if not db.query(Category).filter(Category.name == name).first():
            db.add(Category(name=name, description=description))

    db.commit()  # Commit categories before using them

    # Seed medicines
    categories = db.query(Category).all()
    medicines_data = [
        ("Paracetamol", "PARA500", "Pain Relief", "Effective pain and fever relief", "500mg", "Generic Pharma", 5.99, False),
        ("Amoxicillin", "AMOX250", "Antibiotics", "Broad-spectrum antibiotic", "250mg", "MedCorp", 12.50, True),
        ("Vitamin C", "VITC1000", "Vitamins", "Immune system support", "1000mg", "HealthPlus", 8.99, False),
        ("Lisinopril", "LISI10", "Heart Medication", "ACE inhibitor for blood pressure", "10mg", "CardioMed", 15.75, True),
        ("Metformin", "METF500", "Diabetes", "Type 2 diabetes medication", "500mg", "DiaCare", 18.25, True),
        ("Ibuprofen", "IBU200", "Pain Relief", "Anti-inflammatory pain reliever", "200mg", "Generic Pharma", 7.50, False),
    ]

    category_dict = {cat.name: cat.id for cat in categories}

    for name, sku, cat_name, desc, dosage, manufacturer, price, requires_rx in medicines_data:
        if not db.query(Medicine).filter(Medicine.sku == sku).first():
            medicine = Medicine(
                name=name,
                sku=sku,
                category_id=category_dict.get(cat_name, 1),
                description=desc,
                dosage=dosage,
                manufacturer=manufacturer,
                price=price,
                requires_prescription=requires_rx
            )
            db.add(medicine)

    db.commit()  # Commit medicines before creating inventory

    # Seed inventory
    medicines = db.query(Medicine).all()
    for medicine in medicines:
        if not db.query(Inventory).filter(Inventory.medicine_id == medicine.id).first():
            inventory = Inventory(
                medicine_id=medicine.id,
                quantity=random.randint(5, 100),
                min_stock_level=random.randint(10, 20),
                batch_number=f"BATCH{random.randint(1000, 9999)}",
                expiry_date=date.today() + timedelta(days=random.randint(30, 365)),
                supplier=f"Supplier {random.randint(1, 5)}"
            )
            db.add(inventory)

    # Seed prescriptions
    customers = db.query(Account).filter(Account.role == "customer").all()
    pharmacists = db.query(Account).filter(Account.role == "pharmacist").all()

    for i in range(5):
        customer = random.choice(customers)
        pharmacist = random.choice(pharmacists)
        prescription_number = f"RX-{random.randint(100000, 999999)}"
        issued_date = date.today() - timedelta(days=random.randint(0, 9))

        exists = db.query(Prescription).filter(Prescription.prescription_number == prescription_number).first()
        if exists:
            continue  # skip duplicates

        db.add(Prescription(
            customer_id=customer.username,
            customer_name=customer.full_name,
            pharmacist_id=pharmacist.username,
            doctor_name=pharmacist.full_name,
            prescription_number=prescription_number,
            issued_date=issued_date,
            notes="Sample prescription",
            status="active"
        ))

    db.commit()
    db.close()

# === Authentication Endpoints ===
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
        samesite="Lax",
    )

    return response

@app.post("/api/auth/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_user")
    return response

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

# === Account Management ===
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
    session_user = request.cookies.get("session_user") if request else None
    if session_user:
        current = db.query(Account).filter(Account.username == session_user).first()
        if not current or current.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin can create customer accounts")

    if db.query(Account).filter(Account.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(Account).filter(Account.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

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

# === Category Endpoints ===
@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "created_at": category.created_at
        }
        for category in categories
    ]

@app.post("/api/categories")
def create_category(category: CategoryCreate, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only admin can create categories")

    if db.query(Category).filter(Category.name == category.name).first():
        raise HTTPException(status_code=400, detail="Category name already exists")

    new_category = Category(
        name=category.name,
        description=category.description
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "id": new_category.id,
        "name": new_category.name,
        "description": new_category.description,
        "created_at": new_category.created_at
    }

# === Medicine Endpoints ===
@app.get("/api/medicines")
def get_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).all()
    return [
        {
            "id": medicine.id,
            "name": medicine.name,
            "sku": medicine.sku,
            "categoryId": medicine.category_id,
            "description": medicine.description,
            "dosage": medicine.dosage,
            "manufacturer": medicine.manufacturer,
            "price": medicine.price,
            "requiresPrescription": medicine.requires_prescription,
            "created_at": medicine.created_at
        }
        for medicine in medicines
    ]

@app.post("/api/medicines")
def create_medicine(medicine: MedicineCreate, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    if not is_pharmacist_or_admin(current_user):
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can create medicines")

    # Check if SKU already exists
    if db.query(Medicine).filter(Medicine.sku == medicine.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    # Verify category exists
    category = db.query(Category).filter(Category.id == medicine.categoryId).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")

    new_medicine = Medicine(
        name=medicine.name,
        sku=medicine.sku,
        category_id=medicine.categoryId,
        description=medicine.description,
        dosage=medicine.dosage,
        manufacturer=medicine.manufacturer,
        price=medicine.price,
        requires_prescription=medicine.requiresPrescription
    )
    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    # Create initial inventory entry
    inventory = Inventory(
        medicine_id=new_medicine.id,
        quantity=0,
        min_stock_level=10
    )
    db.add(inventory)
    db.commit()

    return {
        "id": new_medicine.id,
        "name": new_medicine.name,
        "sku": new_medicine.sku,
        "categoryId": new_medicine.category_id,
        "description": new_medicine.description,
        "dosage": new_medicine.dosage,
        "manufacturer": new_medicine.manufacturer,
        "price": new_medicine.price,
        "requiresPrescription": new_medicine.requires_prescription,
        "created_at": new_medicine.created_at
    }

@app.get("/api/medicines/{medicine_id}")
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    return {
        "id": medicine.id,
        "name": medicine.name,
        "sku": medicine.sku,
        "categoryId": medicine.category_id,
        "description": medicine.description,
        "dosage": medicine.dosage,
        "manufacturer": medicine.manufacturer,
        "price": medicine.price,
        "requiresPrescription": medicine.requires_prescription,
        "created_at": medicine.created_at
    }

@app.put("/api/medicines/{medicine_id}")
def update_medicine(medicine_id: int, medicine_update: MedicineUpdate, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    if not is_pharmacist_or_admin(current_user):
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can update medicines")

    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    # Check SKU uniqueness if it's being updated
    if medicine_update.sku and medicine_update.sku != medicine.sku:
        if db.query(Medicine).filter(Medicine.sku == medicine_update.sku).first():
            raise HTTPException(status_code=400, detail="SKU already exists")

    # Verify category exists if it's being updated
    if medicine_update.categoryId:
        category = db.query(Category).filter(Category.id == medicine_update.categoryId).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")

    # Update fields
    update_data = medicine_update.dict(exclude_unset=True)
    if 'categoryId' in update_data:
        update_data['category_id'] = update_data.pop('categoryId')
    if 'requiresPrescription' in update_data:
        update_data['requires_prescription'] = update_data.pop('requiresPrescription')

    for field, value in update_data.items():
        setattr(medicine, field, value)

    db.commit()
    db.refresh(medicine)

    return {
        "id": medicine.id,
        "name": medicine.name,
        "sku": medicine.sku,
        "categoryId": medicine.category_id,
        "description": medicine.description,
        "dosage": medicine.dosage,
        "manufacturer": medicine.manufacturer,
        "price": medicine.price,
        "requiresPrescription": medicine.requires_prescription,
        "created_at": medicine.created_at
    }

@app.delete("/api/medicines/{medicine_id}")
def delete_medicine(medicine_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    if not is_pharmacist_or_admin(current_user):
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can delete medicines")

    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    # Delete associated inventory records
    db.query(Inventory).filter(Inventory.medicine_id == medicine_id).delete()
    
    # Delete the medicine
    db.delete(medicine)
    db.commit()

    return {"message": "Medicine deleted successfully"}

# === Inventory Endpoints ===
@app.get("/api/inventory")
def get_inventory(db: Session = Depends(get_db)):
    inventory = db.query(Inventory).all()
    return [
        {
            "id": item.id,
            "medicineId": item.medicine_id,
            "quantity": item.quantity,
            "minStockLevel": item.min_stock_level,
            "batchNumber": item.batch_number,
            "expiryDate": item.expiry_date,
            "supplier": item.supplier,
            "created_at": item.created_at,
            "updated_at": item.updated_at
        }
        for item in inventory
    ]

@app.get("/api/inventory/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.quantity <= Inventory.min_stock_level).all()
    return [
        {
            "id": item.id,
            "medicineId": item.medicine_id,
            "quantity": item.quantity,
            "minStockLevel": item.min_stock_level,
            "batchNumber": item.batch_number,
            "expiryDate": item.expiry_date,
            "supplier": item.supplier,
            "created_at": item.created_at,
            "updated_at": item.updated_at
        }
        for item in inventory
    ]

@app.post("/api/inventory")
def create_inventory(inventory: InventoryCreate, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    if not is_pharmacist_or_admin(current_user):
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can manage inventory")

    # Verify medicine exists
    medicine = db.query(Medicine).filter(Medicine.id == inventory.medicineId).first()
    if not medicine:
        raise HTTPException(status_code=400, detail="Medicine not found")

    new_inventory = Inventory(
        medicine_id=inventory.medicineId,
        quantity=inventory.quantity,
        min_stock_level=inventory.minStockLevel,
        batch_number=inventory.batchNumber,
        expiry_date=inventory.expiryDate,
        supplier=inventory.supplier
    )
    db.add(new_inventory)
    db.commit()
    db.refresh(new_inventory)

    return {
        "id": new_inventory.id,
        "medicineId": new_inventory.medicine_id,
        "quantity": new_inventory.quantity,
        "minStockLevel": new_inventory.min_stock_level,
        "batchNumber": new_inventory.batch_number,
        "expiryDate": new_inventory.expiry_date,
        "supplier": new_inventory.supplier,
        "created_at": new_inventory.created_at,
        "updated_at": new_inventory.updated_at
    }

# === Prescription Endpoints ===
prescription_router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

@prescription_router.get("", response_model=list[PrescriptionOut])
@prescription_router.get("/", response_model=list[PrescriptionOut])
def get_prescriptions(db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).all()

    return [
        {
            "id": p.id,
            "prescriptionNumber": p.prescription_number,
            "customerId": p.customer_id,
            "customerName": p.customer_name,
            "doctorId": p.doctor_id,
            "doctorName": p.doctor_name,
            "issuedDate": p.issued_date,
            "notes": p.notes,
            "status": p.status,
            "verifiedAt": p.verified_at,
            "dispensedAt": p.dispensed_at,
        }
        for p in prescriptions
    ]

@app.post("/api/prescriptions")
def create_prescription(prescription: PrescriptionCreate, db: Session = Depends(get_db)):
    # customerId is a username string now
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
        doctor_name=pharmacist.full_name, 
        prescription_number=prescription.prescriptionNumber,
        issued_date=prescription.issuedDate,
        notes=prescription.notes,
        status="active"
    )

    db.add(new_prescription)
    db.commit()

    return {"message": "Prescription created successfully"}

# === Dashboard Stats ===
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_medicines = db.query(Medicine).count()
    total_customers = db.query(Account).filter(Account.role == "customer").count()
    total_prescriptions = db.query(Prescription).count()
    low_stock_count = db.query(Inventory).filter(Inventory.quantity <= Inventory.min_stock_level).count()
    
    return {
        "totalMedicines": total_medicines,
        "totalCustomers": total_customers,
        "totalPrescriptions": total_prescriptions,
        "lowStockItems": low_stock_count
    }

app.include_router(prescription_router)