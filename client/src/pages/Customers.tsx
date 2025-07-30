import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit2, Ban, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import AddCustomerModal from "@/components/modals/AddCustomerModal";
import TopBar from "@/components/layout/TopBar";
import { useToast } from "@/hooks/use-toast";
import EditCustomerModal from "../components/modals/EditCustomerModal";
import { toggleAccountState } from "../lib/api";

export default function Customers() {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["/api/users", "customer"],
    queryFn: () => api.getUsers("customer"),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ username }: { username: string }) =>
      toggleAccountState(username),
    onSuccess: () => {
      toast({ title: "Updated", description: "Account status updated." });
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filteredCustomers = customers?.filter((c: any) =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setShowEditCustomer(true);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Customer Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setShowAddCustomer(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                      <div className="text-sm text-gray-500">ID: {customer.username}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      <div>{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone || "—"}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">
                      {customer.address || "No address"}
                    </td>
                    <td className="py-4 text-sm text-gray-900">{formatDate(customer.createdAt)}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {customer.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => suspendMutation.mutate({ username: customer.username })}
                          title={customer.isActive ? "Suspend" : "Unsuspend"}
                        >
                          {customer.isActive ? (
                            <Ban className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found
            </div>
          )}
        </CardContent>
      </Card>

      <AddCustomerModal open={showAddCustomer} onOpenChange={setShowAddCustomer} />
      <EditCustomerModal
        open={showEditCustomer}
        onOpenChange={setShowEditCustomer}
        customer={editingCustomer}
        onSaved={() => {
          refetch();
          setShowEditCustomer(false);
        }}
      />
    </div>
  );
}
