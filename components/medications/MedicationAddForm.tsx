// Form component for adding a new prescription schedule
import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

export interface MedicationFormData {
  name: string;
  dosage: string;
  time: string;
  total_stock: number;
  low_stock_threshold: number;
}

interface MedicationAddFormProps {
  formData: MedicationFormData;
  setFormData: React.Dispatch<React.SetStateAction<MedicationFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function MedicationAddForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: MedicationAddFormProps) {
  return (
    <Card title="Add New Medication">
      <form onSubmit={onSubmit}>
        <Input
          label="Medication Name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Aspirin"
          required
        />

        <Input
          label="Dosage"
          value={formData.dosage}
          onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))}
          placeholder="e.g., 100mg"
          required
        />

        <Input
          label="Time (24-hour format)"
          type="time"
          value={formData.time}
          onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
          required
        />

        <Input
          label="Total Stock"
          type="number"
          value={formData.total_stock}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, total_stock: parseInt(e.target.value, 10) || 0 }))
          }
          min="0"
          required
        />

        <Input
          label="Low Stock Alert Threshold"
          type="number"
          value={formData.low_stock_threshold}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, low_stock_threshold: parseInt(e.target.value, 10) || 1 }))
          }
          min="1"
          required
        />

        <div className="flex gap-3 mt-4">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-1/2">
            Cancel
          </Button>
          <Button type="submit" className="w-1/2">
            Add Medication
          </Button>
        </div>
      </form>
    </Card>
  );
}
