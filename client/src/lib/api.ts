import { apiRequest } from "./queryClient";

export const api = {
  // Dashboard
  getDashboardStats: () => fetch("/api/dashboard/stats").then(res => res.json()),

  // Users
  getUsers: (role?: string) => {
    const params = role ? `?role=${role}` : "";
    return fetch(`/api/users${params}`).then(res => res.json());
  },
  createUser: (userData: any) => apiRequest("POST", "/api/users", userData),
  getUser: (id: number) => fetch(`/api/users/${id}`).then(res => res.json()),

  // Categories
  getCategories: () => fetch("/api/categories").then(res => res.json()),

  // Medicines
  getMedicines: () => fetch("/api/medicines").then(res => res.json()),
  createMedicine: (medicineData: any) => apiRequest("POST", "/api/medicines", medicineData),
  getMedicine: (id: number) => fetch(`/api/medicines/${id}`).then(res => res.json()),
  updateMedicine: (id: number, medicineData: any) => apiRequest("PUT", `/api/medicines/${id}`, medicineData),
  deleteMedicine: (id: number) => apiRequest("DELETE", `/api/medicines/${id}`),

  // Inventory
  getInventory: () => fetch("/api/inventory").then(res => res.json()),
  getLowStockItems: () => fetch("/api/inventory/low-stock").then(res => res.json()),
  createInventory: (inventoryData: any) => apiRequest("POST", "/api/inventory", inventoryData),

  // Prescriptions
  getPrescriptions: () => fetch("/api/prescriptions").then(res => res.json()),
  createPrescription: (prescriptionData: any) => apiRequest("POST", "/api/prescriptions", prescriptionData),
  getPrescription: (id: number) => fetch(`/api/prescriptions/${id}`).then(res => res.json()),
  updatePrescription: (id: number, prescriptionData: any) => apiRequest("PUT", `/api/prescriptions/${id}`, prescriptionData),

  // Sales
  getSales: () => fetch("/api/sales").then(res => res.json()),
  createSale: (saleData: any) => apiRequest("POST", "/api/sales", saleData),
  getSale: (id: number) => fetch(`/api/sales/${id}`).then(res => res.json()),

  // Discounts
  getDiscounts: () => fetch("/api/discounts").then(res => res.json()),
  getActiveDiscounts: () => fetch("/api/discounts/active").then(res => res.json()),
};
