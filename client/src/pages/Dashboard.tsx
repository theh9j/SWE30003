import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  AlertTriangle,
  DollarSign,
  FileText,
  Plus,
  ShoppingCart,
  UserPlus,
  BarChart3
} from "lucide-react";
import { api } from "@/lib/api";
import AddMedicineModal from "@/components/modals/AddMedicineModal";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import ProcessSaleModal from "@/components/modals/ProcessSaleModal";
import { useState } from "react";

export default function Dashboard() {
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showProcessSale, setShowProcessSale] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.getDashboardStats,
  });

  const { data: medicines, isLoading: medicinesLoading } = useQuery({
    queryKey: ["/api/medicines"],
    queryFn: api.getMedicines,
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: api.getInventory,
  });

  // Mock recent activities
  const recentActivities = [
    {
      type: "sale",
      message: "Sale completed for Nguyen Van A",
      time: "2 minutes ago",
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
    },
    {
      type: "warning",
      message: "Low stock alert: Amoxicillin",
      time: "15 minutes ago",
      icon: AlertTriangle,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      type: "prescription",
      message: "New prescription verified",
      time: "1 hour ago",
      icon: FileText,
      color: "text-green-600 bg-green-50",
    },
  ];

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { label: "Out of Stock", class: "status-badge-out-of-stock" };
    if (quantity <= minLevel) return { label: "Low Stock", class: "status-badge-low-stock" };
    return { label: "In Stock", class: "status-badge-in-stock" };
  };

  const getMedicineWithInventory = () => {
    const medicineArray = Array.isArray(medicines)
      ? medicines
      : Array.isArray(medicines?.data)
        ? medicines.data
        : [];

    const inventoryArray = Array.isArray(inventory)
      ? inventory
      : Array.isArray(inventory?.data)
        ? inventory.data
        : [];

    return medicineArray.slice(0, 3).map((medicine: any) => {
      const medicineInventory = inventoryArray.find((inv: any) => inv.medicineId === medicine.id);
      const quantity = medicineInventory?.quantity || 0;
      const minLevel = medicineInventory?.minStockLevel || 10;
      const status = getStockStatus(quantity, minLevel);

      return {
        ...medicine,
        quantity,
        status: status.label,
        statusClass: status.class,
      };
    });
  };

  if (statsLoading || medicinesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Pill className="text-blue-600 h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Medicines</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalMedicines || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-yellow-600 h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.lowStockItems || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600 h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.todaysSales || "$"+stats?.totalRevenue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-green-600 h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Prescriptions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalPrescriptions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Overview</CardTitle>
            <Button variant="link" className="text-blue-600 p-0">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getMedicineWithInventory().map((medicine: any) => (
                    <tr key={medicine.id}>
                      <td className="py-4">
                        <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                        <div className="text-sm text-gray-500">SKU: {medicine.sku}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {medicine.categoryId === 1 ? "Pain Relief" :
                          medicine.categoryId === 2 ? "Antibiotic" :
                            medicine.categoryId === 3 ? "Supplement" : "Other"}
                      </td>
                      <td className="py-4 text-sm text-gray-900">{medicine.quantity} units</td>
                      <td className="py-4">
                        <Badge className={medicine.statusClass}>
                          {medicine.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 justify-start hover:shadow-md"
          onClick={() => setShowAddMedicine(true)}
        >
          <div className="flex items-center w-full">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="text-blue-600 h-5 w-5" />
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Add Medicine</p>
              <p className="text-xs text-gray-500">Add new inventory</p>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 justify-start hover:shadow-md"
          onClick={() => setShowProcessSale(true)}
        >
          <div className="flex items-center w-full">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-green-600 h-5 w-5" />
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">New Sale</p>
              <p className="text-xs text-gray-500">Process sale</p>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 justify-start hover:shadow-md"
          onClick={() => setShowAddCustomer(true)}
        >
          <div className="flex items-center w-full">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserPlus className="text-orange-600 h-5 w-5" />
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Add Customer</p>
              <p className="text-xs text-gray-500">Register customer</p>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 justify-start hover:shadow-md"
        >
          <div className="flex items-center w-full">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-green-600 h-5 w-5" />
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-900">Generate Report</p>
              <p className="text-xs text-gray-500">View analytics</p>
            </div>
          </div>
        </Button>
      </div>

      {/* Modals */}
      <AddMedicineModal
        open={showAddMedicine}
        onOpenChange={setShowAddMedicine}
      />
      <AddCustomerModal
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
      />
      <ProcessSaleModal
        open={showProcessSale}
        onOpenChange={setShowProcessSale}
      />
    </div>
  );
}
