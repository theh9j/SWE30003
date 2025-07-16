import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - represents customers, pharmacists, and managers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  role: text("role").notNull().default("customer"), // customer, pharmacist, manager
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medicine categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Medicines/Products
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description"),
  dosage: text("dosage"),
  manufacturer: text("manufacturer"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  requiresPrescription: boolean("requires_prescription").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory tracking
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull(),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  expiryDate: timestamp("expiry_date").notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  pharmacistId: integer("pharmacist_id").references(() => users.id),
  prescriptionNumber: text("prescription_number").notNull().unique(),
  doctorName: text("doctor_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, verified, dispensed, rejected
  notes: text("notes"),
  issuedDate: timestamp("issued_date").notNull(),
  verifiedAt: timestamp("verified_at"),
  dispensedAt: timestamp("dispensed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prescription items
export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id).notNull(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  quantity: integer("quantity").notNull(),
  dosageInstructions: text("dosage_instructions").notNull(),
  dispensedQuantity: integer("dispensed_quantity").default(0),
});

// Sales transactions
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  pharmacistId: integer("pharmacist_id").references(() => users.id).notNull(),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
  saleNumber: text("sale_number").notNull().unique(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, insurance
  status: text("status").notNull().default("completed"), // pending, completed, refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sale items
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  inventoryId: integer("inventory_id").references(() => inventory.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Discounts
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // percentage, fixed
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  applicableToMedicineId: integer("applicable_to_medicine_id").references(() => medicines.id),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
  dispensedAt: true,
});

export const insertPrescriptionItemSchema = createInsertSchema(prescriptionItems).omit({
  id: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

export const insertDiscountSchema = createInsertSchema(discounts).omit({
  id: true,
});

// Infer types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type InsertPrescriptionItem = z.infer<typeof insertPrescriptionItemSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
