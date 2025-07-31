import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

// only validate customerId, pharmacistId and paymentMethod here
const saleSchema = z.object({
  customerId: z.number().optional(),
  pharmacistId: z.number().min(1, "Pharmacist is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});
type SaleFormData = z.infer<typeof saleSchema>;

type SaleItem = {
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

interface ProcessSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProcessSaleModal({
  open,
  onOpenChange,
}: ProcessSaleModalProps) {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const { data: customers } = useQuery({
    queryKey: ["/api/users", "customer"],
    queryFn: () => api.getUsers("customer"),
  });
  const { data: pharmacists } = useQuery({
    queryKey: ["/api/users", "pharmacist"],
    queryFn: () => api.getUsers("pharmacist"),
  });
  const { data: medicines } = useQuery({
    queryKey: ["/api/medicines"],
    queryFn: api.getMedicines,
  });

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: undefined,
      pharmacistId: 0,
      paymentMethod: "",
    },
  });

  const createSale = useMutation({
    mutationFn: (payload: any) => api.createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Sale processed successfully" });
      handleClose();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to process sale",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    if (!selectedMedicineId) {
      toast({ title: "No Medicine", description: "Select one first", variant: "destructive" });
      return;
    }
    const med = medicines?.find((m: any) => m.id === selectedMedicineId);
    if (!med) return;
    if (quantity < 1) {
      toast({ title: "Invalid Qty", description: "Must be ≥ 1", variant: "destructive" });
      return;
    }

    const idx = saleItems.findIndex((i) => i.medicineId === selectedMedicineId);
    if (idx >= 0) {
      const copy = [...saleItems];
      copy[idx].quantity += quantity;
      copy[idx].totalPrice = copy[idx].quantity * copy[idx].unitPrice;
      setSaleItems(copy);
    } else {
      setSaleItems([
        ...saleItems,
        {
          medicineId: med.id,
          medicineName: med.name,
          unitPrice: parseFloat(med.price),
          quantity,
          totalPrice: quantity * parseFloat(med.price),
        },
      ]);
    }

    setSelectedMedicineId(0);
    setQuantity(1);
  };

  const removeItem = (medicineId: number) =>
    setSaleItems(saleItems.filter((i) => i.medicineId !== medicineId));

  const getTotal = () => saleItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const handleClose = () => {
    form.reset();
    setSaleItems([]);
    setSelectedMedicineId(0);
    setQuantity(1);
    onOpenChange(false);
  };

  const onSubmit = (data: SaleFormData) => {
    if (saleItems.length === 0) {
      toast({ title: "No Items", description: "Add at least one item", variant: "destructive" });
      return;
    }

    const saleNumber = `SALE-${Date.now().toString().slice(-6)}`;
    const subtotal = getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    createSale.mutate({
      ...data,
      saleNumber,
      items: saleItems.map((it) => ({
        medicineId: it.medicineId,
        quantity: it.quantity,
      })),
      subtotal: subtotal.toString(),
      discountAmount: "0",
      taxAmount: tax.toString(),
      totalAmount: total.toString(),
      status: "completed",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer & Pharmacist */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <Select
                onValueChange={(v) =>
                  form.setValue("customerId", v ? parseInt(v) : undefined)
                }
                value={form.watch("customerId")?.toString() || "0"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Walk-in or select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Walk-in Customer</SelectItem>
                  {customers?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pharmacist *</Label>
              <Select
                onValueChange={(v) => form.setValue("pharmacistId", parseInt(v))}
                value={form.watch("pharmacistId").toString()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select</SelectItem>
                  {pharmacists?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.pharmacistId && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.pharmacistId.message}
                </p>
              )}
            </div>
          </div>

          {/* Add Items */}
          <Card>
            <CardContent>
              <h3 className="font-semibold mb-3">Add Items</h3>
              <div className="flex gap-2 items-end">
                <Select
                  onValueChange={(v) => setSelectedMedicineId(parseInt(v))}
                  value={selectedMedicineId.toString()}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <Button type="button" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sale Items List */}
          {saleItems.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-semibold mb-3">Sale Items</h3>
                {saleItems.map((it) => (
                  <div
                    key={it.medicineId}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div>
                      <div className="font-medium">{it.medicineName}</div>
                      <div className="text-sm text-gray-500">
                        {it.quantity} × ${it.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        ${it.totalPrice.toFixed(2)}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(it.medicineId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-right space-y-1">
                  <div>
                    <span>Subtotal:</span>{" "}
                    <span className="font-medium">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <span>Tax (10%):</span>{" "}
                    <span>${(getTotal() * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="font-semibold">
                    <span>Total:</span>{" "}
                    <span>${(getTotal() * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select
              onValueChange={(v) => form.setValue("paymentMethod", v)}
              value={form.watch("paymentMethod")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.paymentMethod && (
              <p className="text-sm text-red-600">
                {form.formState.errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSale.status === "pending"}
            >
              {createSale.status === "pending"
                ? "Processing..."
                : "Process Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
