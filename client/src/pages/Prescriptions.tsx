import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddPrescriptionModal from "@/components/modals/AddPrescriptionModal";
import TopBar from "@/components/layout/TopBar";

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "status-badge-pending";
      case "verified":
        return "status-badge-verified";
      case "dispensed":
        return "status-badge-dispensed";
      case "rejected":
        return "status-badge-rejected";
      default:
        return "status-badge-pending";
    }
  };

  const getCustomerName = (customerId: number) => {
    if (!customers) return "Unknown";
    const customer = customers.find((c: any) => c.id === customerId);
    return customer?.fullName || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredPrescriptions = prescriptions?.filter((prescription: any) =>
    prescription.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(prescription.customerId).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleVerify = (id: number) => {
    updatePrescriptionMutation.mutate({
      id,
      data: { status: "verified", verifiedAt: new Date().toISOString() }
    });
  };

  const handleReject = (id: number) => {
    updatePrescriptionMutation.mutate({
      id,
      data: { status: "rejected" }
    });
  };

  const handleDispense = (id: number) => {
    updatePrescriptionMutation.mutate({
      id,
      data: { status: "dispensed", dispensedAt: new Date().toISOString() }
    });
  };

  if (isLoading) {
    return (
      <div>
        <TopBar title="Prescriptions" subtitle="Manage prescription verification and dispensing" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading prescriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Prescriptions" subtitle="Manage prescription verification and dispensing" />
      
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
                    Doctor
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
                {filteredPrescriptions.map((prescription: any) => (
                  <tr key={prescription.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.prescriptionNumber}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {getCustomerName(prescription.customerId)}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {prescription.doctorName}
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {formatDate(prescription.issuedDate)}
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusBadgeClass(prescription.status)}>
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {prescription.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleVerify(prescription.id)}
                              disabled={updatePrescriptionMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReject(prescription.id)}
                              disabled={updatePrescriptionMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {prescription.status === "verified" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDispense(prescription.id)}
                            disabled={updatePrescriptionMutation.isPending}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Dispense
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
            <div className="text-center py-8">
              <p className="text-gray-500">No prescriptions found</p>
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
