import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import ProcessSaleModal from "@/components/modals/ProcessSaleModal";
import TopBar from "@/components/layout/TopBar";

export default function Sales() {
  const [showProcessSale, setShowProcessSale] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sales, isLoading } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSales,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/users", "customer"],
    queryFn: () => api.getUsers("customer"),
  });

  const { data: pharmacists } = useQuery({
    queryKey: ["/api/users", "pharmacist"],
    queryFn: () => api.getUsers("pharmacist"),
  });

  const getCustomerName = (customerId: number | null) => {
    if (!customerId || !customers) return "Walk-in Customer";
    const customer = customers.find((c: any) => c.id === customerId);
    return customer?.fullName || "Unknown";
  };

  const getPharmacistName = (pharmacistId: number) => {
    if (!pharmacists) return "Unknown";
    const pharmacist = pharmacists.find((p: any) => p.id === pharmacistId);
    return pharmacist?.fullName || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteSale = async (saleId: number) => {

    try {
      await api.deleteSale(saleId);
      window.location.reload(); // OR trigger a query refetch if using React Query
    } catch (err: any) {
      alert(err.message || "Failed to delete sale.");
    }
  };

  const filteredSales = sales?.filter((sale: any) =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(sale.customerId).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading sales...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>     
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Sales Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setShowProcessSale(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Sale
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
                    Sale #
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacist
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {filteredSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.saleNumber}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {getCustomerName(sale.customerId)}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {getPharmacistName(sale.pharmacistId)}
                    </td>
                    <td className="py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${parseFloat(sale.totalAmount).toFixed(2)}
                      </div>
                      {parseFloat(sale.discountAmount) > 0 && (
                        <div className="text-xs text-green-600">
                          Discount: -${parseFloat(sale.discountAmount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-sm text-gray-900 capitalize">
                      {sale.paymentMethod}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(sale.status)}`}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSale(sale.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? "No sales found matching your search" : "No sales recorded yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProcessSaleModal
        open={showProcessSale}
        onOpenChange={setShowProcessSale}
      />
    </div>
  );
}
