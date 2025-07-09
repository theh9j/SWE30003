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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  description: z.string().optional(),
  dosage: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  requiresPrescription: z.boolean().default(false),
});

type MedicineFormData = z.infer<typeof medicineSchema>;

interface AddMedicineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMedicineModal({ open, onOpenChange }: AddMedicineModalProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: api.getCategories,
  });

  const form = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: undefined,
      description: "",
      dosage: "",
      manufacturer: "",
      price: "",
      requiresPrescription: false,
    },
  });

  const createMedicineMutation = useMutation({
    mutationFn: (data: any) => api.createMedicine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Success",
        description: "Medicine added successfully",
      });
      form.reset();
      setStep(1);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add medicine",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MedicineFormData) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    const medicineData = {
      ...data,
      price: parseFloat(data.price),
    };

    createMedicineMutation.mutate(medicineData);
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add New Medicine - Step {step} of 2
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter medicine name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  {...form.register("sku")}
                  placeholder="Enter SKU"
                />
                {form.formState.errors.sku && (
                  <p className="text-sm text-red-600">{form.formState.errors.sku.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
                  value={form.watch("categoryId") ? form.watch("categoryId").toString() : ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-red-600">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  {...form.register("dosage")}
                  placeholder="e.g., 500mg, 10ml"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  {...form.register("manufacturer")}
                  placeholder="Enter manufacturer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...form.register("price")}
                  placeholder="0.00"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Enter medicine description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prescription"
                  checked={form.watch("requiresPrescription")}
                  onCheckedChange={(checked) => form.setValue("requiresPrescription", checked as boolean)}
                />
                <Label htmlFor="prescription">Requires prescription</Label>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createMedicineMutation.isPending}
            >
              {step === 1 ? "Next" : createMedicineMutation.isPending ? "Adding..." : "Add Medicine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
