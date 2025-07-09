import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingCategories = await storage.getAllCategories();
    if (existingCategories.length > 0) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create categories
    const painReliefCategory = await storage.createCategory({
      name: "Pain Relief",
      description: "Medications for pain management",
    });

    const antibioticsCategory = await storage.createCategory({
      name: "Antibiotics",
      description: "Medications for bacterial infections",
    });

    const vitaminsCategory = await storage.createCategory({
      name: "Vitamins & Supplements",
      description: "Nutritional supplements and vitamins",
    });

    const coldFluCategory = await storage.createCategory({
      name: "Cold & Flu",
      description: "Medications for cold and flu symptoms",
    });

    // Create sample medicines
    const medicines = [
      {
        name: "Paracetamol 500mg",
        sku: "MED001",
        categoryId: painReliefCategory.id,
        description: "Pain reliever and fever reducer",
        dosage: "500mg",
        manufacturer: "Generic Pharma",
        price: "25000",
        requiresPrescription: false,
      },
      {
        name: "Ibuprofen 400mg",
        sku: "MED002",
        categoryId: painReliefCategory.id,
        description: "Anti-inflammatory pain reliever",
        dosage: "400mg",
        manufacturer: "Generic Pharma",
        price: "35000",
        requiresPrescription: false,
      },
      {
        name: "Amoxicillin 500mg",
        sku: "MED003",
        categoryId: antibioticsCategory.id,
        description: "Broad-spectrum antibiotic",
        dosage: "500mg",
        manufacturer: "BioPharma",
        price: "120000",
        requiresPrescription: true,
      },
      {
        name: "Vitamin C 1000mg",
        sku: "MED004",
        categoryId: vitaminsCategory.id,
        description: "Immune system support",
        dosage: "1000mg",
        manufacturer: "VitaHealth",
        price: "45000",
        requiresPrescription: false,
      },
      {
        name: "Cough Syrup",
        sku: "MED005",
        categoryId: coldFluCategory.id,
        description: "Relief for dry and productive cough",
        dosage: "5ml",
        manufacturer: "MediCare",
        price: "65000",
        requiresPrescription: false,
      },
    ];

    for (const medicineData of medicines) {
      const medicine = await storage.createMedicine(medicineData);
      
      // Create inventory for each medicine
      await storage.createInventory({
        medicineId: medicine.id,
        batchNumber: `BATCH${medicine.id}001`,
        quantity: Math.floor(Math.random() * 100) + 50, // Random quantity between 50-150
        minStockLevel: 20,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        costPrice: (parseFloat(medicineData.price) * 0.7).toString(), // 70% of selling price
      });
    }

    // Create a sample pharmacist user
    await storage.createUser({
      username: "pharmacist1",
      password: "pharm123",
      email: "pharmacist@longchau.com",
      fullName: "Dr. Nguyen Van A",
      phone: "+84123456789",
      address: "123 Pharmacy Street, Ho Chi Minh City",
      role: "pharmacist",
    });

    // Create a sample customer
    await storage.createUser({
      username: "customer1", 
      password: "cust123",
      email: "customer@example.com",
      fullName: "Tran Thi B",
      phone: "+84987654321",
      address: "456 Customer Street, Ho Chi Minh City",
      role: "customer",
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}