

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EditCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  onSaved: () => void;
}

export default function EditCustomerModal({
  open,
  onOpenChange,
  customer,
  onSaved,
}: EditCustomerModalProps) {
  const [form, setForm] = useState({
    fullName: customer?.fullName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (customer) {
      setForm({
        fullName: customer.fullName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: async () => {
      return api.updateUser(customer.id, form);
    },
    onSuccess: () => {
      toast({ title: "Customer updated successfully" });
      onSaved();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer", variant: "destructive" });
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
            <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !form.fullName.trim() ||
              !form.email.trim()
            }
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
