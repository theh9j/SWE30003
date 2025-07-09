import {
  users,
  medicines,
  categories,
  inventory,
  prescriptions,
  prescriptionItems,
  sales,
  saleItems,
  discounts,
  type User,
  type InsertUser,
  type Medicine,
  type InsertMedicine,
  type Category,
  type InsertCategory,
  type Inventory,
  type InsertInventory,
  type Prescription,
  type InsertPrescription,
  type PrescriptionItem,
  type InsertPrescriptionItem,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type Discount,
  type InsertDiscount,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllCustomers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "customer"));
  }

  async getAllPharmacists(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "pharmacist"));
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Medicine operations
  async getAllMedicines(): Promise<Medicine[]> {
    return await db.select().from(medicines).orderBy(desc(medicines.createdAt));
  }

  async getMedicine(id: number): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine;
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const [medicine] = await db.insert(medicines).values(insertMedicine).returning();
    return medicine;
  }

  async updateMedicine(id: number, updateData: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const [medicine] = await db
      .update(medicines)
      .set(updateData)
      .where(eq(medicines.id, id))
      .returning();
    return medicine;
  }

  async deleteMedicine(id: number): Promise<boolean> {
    const result = await db.delete(medicines).where(eq(medicines.id, id));
    return result.rowCount > 0;
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(desc(inventory.createdAt));
  }

  async getInventoryByMedicine(medicineId: number): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.medicineId, medicineId));
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [inventoryItem] = await db.insert(inventory).values(insertInventory).returning();
    return inventoryItem;
  }

  async updateInventory(id: number, updateData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [inventoryItem] = await db
      .update(inventory)
      .set(updateData)
      .where(eq(inventory.id, id))
      .returning();
    return inventoryItem;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(sql`${inventory.quantity} <= ${inventory.minStockLevel}`);
  }

  // Prescription operations
  async getAllPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription;
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values(insertPrescription).returning();
    return prescription;
  }

  async updatePrescription(id: number, updateData: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [prescription] = await db
      .update(prescriptions)
      .set(updateData)
      .where(eq(prescriptions.id, id))
      .returning();
    return prescription;
  }

  async getPrescriptionsByCustomer(customerId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.customerId, customerId));
  }

  // Prescription item operations
  async getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]> {
    return await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, prescriptionId));
  }

  async createPrescriptionItem(insertItem: InsertPrescriptionItem): Promise<PrescriptionItem> {
    const [item] = await db.insert(prescriptionItems).values(insertItem).returning();
    return item;
  }

  // Sale operations
  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const [sale] = await db.insert(sales).values(insertSale).returning();
    return sale;
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    return await db
      .select()
      .from(sales)
      .where(
        and(
          sql`${sales.createdAt} >= ${startOfDay}`,
          sql`${sales.createdAt} < ${endOfDay}`
        )
      );
  }

  async getSalesByCustomer(customerId: number): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.customerId, customerId));
  }

  // Sale item operations
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async createSaleItem(insertItem: InsertSaleItem): Promise<SaleItem> {
    const [item] = await db.insert(saleItems).values(insertItem).returning();
    return item;
  }

  // Discount operations
  async getAllDiscounts(): Promise<Discount[]> {
    return await db.select().from(discounts).orderBy(desc(discounts.validFrom));
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return await db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.isActive, true),
          sql`${discounts.validFrom} <= ${now}`,
          sql`${discounts.validTo} >= ${now}`
        )
      );
  }

  async createDiscount(insertDiscount: InsertDiscount): Promise<Discount> {
    const [discount] = await db.insert(discounts).values(insertDiscount).returning();
    return discount;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalMedicines: number;
    lowStockItems: number;
    todaysSales: string;
    todaysPrescriptions: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Total medicines count
    const [{ count: totalMedicinesCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(medicines)
      .where(eq(medicines.isActive, true));

    // Low stock items count
    const [{ count: lowStockCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
      .where(sql`${inventory.quantity} <= ${inventory.minStockLevel}`);

    // Today's sales total
    const [{ total: todaysSalesTotal }] = await db
      .select({ total: sql<string>`COALESCE(SUM(${sales.totalAmount}), '0')` })
      .from(sales)
      .where(
        and(
          sql`${sales.createdAt} >= ${startOfDay}`,
          sql`${sales.createdAt} <= ${endOfDay}`
        )
      );

    // Today's prescriptions count
    const [{ count: todaysPrescriptionsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prescriptions)
      .where(
        and(
          sql`${prescriptions.createdAt} >= ${startOfDay}`,
          sql`${prescriptions.createdAt} <= ${endOfDay}`
        )
      );

    return {
      totalMedicines: totalMedicinesCount,
      lowStockItems: lowStockCount,
      todaysSales: todaysSalesTotal || "0",
      todaysPrescriptions: todaysPrescriptionsCount,
    };
  }
}