// src/components/molecules/QuickSetupModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import { FormError } from "./FormError";
import { useBulkCreateTables } from "../../api/hooks/useTablesApi";
import { useEventContext } from "../../context/EventContext";
import {
  TableCategory,
  TableCategoryLabels,
  TableCategoryPrefixes,
  getCommonCategories,
} from "../../types/tableCategories";

interface CategoryInput {
  category: TableCategory;
  quantity: number;
  capacity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { eventId } = useEventContext();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Initialize with common categories
  const [categories, setCategories] = useState<CategoryInput[]>([]);
  
  // Custom table section
  const [customPrefix, setCustomPrefix] = useState("");
  const [customQuantity, setCustomQuantity] = useState("");
  const [customCapacity, setCustomCapacity] = useState("10");

  const bulkCreateTables = useBulkCreateTables(eventId);

  // Initialize form with common categories
  useEffect(() => {
    if (isOpen) {
      const commonCategories = getCommonCategories();
      setCategories(
        commonCategories.map((cat) => ({
          category: cat,
          quantity: 0,
          capacity: 10,
        }))
      );
      setCustomPrefix("");
      setCustomQuantity("");
      setCustomCapacity("10");
      setError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleQuantityChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index].quantity = Number(value) || 0;
    setCategories(newCategories);
  };

  const handleCapacityChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index].capacity = Number(value) || 1;
    setCategories(newCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Filter categories with quantity > 0
    const activeCategories = categories.filter((cat) => cat.quantity > 0);
    
    // Check custom table input
    const customQty = Number(customQuantity) || 0;
    const customCap = Number(customCapacity) || 0;
    const hasCustom = customPrefix.trim() && customQty > 0;

    if (activeCategories.length === 0 && !hasCustom) {
      setError("Please enter at least one table quantity");
      return;
    }

    // Validate custom input
    if (hasCustom) {
      if (!customPrefix.trim()) {
        setError("Please enter a table prefix for custom tables");
        return;
      }
      if (customQty < 1) {
        setError("Custom table quantity must be at least 1");
        return;
      }
      if (customCap < 1) {
        setError("Custom table capacity must be at least 1");
        return;
      }
    }

    // Validate category capacities
    const invalidCapacity = activeCategories.find((cat) => cat.capacity < 1);
    if (invalidCapacity) {
      setError("All capacities must be at least 1");
      return;
    }

    setIsCreating(true);

    try {
      // Use bulk create API - one call per category
      for (const cat of activeCategories) {
        const prefix = TableCategoryPrefixes[cat.category];
        await bulkCreateTables.mutateAsync({
          eventGuid: eventId!,
          tableName: prefix,
          quantity: cat.quantity,
          maxSeats: cat.capacity,
        });
      }

      // Create custom tables if provided
      if (hasCustom) {
        await bulkCreateTables.mutateAsync({
          eventGuid: eventId!,
          tableName: customPrefix.trim(),
          quantity: customQty,
          maxSeats: customCap,
        });
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to create tables:", err);
      setError(err.message ?? "Failed to create tables. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const totalTables = categories.reduce((sum, cat) => sum + cat.quantity, 0) + (Number(customQuantity) || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Create Tables"
      className="!max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormError message={error} />}

        {/* Note 1: Quick Setup for preset categories */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Quick Setup:</strong> Enter quantities for each category.
            Tables will be auto-named (e.g., vip1, vip2, bridefamily1, friends1, etc.)
          </p>
        </div>

        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div
              key={cat.category}
              className="grid grid-cols-12 gap-3 items-center p-3 bg-white dark:bg-accent/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* Category Label */}
              <div className="col-span-4">
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {TableCategoryLabels[cat.category]}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ({TableCategoryPrefixes[cat.category]}1, {TableCategoryPrefixes[cat.category]}2...)
                </p>
              </div>

              {/* Quantity Input */}
              <div className="col-span-4">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cat.quantity || ""}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  tables
                </p>
              </div>

              {/* Capacity Input */}
              <div className="col-span-4">
                <input
                  type="number"
                  min="1"
                  value={cat.capacity}
                  onChange={(e) => handleCapacityChange(index, e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
                  disabled={cat.quantity === 0}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  seats each
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Tables Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Custom Tables (Optional)
          </h3>

          {/* Note 2: Custom Bulk Create */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Example:</strong> Prefix "family" with 5 tables creates: family1,
              family2, family3, family4, family5
            </p>
          </div>
          
          <div className="grid grid-cols-12 gap-3 items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            {/* Custom Prefix Input */}
            <div className="col-span-4">
              <label className="font-medium text-sm text-gray-700 dark:text-gray-300 block mb-1">
                Table Prefix
              </label>
              <input
                type="text"
                placeholder="e.g., family, special"
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                (prefix1, prefix2...)
              </p>
            </div>

            {/* Quantity Input */}
            <div className="col-span-4">
              <label className="font-medium text-sm text-gray-700 dark:text-gray-300 block mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                tables
              </p>
            </div>

            {/* Capacity Input */}
            <div className="col-span-4">
              <label className="font-medium text-sm text-gray-700 dark:text-gray-300 block mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                value={customCapacity}
                onChange={(e) => setCustomCapacity(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-accent text-gray-900 dark:text-white"
                disabled={!customQuantity || Number(customQuantity) === 0}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                seats each
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {totalTables > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Total:</strong> {totalTables} tables will be created
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            type="button"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isCreating}
            disabled={totalTables === 0}
          >
            {isCreating
              ? "Creating..."
              : `Create ${totalTables} Table${totalTables !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
