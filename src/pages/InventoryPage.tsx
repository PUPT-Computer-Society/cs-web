import React, { useState } from "react";
import { ExternalLink, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DocumentPreviewModal } from "@/components/ui/DocumentPreviewModal";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { DriveLinkInput } from "@/components/ui/DriveLinkInput";
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import type { InventoryItem } from "@/types";

const PAGE_SIZE = 10;
const CONDITION_OPTIONS = [
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "For Repair", label: "For Repair" },
  { value: "Decommissioned", label: "Decommissioned" },
];

const INVENTORY_SORT_OPTIONS = [
  { value: "item_name:asc", label: "Item Name (A to Z)" },
  { value: "item_name:desc", label: "Item Name (Z to A)" },
  { value: "quantity:desc", label: "Quantity (Highest)" },
  { value: "quantity:asc", label: "Quantity (Lowest)" },
  { value: "last_updated:desc", label: "Recently Updated" },
];

export const InventoryPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { isPresident, hasPermission } = useAuth();
  const canManage =
    hasPermission("manage_inventory") ||
    hasPermission("audit_finance") ||
    isPresident;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("item_name:asc");

  const [sortField, sortOrder] = sortBy.split(":");

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: queryKeys.inventoryFiltered({
      sort_by: sortField,
      order: sortOrder,
    }),
    queryFn: () =>
      api.get<InventoryItem[]>(
        `/inventory?sort_by=${sortField}&order=${sortOrder}`,
      ),
  });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [previewProof, setPreviewProof] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Create Form
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofFileId, setProofFileId] = useState<string | null>(null);

  // Edit Form
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editCondition, setEditCondition] = useState("Good");
  const [editLocation, setEditLocation] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editProofUrl, setEditProofUrl] = useState("");
  const [editProofFileId, setEditProofFileId] = useState<string | null>(null);

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: (newItem: Record<string, unknown>) =>
      api.post("/inventory", newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      setCreateOpen(false);
      setItemName("");
      setQuantity("");
      setCondition("");
      setLocation("");
      setRemarks("");
      setProofUrl("");
      setProofFileId(null);
      toastSuccess("Inventory asset and proof recorded.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to add item");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      setEditingItem(null);
      toastSuccess("Inventory item updated successfully.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update item");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      setDeletingItem(null);
      toastSuccess("Inventory item decommissioned and removed.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete item");
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    createItemMutation.mutate({
      itemName,
      quantity: Number(quantity || 1),
      condition: condition || "Good",
      location: location || "Org Room",
      remarks,
      proofUrl: proofUrl || null,
      proofFileId: proofFileId || null,
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.itemName);
    setEditQuantity(item.quantity);
    setEditCondition(item.condition);
    setEditLocation(item.location);
    setEditRemarks(item.remarks || "");
    setEditProofUrl(item.proofUrl || "");
    setEditProofFileId(item.proofFileId || null);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateItemMutation.mutate({
      id: editingItem.id,
      data: {
        itemName: editName,
        quantity: Number(editQuantity),
        condition: editCondition,
        location: editLocation,
        remarks: editRemarks,
        proofUrl: editProofUrl || null,
        proofFileId: editProofFileId || null,
      },
    });
  };

  const handleDeleteItem = () => {
    if (!deletingItem) return;
    deleteItemMutation.mutate(deletingItem.id);
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedItems = items.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <>
      <Header
        title="Inventory & Asset Custody"
        subtitle="Physical assets, hardware, custody tracking, and proof of received items"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                TRACKED ASSETS:
              </span>{" "}
              <span className="text-xs font-mono font-bold text-foreground">
                {items.length} Units Total
              </span>
            </div>
            <div className="w-48 shrink-0">
              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val);
                  setCurrentPage(1);
                }}
                options={INVENTORY_SORT_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="font-mono text-[11px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Equipment
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground font-mono">
              No inventory equipment registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={
                    "border-b border-border bg-secondary/40 font-mono " +
                    "text-[10px] uppercase text-muted-foreground"
                  }
                >
                  <tr>
                    <th className="p-3 sm:p-3.5">Item Name</th>
                    <th className="p-3 sm:p-3.5">Qty</th>
                    <th className="p-3 sm:p-3.5 hidden sm:table-cell">
                      Condition
                    </th>
                    <th className="p-3 sm:p-3.5 hidden md:table-cell">
                      Location
                    </th>
                    <th className="p-3 sm:p-3.5">Received Proof</th>
                    <th className="p-3 sm:p-3.5 hidden lg:table-cell">
                      Remarks
                    </th>
                    {canManage && (
                      <th className="p-3 sm:p-3.5 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        "hover:bg-secondary/30 transition-colors " +
                        "animate-in fade-in-0 duration-200"
                      }
                    >
                      <td
                        className="p-3 sm:p-3.5 font-semibold text-foreground"
                      >
                        <div>{item.itemName}</div>
                        <div
                          className={
                            "sm:hidden flex items-center gap-1.5 mt-0.5 " +
                            "text-[10px] text-muted-foreground font-normal"
                          }
                        >
                          <span className="truncate">{item.location}</span>
                          <span>•</span>
                          <span
                            className={
                              item.condition === "Good"
                                ? "text-emerald-500 font-semibold"
                                : item.condition === "For Repair"
                                  ? "text-amber-500 font-semibold"
                                  : "text-rose-500 font-semibold"
                            }
                          >
                            {item.condition}
                          </span>
                        </div>
                      </td>
                      <td
                        className={
                          "p-3 sm:p-3.5 font-mono font-bold text-foreground"
                        }
                      >
                        {item.quantity}
                      </td>
                      <td className="p-3 sm:p-3.5 hidden sm:table-cell">
                        <Badge
                          variant={
                            item.condition === "Good"
                              ? "outline"
                              : item.condition === "For Repair"
                                ? "warning"
                                : "destructive"
                          }
                          className="font-mono text-[9px] uppercase"
                        >
                          {item.condition}
                        </Badge>
                      </td>
                      <td
                        className={
                          "p-3 sm:p-3.5 text-muted-foreground " +
                          "hidden md:table-cell"
                        }
                      >
                        {item.location}
                      </td>
                      <td className="p-3 sm:p-3.5">
                        {item.proofUrl ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewProof(item)}
                              className={
                                "inline-flex items-center gap-1 px-2 py-1.5 " +
                                "min-h-[36px] rounded-lg border " +
                                "border-primary/30 bg-primary/10 " +
                                "hover:bg-primary/20 text-primary " +
                                "text-[11px] font-semibold transition-colors " +
                                "cursor-pointer"
                              }
                              title="Preview proof of item received"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                Proof (PAR)
                              </span>
                            </button>
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={
                                "p-2 min-h-[36px] min-w-[36px] flex " +
                                "items-center justify-center rounded-lg " +
                                "text-muted-foreground hover:text-foreground " +
                                "transition-colors"
                              }
                              title="Open original Drive link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span
                            className={
                              "text-muted-foreground font-mono text-[11px]"
                            }
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className={
                          "p-3 sm:p-3.5 text-muted-foreground font-mono " +
                          "text-[11px] hidden lg:table-cell"
                        }
                      >
                        {item.remarks || "—"}
                      </td>
                      {canManage && (
                        <td
                          className={
                            "p-3 sm:p-3.5 text-right whitespace-nowrap"
                          }
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditDialog(item)}
                              className={
                                "p-2 min-w-[36px] min-h-[36px] flex " +
                                "items-center justify-center rounded-lg " +
                                "border border-border bg-background " +
                                "hover:bg-secondary text-foreground " +
                                "text-xs transition-colors cursor-pointer"
                              }
                              title="Edit item / proof"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className={
                                "p-2 min-w-[36px] min-h-[36px] flex " +
                                "items-center justify-center rounded-lg " +
                                "border border-destructive/30 " +
                                "bg-destructive/10 hover:bg-destructive/20 " +
                                "text-destructive text-xs transition-colors " +
                                "cursor-pointer"
                              }
                              title="Decommission item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalItems={items.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Register Inventory Asset"
        description="Tracks custody, physical state, and proof of received equipment."
      >
        <form onSubmit={handleAddItem} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Asset Name
            </label>
            <Input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g. HDMI Splitter / Soundcraft Mixer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                required
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Condition
              </label>
              <Select
                value={condition}
                onValueChange={setCondition}
                options={CONDITION_OPTIONS}
                placeholder="Select Condition..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Storage Location
              </label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cabinet A, Org Room"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <DriveDropzone
                label="Upload Custody / Condition Proof"
                moduleType="inventory"
                title={itemName}
                condition={condition || "Good"}
                value={proofUrl}
                fileId={proofFileId}
                onUploaded={(url, fid) => {
                  setProofUrl(url);
                  if (fid) setProofFileId(fid);
                }}
                onCleared={() => {
                  setProofUrl("");
                  setProofFileId(null);
                }}
              />
            </div>
          </div>

          <MarkdownTextarea
            label="Remarks & Custody Notes"
            value={remarks}
            onChange={setRemarks}
            placeholder="Serial numbers, donor info, or custody notes..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Register Asset
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
        title="Edit Inventory Asset & Proof"
        description="Update condition, location, or attach proof of received items."
      >
        <form onSubmit={handleUpdateItem} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Asset Name
            </label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Condition
              </label>
              <Select
                value={editCondition}
                onValueChange={setEditCondition}
                options={CONDITION_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Storage Location
              </label>
              <Input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <DriveDropzone
                label="Upload Custody / Condition Proof"
                moduleType="inventory"
                title={editName}
                condition={editCondition}
                value={editProofUrl}
                fileId={editProofFileId}
                onUploaded={(url, fid) => {
                  setEditProofUrl(url);
                  if (fid) setEditProofFileId(fid);
                }}
                onCleared={() => {
                  setEditProofUrl("");
                  setEditProofFileId(null);
                }}
              />
            </div>
          </div>

          <MarkdownTextarea
            label="Remarks & Custody Notes"
            value={editRemarks}
            onChange={setEditRemarks}
            placeholder="Serial numbers, donor info, or custody notes..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Update Asset
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingItem}
        title="Decommission Inventory Asset"
        description={`Are you sure you want to remove "${deletingItem?.itemName}" from the active inventory registry?`}
        confirmText="Remove Asset"
        variant="danger"
        isLoading={deleteItemMutation.isPending}
        onConfirm={handleDeleteItem}
        onClose={() => setDeletingItem(null)}
      />

      {/* Proof of Item Received Preview Modal with Left Information Sidebar */}
      <DocumentPreviewModal
        open={Boolean(previewProof)}
        onClose={() => setPreviewProof(null)}
        title={previewProof ? `Proof of Receipt: ${previewProof.itemName}` : ""}
        subtitle={
          previewProof
            ? "Property Acknowledgment Receipt / Delivery Confirmation Document"
            : undefined
        }
        url={previewProof?.proofUrl || ""}
        fileMeta={
          previewProof
            ? {
                title: previewProof.itemName,
                fileName: `PAR_${previewProof.itemName.replace(/\s+/g, "_")}.pdf`,
                fileType: "Property Acknowledgment Receipt (PAR)",
                category: "Asset Inventory Record",
                status: previewProof.condition.toUpperCase(),
                dateUploaded: new Date(
                  previewProof.updatedAt,
                ).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                description: previewProof.remarks,
                customFields: [
                  {
                    label: "Quantity",
                    value: `${previewProof.quantity} units`,
                  },
                  { label: "Condition", value: previewProof.condition },
                  {
                    label: "Storage Location",
                    value: previewProof.location || "Unassigned",
                  },
                ],
              }
            : undefined
        }
      />
    </>
  );
};
