import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface AddMedicineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMedicineModal({ open, onOpenChange }: AddMedicineModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<any>({
    name: "",
    sku: "",
    categoryId: "",
    dosage: "",
    manufacturer: "",
    price: "",
    description: "",
    requiresPrescription: false,
    initialQuantity: 0,
    minStock: 10,
    batchNumber: "BATCH",
    expiry: "",
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.getCategories,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const isValidBatch = /^BATCH\d{4}$/.test(form.batchNumber);
      if (!isValidBatch) {
        throw new Error("Batch number must be in the format BATCH####");
      }

      const { initialQuantity, minStock, batchNumber, expiry, ...medicineData } = form;

      const payload = {
        medicine: medicineData,
        inventory: {
          initialQuantity,
          minStock,
          batchNumber,
          expiry,
        },
      };

      const newMedicine = await api.createMedicine(payload);

      if (form.initialQuantity && newMedicine?.id) {
        await api.createInventory({
          medicineId: newMedicine.id,
          quantity: form.initialQuantity,
          minStockLevel: form.minStock,
        });
      }

      return newMedicine;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Medicine added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add medicine",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Left side */}
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g. Amoxicillin"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                placeholder="e.g. AMX100"
                value={form.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.categoryId?.toString() || ""}
                onValueChange={(value) => handleChange("categoryId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dosage</Label>
              <Input
                placeholder="e.g. 500mg"
                value={form.dosage}
                onChange={(e) => handleChange("dosage", e.target.value)}
              />
            </div>
            <div>
              <Label>Min Stock</Label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={form.minStock}
                onChange={(e) => handleChange("minStock", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-4">
            <div>
              <Label>Manufacturer</Label>
              <Input
                placeholder="e.g. Pfizer"
                value={form.manufacturer}
                onChange={(e) => handleChange("manufacturer", e.target.value)}
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 12.50"
                value={form.price}
                onChange={(e) => handleChange("price", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Initial Quantity</Label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={form.initialQuantity}
                onChange={(e) => handleChange("initialQuantity", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Batch Number</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Batch:</span>
                <Input
                  placeholder="1234"
                  value={form.batchNumber.replace("BATCH", "")}
                  onChange={(e) => {
                    const numericPart = e.target.value.replace(/\D/g, "").slice(0, 4); // max 4 digits
                    handleChange("batchNumber", `BATCH${numericPart}`);
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiry}
                onChange={(e) => handleChange("expiry", e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Optional notes about this medicine"
                rows={3}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="requiresPrescription"
            checked={form.requiresPrescription}
            onCheckedChange={(checked) => handleChange("requiresPrescription", checked === true)}
          />
          <Label htmlFor="requiresPrescription">Requires Prescription</Label>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
