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

interface EditMedicineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: any;
  onSaved: () => void;
}

export default function EditMedicineModal({
  open,
  onOpenChange,
  medicine,
  onSaved,
}: EditMedicineModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<any>(medicine || {});

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.getCategories,
  });

  useEffect(() => {
    if (medicine) setForm({ ...medicine });
  }, [medicine]);

  const mutation = useMutation({
    mutationFn: () => api.updateMedicine(medicine.id, form),
    onSuccess: () => {
      toast({ title: "Updated", description: "Medicine updated successfully" });
      onSaved();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    },
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Medicine</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name || ""} onChange={e => handleChange("name", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>SKU</Label>
            <Input value={form.sku || ""} onChange={e => handleChange("sku", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              value={form.categoryId?.toString() || ""}
              onValueChange={value => handleChange("categoryId", parseInt(value))}
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

          <div className="space-y-1">
            <Label>Dosage</Label>
            <Input value={form.dosage || ""} onChange={e => handleChange("dosage", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Manufacturer</Label>
            <Input value={form.manufacturer || ""} onChange={e => handleChange("manufacturer", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Price</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price || ""}
              onChange={e => handleChange("price", parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description || ""}
              onChange={e => handleChange("description", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresPrescription"
              checked={form.requiresPrescription || false}
              onCheckedChange={(checked) => handleChange("requiresPrescription", checked === true)}
            />
            <Label htmlFor="requiresPrescription">Requires Prescription</Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
