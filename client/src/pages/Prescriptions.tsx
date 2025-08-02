import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddPrescriptionModal from "@/components/modals/AddPrescriptionModal";

export default function Prescriptions() {
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.getMe(),
  });

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
    switch (status.toLowerCase()) {
      case "discard":
        return "bg-red-100 text-red-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCustomerName = (customerUsername: string) => {
    if (!customers) return "Unknown";
    const customer = customers.find((c: any) => c.username === customerUsername);
    return customer?.fullName || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredPrescriptions = prescriptions?.filter((prescription: any) => {
    const number = prescription.prescriptionNumber?.toLowerCase() || "";
    const doctor = prescription.doctorName?.toLowerCase() || "";
    const customer = getCustomerName(prescription.customerId)?.toLowerCase() || "";
    const query = searchTerm.toLowerCase();

    return (
      number.includes(query) ||
      doctor.includes(query) ||
      customer.includes(query)
    );
  }) || [];

  const handleReject = (id: number) => {
    updatePrescriptionMutation.mutate({
      id,
      data: { status: "Discard" },
    });
  };

  const handleApprove = (id: number) => {
    updatePrescriptionMutation.mutate({
      id,
      data: { status: "Approved" },
    });
  };

  // Pharmacist notification for new active prescriptions
  useEffect(() => {
    if (user?.role !== "pharmacist") return;

    const newPrescriptions = prescriptions?.filter((p: any) =>
      ["approved", "pending"].includes(p.status?.toLowerCase())
    );

    if (newPrescriptions?.length > 0) {
      toast({
        title: "New Prescription Alert",
        description: `You have ${newPrescriptions.length} prescription(s) needing attention.`,
      });
    }
  }, [prescriptions, user]);

  // Customer notification for approved prescriptions
  useEffect(() => {
    if (user?.role !== "customer") return;

    const approvedPrescriptions = prescriptions?.filter(
      (p: any) =>
        p.customerId === user.username &&
        p.status?.toLowerCase() === "approved"
    );

    if (approvedPrescriptions?.length > 0) {
      toast({
        title: "Prescription Approved",
        description: `Your prescription ${approvedPrescriptions[0].prescriptionNumber} has been approved.`,
      });
    }
  }, [prescriptions, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

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
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Prescription #</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Issued Date</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                        {prescription.status === "Discard"
                          ? "Expired"
                          : prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        {prescription.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(prescription.id)}
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
