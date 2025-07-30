import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddPrescriptionModal from "@/components/modals/AddPrescriptionModal";

export default function Prescriptions() {
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["/api/prescriptions"],
    queryFn: api.getPrescriptions,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/users", "customer"],
    queryFn: () => api.getUsers("customer"),
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updatePrescription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Success",
        description: "Prescription updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prescription",
        variant: "destructive",
      });
    },
  });

  const getCustomerName = (username: string) => {
    const user = customers?.find((u: any) => u.username === username);
    return user?.fullName || "Unknown";
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  const filteredPrescriptions = prescriptions?.filter((p: any) => {
    const query = searchTerm.toLowerCase();
    return (
      p.prescriptionNumber?.toLowerCase().includes(query) ||
      getCustomerName(p.customer_id)?.toLowerCase().includes(query) ||
      p.pharmacist_name?.toLowerCase().includes(query)
    );
  }) || [];

  const handleReject = (id: number) => {
    updatePrescriptionMutation.mutate({
      id,
      data: { status: "rejected" }
    });
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Prescription Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setShowAddPrescription(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Prescription
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
                    Prescription #
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacist
                  </th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
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
                {filteredPrescriptions.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-4 text-sm font-medium text-gray-900">
                      {p.prescriptionNumber}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {getCustomerName(p.customer_id)}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {p.pharmacist_name}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {formatDate(p.issued_date)}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        p.status === "active"
                          ? "bg-green-100 text-green-800"
                          : p.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {p.status === "rejected" ? "Expired" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        {p.status === "active" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReject(p.id)}
                            disabled={updatePrescriptionMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPrescriptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No prescriptions found
            </div>
          )}
        </CardContent>
      </Card>

      <AddPrescriptionModal
        open={showAddPrescription}
        onOpenChange={setShowAddPrescription}
      />
    </div>
  );
}
