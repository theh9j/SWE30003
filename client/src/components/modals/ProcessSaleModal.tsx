import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

const saleItemSchema = z.object({
  medicineId: z.number().min(1, "Medicine is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const saleSchema = z.object({
  customerId: z.number().optional(),
  pharmacistId: z.number().min(1, "Pharmacist is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
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

export default function ProcessSaleModal({ open, onOpenChange }: ProcessSaleModalProps) {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
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
      items: [],
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: any) => api.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Sale processed successfully",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process sale",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    if (selectedMedicineId === 0 || quantity < 1) {
      toast({
        title: "Invalid Item",
        description: "Please select a medicine and enter valid quantity",
        variant: "destructive",
      });
      return;
    }

    const medicine = medicines?.find((m: any) => m.id === selectedMedicineId);
    if (!medicine) return;

    const existingItemIndex = saleItems.findIndex(item => item.medicineId === selectedMedicineId);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setSaleItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        medicineId: selectedMedicineId,
        medicineName: medicine.name,
        quantity,
        unitPrice: parseFloat(medicine.price),
        totalPrice: quantity * parseFloat(medicine.price),
      };
      setSaleItems([...saleItems, newItem]);
    }

    setSelectedMedicineId(0);
    setQuantity(1);
  };

  const removeItem = (medicineId: number) => {
    setSaleItems(saleItems.filter(item => item.medicineId !== medicineId));
  };

  const getTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const onSubmit = (data: SaleFormData) => {
    if (saleItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }

    const saleNumber = `SALE-${Date.now().toString().slice(-6)}`;
    const subtotal = getTotal();
    const taxAmount = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + taxAmount;

    const saleData = {
      ...data,
      saleNumber,
      subtotal: subtotal.toString(),
      discountAmount: "0",
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      status: "completed",
    };

    createSaleMutation.mutate(saleData);
  };

  const handleClose = () => {
    form.reset();
    setSaleItems([]);
    setSelectedMedicineId(0);
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process New Sale</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer (Optional)</Label>
              <Select 
                onValueChange={(value) => form.setValue("customerId", value ? parseInt(value) : undefined)}
                value={form.watch("customerId")?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer or walk-in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Walk-in Customer</SelectItem>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacist">Pharmacist *</Label>
              <Select 
                onValueChange={(value) => form.setValue("pharmacistId", parseInt(value))}
                value={form.watch("pharmacistId").toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pharmacist" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacists?.map((pharmacist: any) => (
                    <SelectItem key={pharmacist.id} value={pharmacist.id.toString()}>
                      {pharmacist.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.pharmacistId && (
                <p className="text-sm text-red-600">{form.formState.errors.pharmacistId.message}</p>
              )}
            </div>
          </div>

          {/* Add Items Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Add Items</h3>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Label>Medicine</Label>
                  <Select 
                    onValueChange={(value) => setSelectedMedicineId(parseInt(value))}
                    value={selectedMedicineId.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines?.map((medicine: any) => (
                        <SelectItem key={medicine.id} value={medicine.id.toString()}>
                          {medicine.name} - ${medicine.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-3">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Items */}
          {saleItems.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Sale Items</h3>
                <div className="space-y-2">
                  {saleItems.map((item) => (
                    <div key={item.medicineId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.medicineName}</div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          ${item.totalPrice.toFixed(2)}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.medicineId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>${(getTotal() * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${(getTotal() * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select 
              onValueChange={(value) => form.setValue("paymentMethod", value)}
              value={form.watch("paymentMethod")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.paymentMethod && (
              <p className="text-sm text-red-600">{form.formState.errors.paymentMethod.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createSaleMutation.isPending || saleItems.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {createSaleMutation.isPending ? "Processing..." : "Process Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
