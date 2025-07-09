import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddMedicineModal from "@/components/modals/AddMedicineModal";
import TopBar from "@/components/layout/TopBar";

export default function Inventory() {
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["/api/medicines"],
    queryFn: api.getMedicines,
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: api.getInventory,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.getCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { label: "Out of Stock", class: "status-badge-out-of-stock" };
    if (quantity <= minLevel) return { label: "Low Stock", class: "status-badge-low-stock" };
    return { label: "In Stock", class: "status-badge-in-stock" };
  };

  const getCategoryName = (categoryId: number) => {
    if (!categories) return "Unknown";
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  const getMedicinesWithInventory = () => {
    if (!medicines || !inventory) return [];
    
    return medicines.map((medicine: any) => {
      const medicineInventory = inventory.find((inv: any) => inv.medicineId === medicine.id);
      const quantity = medicineInventory?.quantity || 0;
      const minLevel = medicineInventory?.minStockLevel || 10;
      const status = getStockStatus(quantity, minLevel);
      
      return {
        ...medicine,
        quantity,
        minLevel,
        status: status.label,
        statusClass: status.class,
        categoryName: getCategoryName(medicine.categoryId),
        batchNumber: medicineInventory?.batchNumber || "N/A",
        expiryDate: medicineInventory?.expiryDate || null,
      };
    }).filter((medicine: any) => 
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div>
        <TopBar title="Inventory" subtitle="Manage your medicine stock and inventory" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Inventory" subtitle="Manage your medicine stock and inventory" />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Medicine Inventory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setShowAddMedicine(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </div>
          </div>
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
                    Batch
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getMedicinesWithInventory().map((medicine: any) => (
                  <tr key={medicine.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                      <div className="text-sm text-gray-500">SKU: {medicine.sku}</div>
                      {medicine.dosage && (
                        <div className="text-xs text-gray-400">{medicine.dosage}</div>
                      )}
                    </td>
                    <td className="py-4 text-sm text-gray-900">{medicine.categoryName}</td>
                    <td className="py-4">
                      <div className="text-sm text-gray-900">{medicine.quantity} units</div>
                      <div className="text-xs text-gray-500">Min: {medicine.minLevel}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">{medicine.batchNumber}</td>
                    <td className="py-4 text-sm text-gray-900">{formatDate(medicine.expiryDate)}</td>
                    <td className="py-4 text-sm text-gray-900">${medicine.price}</td>
                    <td className="py-4">
                      <Badge className={medicine.statusClass}>
                        {medicine.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(medicine.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {getMedicinesWithInventory().length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No medicines found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddMedicineModal
        open={showAddMedicine}
        onOpenChange={setShowAddMedicine}
      />
    </div>
  );
}
