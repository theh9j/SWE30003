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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

const prescriptionSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  prescriptionNumber: z.string().min(1, "Prescription number is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  issuedDate: z.string().min(1, "Issued date is required"),
  notes: z.string().optional(),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface AddPrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPrescriptionModal({ open, onOpenChange }: AddPrescriptionModalProps) {
  const { toast } = useToast();

  const { data: customers } = useQuery({
    queryKey: ["/api/users", "customer"],
    queryFn: () => api.getUsers("customer"),
  });

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      customerId: undefined,
      prescriptionNumber: "",
      doctorName: "",
      issuedDate: "",
      notes: "",
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: (data: any) => api.createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Success",
        description: "Prescription added successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add prescription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrescriptionFormData) => {
    const prescriptionData = {
      ...data,
      status: "pending",
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  // Generate a random prescription number
  const generatePrescriptionNumber = () => {
    const number = `RX-${Date.now().toString().slice(-6)}`;
    form.setValue("prescriptionNumber", number);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Prescription</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select 
              onValueChange={(value) => form.setValue("customerId", parseInt(value))}
              value={form.watch("customerId") ? form.watch("customerId").toString() : ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.fullName} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.customerId && (
              <p className="text-sm text-red-600">{form.formState.errors.customerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescriptionNumber">Prescription Number *</Label>
            <div className="flex space-x-2">
              <Input
                id="prescriptionNumber"
                {...form.register("prescriptionNumber")}
                placeholder="Enter prescription number"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generatePrescriptionNumber}
                className="whitespace-nowrap"
              >
                Generate
              </Button>
            </div>
            {form.formState.errors.prescriptionNumber && (
              <p className="text-sm text-red-600">{form.formState.errors.prescriptionNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctorName">Doctor Name *</Label>
            <Input
              id="doctorName"
              {...form.register("doctorName")}
              placeholder="Enter doctor's name"
            />
            {form.formState.errors.doctorName && (
              <p className="text-sm text-red-600">{form.formState.errors.doctorName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuedDate">Issued Date *</Label>
            <Input
              id="issuedDate"
              type="date"
              {...form.register("issuedDate")}
            />
            {form.formState.errors.issuedDate && (
              <p className="text-sm text-red-600">{form.formState.errors.issuedDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createPrescriptionMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createPrescriptionMutation.isPending ? "Adding..." : "Add Prescription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
