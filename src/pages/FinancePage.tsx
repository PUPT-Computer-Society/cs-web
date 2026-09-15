import React, { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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
import type { FinanceSummary, FinanceTransaction } from "@/types";

const PAGE_SIZE = 10;
const FLOW_OPTIONS = [
  { value: "expense", label: "Disbursement (Expense)" },
  { value: "income", label: "Collection (Income)" },
];

export const FinancePage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { isPresident, hasPermission } = useAuth();
  const canManage = hasPermission("manage_finance");
  const canAudit = hasPermission("audit_finance");
  const canEditFinance = canManage || canAudit || isPresident;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Query for ledger & summary
  const { data: transactions = [], isLoading: isTxLoading } = useQuery<
    FinanceTransaction[]
  >({
    queryKey: queryKeys.finance,
    queryFn: () => api.get<FinanceTransaction[]>("/finance"),
  });

  const { data: summary, isLoading: isSummaryLoading } =
    useQuery<FinanceSummary>({
      queryKey: queryKeys.financeSummary,
      queryFn: () => api.get<FinanceSummary>("/finance/summary"),
    });

  const isLoading = isTxLoading || isSummaryLoading;

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] =
    useState<FinanceTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<FinanceTransaction | null>(null);

  // Create Form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | ""
  >("");
  const [category, setCategory] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Edit Form
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("Logistics & Supplies");
  const [editRefNo, setEditRefNo] = useState("");
  const [editReceiptUrl, setEditReceiptUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Mutations
  const createTxMutation = useMutation({
    mutationFn: (newTx: Record<string, unknown>) => api.post("/finance", newTx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance });
      queryClient.invalidateQueries({ queryKey: queryKeys.financeSummary });
      setCreateOpen(false);
      setTitle("");
      setAmount("");
      setTransactionType("");
      setCategory("");
      setReferenceNo("");
      setReceiptUrl("");
      setNotes("");
      toastSuccess("Financial transaction recorded.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to record entry");
    },
  });

  const updateTxMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/finance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance });
      queryClient.invalidateQueries({ queryKey: queryKeys.financeSummary });
      setEditingTx(null);
      toastSuccess("Transaction record and receipt updated.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update transaction");
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance });
      queryClient.invalidateQueries({ queryKey: queryKeys.financeSummary });
      setDeletingTx(null);
      toastSuccess("Transaction removed from ledger.");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to delete transaction");
    },
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    createTxMutation.mutate({
      title,
      amount: Number(amount || 0),
      transactionType: transactionType || "expense",
      category: category || "Logistics & Supplies",
      referenceNo: referenceNo || null,
      receiptUrl: receiptUrl || null,
      notes,
    });
  };

  const openEditDialog = (tx: FinanceTransaction) => {
    setEditingTx(tx);
    setEditTitle(tx.title);
    setEditAmount(tx.amount);
    setEditType(tx.transactionType as "income" | "expense");
    setEditCategory(tx.category);
    setEditRefNo(tx.referenceNo || "");
    setEditReceiptUrl(tx.receiptUrl || "");
    setEditNotes(tx.notes || "");
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    updateTxMutation.mutate({
      id: editingTx.id,
      data: {
        title: editTitle,
        amount: Number(editAmount),
        transactionType: editType,
        category: editCategory,
        referenceNo: editRefNo || null,
        receiptUrl: editReceiptUrl || null,
        notes: editNotes,
      },
    });
  };

  const handleDeleteTransaction = () => {
    if (!deletingTx) return;
    deleteTxMutation.mutate(deletingTx.id);
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedTransactions = transactions.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <>
      <Header
        title="Finance Monitoring & Audit"
        subtitle="Treasury ledger, fund disbursement records, and audited balances"
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Monochromatic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono font-semibold text-muted-foreground">
                    TOTAL DISBURSEMENTS
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-2" />
                  ) : (
                    <h4 className="text-2xl font-bold font-mono text-foreground mt-1">
                      ₱
                      {(summary?.totalExpense || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </h4>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Expenses & allocations
                  </p>
                </div>
                <div className="p-2 rounded-md border border-border bg-secondary/50">
                  <ArrowDownRight className="w-4 h-4 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono font-semibold text-muted-foreground">
                    TOTAL COLLECTIONS
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-2" />
                  ) : (
                    <h4 className="text-2xl font-bold font-mono text-foreground mt-1">
                      ₱
                      {(summary?.totalIncome || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </h4>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Sponsorships & dues
                  </p>
                </div>
                <div className="p-2 rounded-md border border-border bg-secondary/50">
                  <ArrowUpRight className="w-4 h-4 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono font-semibold text-muted-foreground">
                    NET TREASURY BALANCE
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-2" />
                  ) : (
                    <h4 className="text-2xl font-bold font-mono text-foreground mt-1">
                      ₱
                      {(summary?.netBalance || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </h4>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Audited available funds
                  </p>
                </div>
                <div className="p-2 rounded-md border border-border bg-secondary/50">
                  <Receipt className="w-4 h-4 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Treasury Ledger
          </h3>

          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="font-mono text-[11px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record Entry
            </Button>
          )}
        </div>

        {/* Monochromatic Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground font-mono">
              No transactions recorded in the ledger yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 font-mono text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Flow</th>
                    <th className="p-3.5">Reference No</th>
                    <th className="p-3.5">Proof / Receipt</th>
                    <th className="p-3.5 text-right">Amount</th>
                    {canEditFinance && (
                      <th className="p-3.5 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-3.5 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">
                        {tx.title}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {tx.category}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase"
                        >
                          {tx.transactionType}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                        {tx.referenceNo || "—"}
                      </td>
                      <td className="p-3.5">
                        {tx.receiptUrl ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewReceipt(tx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold transition-colors"
                              title="Preview receipt in portal"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Receipt</span>
                            </button>
                            <a
                              href={tx.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Open original Drive link"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[11px]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-foreground">
                        {tx.transactionType === "income" ? "+" : "-"}₱
                        {tx.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {canEditFinance && (
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditDialog(tx)}
                              className="p-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs transition-colors"
                              title="Edit transaction / receipt"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTx(tx)}
                              className="p-1 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs transition-colors"
                              title="Delete transaction"
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

          {transactions.length > 0 && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalItems={transactions.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Record Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Record Treasury Transaction"
        description="Ledger entries are permanently timestamped for audit integrity."
      >
        <form onSubmit={handleCreateTransaction} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Transaction Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Venue Downpayment / Membership Dues"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Transaction Flow
              </label>
              <Select
                value={transactionType}
                onValueChange={(val) =>
                  setTransactionType(val as "income" | "expense")
                }
                options={FLOW_OPTIONS}
                placeholder="Select Flow (Income/Expense)..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Amount (PHP)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Budget Category
              </label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="e.g. Logistics & Supplies"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Reference / OR Number
              </label>
              <Input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. OR-2026-0042"
              />
            </div>
          </div>

          <DriveLinkInput
            registryKey="financeReceipts"
            value={receiptUrl}
            onChange={setReceiptUrl}
            label="Proof of Receipt / Attachment URL (Optional)"
            placeholder="https://drive.google.com/..."
          />

          <MarkdownTextarea
            label="Auditor & Ledger Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Payment breakdown, payee, or auditor notes..."
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
              Save Entry
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog
        open={!!editingTx}
        onOpenChange={(open) => {
          if (!open) setEditingTx(null);
        }}
        title="Edit Ledger Entry & Receipt Proof"
        description="Update transaction details, reference number, or attach official receipts."
      >
        <form onSubmit={handleUpdateTransaction} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Transaction Title
            </label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Transaction Flow
              </label>
              <Select
                value={editType}
                onValueChange={(val) =>
                  setEditType(val as "income" | "expense")
                }
                options={FLOW_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Amount (PHP)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Budget Category
              </label>
              <Input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Reference / OR Number
              </label>
              <Input
                type="text"
                value={editRefNo}
                onChange={(e) => setEditRefNo(e.target.value)}
              />
            </div>
          </div>

          <DriveLinkInput
            registryKey="financeReceipts"
            value={editReceiptUrl}
            onChange={setEditReceiptUrl}
            label="Proof of Receipt / Attachment URL (Optional)"
            placeholder="https://drive.google.com/..."
          />

          <MarkdownTextarea
            label="Auditor & Ledger Notes"
            value={editNotes}
            onChange={setEditNotes}
            placeholder="Payment breakdown, payee, or auditor notes..."
            minHeight="min-h-[85px]"
            maxHeight="max-h-[200px]"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingTx(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Update Entry
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingTx}
        title="Remove Ledger Transaction"
        description={`Are you sure you want to delete transaction "${deletingTx?.title}" (₱${deletingTx?.amount.toLocaleString()})? This action alters the audited balance calculation.`}
        confirmText="Remove Entry"
        variant="danger"
        isLoading={deleteTxMutation.isPending}
        onConfirm={handleDeleteTransaction}
        onClose={() => setDeletingTx(null)}
      />

      {/* In-Portal Receipt Preview Modal with Left Information Sidebar */}
      <DocumentPreviewModal
        open={Boolean(previewReceipt)}
        onClose={() => setPreviewReceipt(null)}
        title={previewReceipt ? `Receipt: ${previewReceipt.title}` : ""}
        subtitle={
          previewReceipt
            ? `OFFICIAL RECEIPT REF: ${previewReceipt.referenceNo || "N/A"} ` +
              "• Audited Disbursement Record"
            : undefined
        }
        url={previewReceipt?.receiptUrl || ""}
        fileMeta={
          previewReceipt
            ? {
                title: previewReceipt.title,
                fileName: previewReceipt.referenceNo
                  ? `Receipt_${previewReceipt.referenceNo}.pdf`
                  : `Receipt_${previewReceipt.title}.pdf`,
                fileType: "Audited Voucher / Receipt Document",
                category: previewReceipt.category.toUpperCase(),
                status: previewReceipt.transactionType.toUpperCase(),
                dateUploaded: new Date(
                  previewReceipt.createdAt,
                ).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
                description: previewReceipt.notes,
                customFields: [
                  {
                    label: "Transaction Flow",
                    value:
                      previewReceipt.transactionType === "income"
                        ? "Collection (+)"
                        : "Disbursement (-)",
                  },
                  {
                    label: "Audited Amount",
                    value: `₱${previewReceipt.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`,
                  },
                  {
                    label: "Reference No.",
                    value: previewReceipt.referenceNo || "N/A",
                  },
                ],
              }
            : undefined
        }
      />
    </>
  );
};
