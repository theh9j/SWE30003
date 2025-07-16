import {
  users, medicines, categories, inventory, prescriptions, prescriptionItems,
  sales, saleItems, discounts,
  type User, type InsertUser, type Medicine, type InsertMedicine,
  type Category, type InsertCategory, type Inventory, type InsertInventory,
  type Prescription, type InsertPrescription, type PrescriptionItem, type InsertPrescriptionItem,
  type Sale, type InsertSale, type SaleItem, type InsertSaleItem,
  type Discount, type InsertDiscount
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllCustomers(): Promise<User[]>;
  getAllPharmacists(): Promise<User[]>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Medicine operations
  getAllMedicines(): Promise<Medicine[]>;
  getMedicine(id: number): Promise<Medicine | undefined>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: number, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: number): Promise<boolean>;

  // Inventory operations
  getAllInventory(): Promise<Inventory[]>;
  getInventoryByMedicine(medicineId: number): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, inventory: Partial<InsertInventory>): Promise<Inventory | undefined>;
  getLowStockItems(): Promise<Inventory[]>;

  // Prescription operations
  getAllPrescriptions(): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  getPrescriptionsByCustomer(customerId: number): Promise<Prescription[]>;

  // Prescription item operations
  getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]>;
  createPrescriptionItem(item: InsertPrescriptionItem): Promise<PrescriptionItem>;

  // Sale operations
  getAllSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  getSalesByDate(date: string): Promise<Sale[]>;
  getSalesByCustomer(customerId: number): Promise<Sale[]>;

  // Sale item operations
  getSaleItems(saleId: number): Promise<SaleItem[]>;
  createSaleItem(item: InsertSaleItem): Promise<SaleItem>;

  // Discount operations
  getAllDiscounts(): Promise<Discount[]>;
  getActiveDiscounts(): Promise<Discount[]>;
  createDiscount(discount: InsertDiscount): Promise<Discount>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalMedicines: number;
    lowStockItems: number;
    todaysSales: string;
    todaysPrescriptions: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medicines: Map<number, Medicine>;
  private categories: Map<number, Category>;
  private inventory: Map<number, Inventory>;
  private prescriptions: Map<number, Prescription>;
  private prescriptionItems: Map<number, PrescriptionItem>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem>;
  private discounts: Map<number, Discount>;
  private currentUserId: number;
  private currentMedicineId: number;
  private currentCategoryId: number;
  private currentInventoryId: number;
  private currentPrescriptionId: number;
  private currentPrescriptionItemId: number;
  private currentSaleId: number;
  private currentSaleItemId: number;
  private currentDiscountId: number;

  constructor() {
    this.users = new Map();
    this.medicines = new Map();
    this.categories = new Map();
    this.inventory = new Map();
    this.prescriptions = new Map();
    this.prescriptionItems = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.discounts = new Map();
    this.currentUserId = 1;
    this.currentMedicineId = 1;
    this.currentCategoryId = 1;
    this.currentInventoryId = 1;
    this.currentPrescriptionId = 1;
    this.currentPrescriptionItemId = 1;
    this.currentSaleId = 1;
    this.currentSaleItemId = 1;
    this.currentDiscountId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create categories
    const categories = [
      { name: "Pain Relief", description: "Medications for pain management" },
      { name: "Antibiotic", description: "Antibacterial medications" },
      { name: "Supplement", description: "Vitamins and supplements" },
      { name: "Cardiovascular", description: "Heart and circulation medications" },
    ];

    categories.forEach(cat => this.createCategory(cat));

    // Create users
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123",
      email: "admin@longchau.com",
      fullName: "System Administrator",
      role: "manager",
      phone: "+84901234567",
      address: "Long Chau Head Office",
    };

    const pharmacistUser: InsertUser = {
      username: "pharmacist1",
      password: "pharm123",
      email: "pharmacist@longchau.com",
      fullName: "Dr. Le Minh",
      role: "pharmacist",
      phone: "+84901234568",
      address: "Long Chau Pharmacy Branch 1",
    };

    this.createUser(adminUser);
    this.createUser(pharmacistUser);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      createdAt: new Date(),
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      phone: insertUser.phone ?? null,
      address: insertUser.address ?? null,
      role: insertUser.role ?? "customer",
      isActive: insertUser.isActive ?? true
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllCustomers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "customer");
  }

  async getAllPharmacists(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "pharmacist");
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      id,
      description: insertCategory.description ?? null, 
    };
    this.categories.set(id, category);
    return category;
  }
  // Medicine operations
  async getAllMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values()).filter(med => med.isActive);
  }

  async getMedicine(id: number): Promise<Medicine | undefined> {
    return this.medicines.get(id);
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const id = this.currentMedicineId++;
    const medicine: Medicine = {
      id,
      createdAt: new Date(),
      name: insertMedicine.name,
      sku: insertMedicine.sku,
      categoryId: insertMedicine.categoryId ?? null,
      description: insertMedicine.description ?? null,
      dosage: insertMedicine.dosage ?? null,
      manufacturer: insertMedicine.manufacturer ?? null,
      price: insertMedicine.price,
      requiresPrescription: insertMedicine.requiresPrescription ?? false,
      isActive: insertMedicine.isActive ?? true
    };
    this.medicines.set(id, medicine);
    return medicine;
  }

  async updateMedicine(id: number, updateData: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const medicine = this.medicines.get(id);
    if (!medicine) return undefined;

    const updatedMedicine = { ...medicine, ...updateData };
    this.medicines.set(id, updatedMedicine);
    return updatedMedicine;
  }

  async deleteMedicine(id: number): Promise<boolean> {
    const medicine = this.medicines.get(id);
    if (!medicine) return false;

    medicine.isActive = false;
    this.medicines.set(id, medicine);
    return true;
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async getInventoryByMedicine(medicineId: number): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.medicineId === medicineId);
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const id = this.currentInventoryId++;
    const inventory: Inventory = {
      id,
      createdAt: new Date(),
      medicineId: insertInventory.medicineId,
      batchNumber: insertInventory.batchNumber,
      quantity: insertInventory.quantity,
      minStockLevel: insertInventory.minStockLevel ?? 10,
      expiryDate: insertInventory.expiryDate,
      costPrice: insertInventory.costPrice
    };
    this.inventory.set(id, inventory);
    return inventory;
  }

  async updateInventory(id: number, updateData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const inventory = this.inventory.get(id);
    if (!inventory) return undefined;

    const updatedInventory = { ...inventory, ...updateData };
    this.inventory.set(id, updatedInventory);
    return updatedInventory;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.quantity <= inv.minStockLevel);
  }

  // Prescription operations
  async getAllPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.currentPrescriptionId++;
    const prescription: Prescription = {
      id,
      createdAt: new Date(),
      customerId: insertPrescription.customerId,
      pharmacistId: insertPrescription.pharmacistId ?? null,
      prescriptionNumber: insertPrescription.prescriptionNumber,
      doctorName: insertPrescription.doctorName,
      status: insertPrescription.status ?? "pending",
      notes: insertPrescription.notes ?? null,
      issuedDate: insertPrescription.issuedDate,
      verifiedAt: null,
      dispensedAt: null
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: number, updateData: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return undefined;

    const updatedPrescription = { ...prescription, ...updateData };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }

  async getPrescriptionsByCustomer(customerId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.customerId === customerId);
  }

  // Prescription item operations
  async getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]> {
    return Array.from(this.prescriptionItems.values()).filter(item => item.prescriptionId === prescriptionId);
  }

  async createPrescriptionItem(insertItem: InsertPrescriptionItem): Promise<PrescriptionItem> {
    const id = this.currentPrescriptionItemId++;
    const item: PrescriptionItem = {
      ...insertItem,
      id,
      dispensedQuantity: insertItem.dispensedQuantity ?? 0, 
    };
    this.prescriptionItems.set(id, item);
    return item;
  }

  // Sale operations
  async getAllSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = {
      id,
      createdAt: new Date(),
      customerId: insertSale.customerId ?? null,
      pharmacistId: insertSale.pharmacistId,
      prescriptionId: insertSale.prescriptionId ?? null,
      saleNumber: insertSale.saleNumber,
      subtotal: insertSale.subtotal,
      discountAmount: insertSale.discountAmount ?? "0",
      taxAmount: insertSale.taxAmount ?? "0",
      totalAmount: insertSale.totalAmount,
      paymentMethod: insertSale.paymentMethod,
      status: insertSale.status ?? "completed"
    };
    this.sales.set(id, sale);
    return sale;
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    const targetDate = new Date(date);
    return Array.from(this.sales.values()).filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === targetDate.toDateString();
    });
  }

  async getSalesByCustomer(customerId: number): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(sale => sale.customerId === customerId);
  }

  // Sale item operations
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return Array.from(this.saleItems.values()).filter(item => item.saleId === saleId);
  }

  async createSaleItem(insertItem: InsertSaleItem): Promise<SaleItem> {
    const id = this.currentSaleItemId++;
    const item: SaleItem = { ...insertItem, id };
    this.saleItems.set(id, item);
    return item;
  }

  // Discount operations
  async getAllDiscounts(): Promise<Discount[]> {
    return Array.from(this.discounts.values());
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return Array.from(this.discounts.values()).filter(discount =>
      discount.isActive &&
      new Date(discount.validFrom) <= now &&
      new Date(discount.validTo) >= now
    );
  }

  async createDiscount(insertDiscount: InsertDiscount): Promise<Discount> {
    const id = this.currentDiscountId++;
    const discount: Discount = {
      id,
      name: insertDiscount.name,
      type: insertDiscount.type,
      value: insertDiscount.value,
      applicableToMedicineId: insertDiscount.applicableToMedicineId ?? null,
      minOrderAmount: insertDiscount.minOrderAmount ?? null,
      maxDiscountAmount: insertDiscount.maxDiscountAmount ?? null,
      validFrom: insertDiscount.validFrom,
      validTo: insertDiscount.validTo,
      isActive: insertDiscount.isActive ?? true
    };
    this.discounts.set(id, discount);
    return discount;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalMedicines: number;
    lowStockItems: number;
    todaysSales: string;
    todaysPrescriptions: number;
  }> {
    const totalMedicines = Array.from(this.medicines.values()).filter(med => med.isActive).length;
    const lowStockItems = (await this.getLowStockItems()).length;

    const today = new Date().toISOString().split('T')[0];
    const todaysSales = await this.getSalesByDate(today);
    const todaysSalesAmount = todaysSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);

    const todaysPrescriptions = Array.from(this.prescriptions.values()).filter(p => {
      const prescDate = new Date(p.createdAt);
      return prescDate.toDateString() === new Date().toDateString();
    }).length;

    return {
      totalMedicines,
      lowStockItems,
      todaysSales: `$${todaysSalesAmount.toFixed(2)}`,
      todaysPrescriptions,
    };
  }
}

import { DatabaseStorage } from "./databaseStorage";

export const storage = new DatabaseStorage();
