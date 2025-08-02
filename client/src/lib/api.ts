import { apiRequest } from "./queryClient";

const ensureArray = (data: any) => (Array.isArray(data) ? data : data?.data ?? []);

export async function fetchUsers() {
  const res = await fetch("/api/accounts", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function toggleAccountState(username: string) {
  const res = await fetch(`/api/accounts/${username}/state`, {
    method: "PUT",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to change account state");
  }
  return res.json();
}

export async function createPrescription(data: any) {
  const res = await fetch("/api/prescriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to create prescription");
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () =>
    fetch("/api/dashboard/stats", { credentials: "include" }).then(res => res.json()),

  // Users
  getUsers: async (role?: string) => {
    const res = await fetch(`/api/users${role ? "?role=" + role : ""}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },
  createUser: (userData: any) => apiRequest("POST", "/api/users", userData),
  getUser: (id: number) =>
    fetch(`/api/users/${id}`, { credentials: "include" }).then(res => res.json()),
  getMe: async () => {
    const res = await fetch(`/api/auth/me`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch current user");
    return res.json();
  },
  updateUserStatus: async (id: number, isActive: boolean) => {
    const res = await fetch(`/api/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update status");
    }
    return res.json();
  },
  updateUser: async (id: number, data: any) => {
    const res = await fetch(`/api/accounts/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to update user");
    }
    return res.json();
  },

  // Categories
  getCategories: () =>
    fetch("/api/categories", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),

  // Medicines
  getMedicines: () =>
    fetch("/api/medicines", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),

  createMedicine: async (medicineData: any) => {
    const res = await fetch("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(medicineData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to create medicine");
    }
    return res.json();
  },

  getMedicine: (id: number) =>
    fetch(`/api/medicines/${id}`, { credentials: "include" }).then(res => res.json()),

  updateMedicine: (id: number, medicineData: any) =>
    apiRequest("PUT", `/api/medicines/${id}`, medicineData),

  deleteMedicine: (id: number) =>
    apiRequest("DELETE", `/api/medicines/${id}`),

  // Inventory
  getInventory: () =>
    fetch("/api/inventory", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),

  getLowStockItems: () =>
    fetch("/api/inventory/low-stock", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),

  createInventory: async (inventoryData: any) => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(inventoryData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to create inventory");
    }
    return res.json();
  },

  // Prescriptions
  getPrescriptions: () =>
    fetch("/api/prescriptions", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),

  createPrescription: (prescriptionData: any) =>
    apiRequest("POST", "/api/prescriptions", prescriptionData),

  getPrescription: (id: number) =>
    fetch(`/api/prescriptions/${id}`, { credentials: "include" }).then(res => res.json()),

  updatePrescription: async (id: number, data: string) => {
    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to update prescription");
    }

    return res.json();
  },

  // Sales
  getSales: async () => {
    const res = await fetch("/api/sales", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch sales");
    const data = await res.json();
    return ensureArray(data);
  },

  deleteSale: async (saleId: number) => {
    const res = await fetch(`/api/sales/${saleId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to delete sale");
    }
  },

  createSale: async (data: any) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to create sale");
    }

    return res.json();
  },

  getSale: async (id: number) => {
    const res = await fetch(`/api/sales/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch sale");
    return res.json();
  },

  updateSale: async (id: number, status: string) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to update sale");
    }
    return res.json();
  },

  // Discounts
  getDiscounts: () =>
    fetch("/api/discounts", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),

  getActiveDiscounts: () =>
    fetch("/api/discounts/active", { credentials: "include" })
      .then(res => res.json())
      .then(ensureArray),
};
