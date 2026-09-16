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
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import type { FinanceSummary, FinanceTransaction } from "@/types";

const PAGE_SIZE = 10;
const FLOW_OPTIONS = [
  { value: "expense", label: "Disbursement (Expense)" },
  { value: "income", label: "Collection (Income)" },
];

const FINANCE_SORT_OPTIONS = [
  { value: "created_at:desc", label: "Date (Newest)" },
  { value: "created_at:asc", label: "Date (Oldest)" },
  { value: "amount:desc", label: "Amount (Highest)" },
  { value: "amount:asc", label: "Amount (Lowest)" },
  { value: "title:asc", label: "Title (A to Z)" },
];

export const FinancePage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { isPresident, hasPermission } = useAuth();
  const canManage = hasPermission("manage_finance");
  const canAudit = hasPermission("audit_finance");
  const canEditFinance = canManage || canAudit || isPresident;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at:desc");

  const [sortField, sortOrder] = sortBy.split(":");

  // TanStack Query for ledger & summary with backend-level sorting
  const { data: transactions = [], isLoading: isTxLoading } = useQuery<
    FinanceTransaction[]
  >({
    queryKey: queryKeys.financeFiltered({
      sort_by: sortField,
      order: sortOrder,
    }),
    queryFn: () =>
      api.get<FinanceTransaction[]>(
        `/finance?sort_by=${sortField}&order=${sortOrder}`,
      ),
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
  const [proofFileId, setProofFileId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Edit Form
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("Logistics & Supplies");
  const [editRefNo, setEditRefNo] = useState("");
  const [editReceiptUrl, setEditReceiptUrl] = useState("");
  const [editProofFileId, setEditProofFileId] = useState<string | null>(null);
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
      setProofFileId(null);
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
      proofFileId: proofFileId || null,
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
    setEditProofFileId(tx.proofFileId || null);
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
        proofFileId: editProofFileId || null,
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Treasury Ledger
            </h3>
            <div className="w-48 shrink-0">
              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val);
                  setCurrentPage(1);
                }}
                options={FINANCE_SORT_OPTIONS}
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
                <thead
                  className={
                    "border-b border-border bg-secondary/40 font-mono " +
                    "text-[10px] uppercase text-muted-foreground"
                  }
                >
                  <tr>
                    <th className="p-3 sm:p-3.5 hidden sm:table-cell">Date</th>
                    <th className="p-3 sm:p-3.5">Description</th>
                    <th className="p-3 sm:p-3.5 hidden md:table-cell">
                      Category
                    </th>
                    <th className="p-3 sm:p-3.5 hidden md:table-cell">Flow</th>
                    <th className="p-3 sm:p-3.5 hidden lg:table-cell">
                      Reference No
                    </th>
                    <th className="p-3 sm:p-3.5">Proof / Receipt</th>
                    <th className="p-3 sm:p-3.5 text-right">Amount</th>
                    {canEditFinance && (
                      <th className="p-3 sm:p-3.5 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td
                        className={
                          "p-3 sm:p-3.5 font-mono text-muted-foreground " +
                          "whitespace-nowrap hidden sm:table-cell"
                        }
                      >
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className="p-3 sm:p-3.5 font-semibold text-foreground"
                      >
                        <div>{tx.title}</div>
                        <div
                          className={
                            "sm:hidden flex items-center gap-1.5 mt-0.5 " +
                            "text-[10px] text-muted-foreground font-normal"
                          }
                        >
                          <span>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="truncate">{tx.category}</span>
                        </div>
                      </td>
                      <td
                        className={
                          "p-3 sm:p-3.5 text-muted-foreground " +
                          "hidden md:table-cell"
                        }
                      >
                        {tx.category}
                      </td>
                      <td className="p-3 sm:p-3.5 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase"
                        >
                          {tx.transactionType}
                        </Badge>
                      </td>
                      <td
                        className={
                          "p-3 sm:p-3.5 font-mono text-[11px] " +
                          "text-muted-foreground hidden lg:table-cell"
                        }
                      >
                        {tx.referenceNo || "—"}
                      </td>
                      <td className="p-3 sm:p-3.5">
                        {tx.receiptUrl ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setPreviewReceipt(tx)}
                              className={
                                "gap-1 border border-primary/30 " +
                                "bg-primary/10 text-primary " +
                                "hover:bg-primary/20"
                              }
                              title="Preview receipt in portal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Receipt</span>
                            </Button>
                            <a
                              href={tx.receiptUrl}
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
                          "p-3 sm:p-3.5 text-right font-mono font-bold " +
                          "text-xs sm:text-sm whitespace-nowrap " +
                          (tx.transactionType === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400")
                        }
                      >
                        {tx.transactionType === "income" ? "+" : "-"}₱
                        {tx.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {canEditFinance && (
                        <td
                          className={
                            "p-3 sm:p-3.5 text-right whitespace-nowrap"
                          }
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(tx)}
                              title="Edit transaction / receipt"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => setDeletingTx(tx)}
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

          <DriveDropzone
            label="Upload Proof of Receipt / Attachment"
            moduleType="finance"
            title={title}
            merchant={title}
            amount={typeof amount === "number" ? amount : undefined}
            orNumber={referenceNo}
            category={category}
            value={receiptUrl}
            fileId={proofFileId}
            onUploaded={(url, fid) => {
              setReceiptUrl(url);
              if (fid) setProofFileId(fid);
            }}
            onCleared={() => {
              setReceiptUrl("");
              setProofFileId(null);
            }}
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

          <DriveDropzone
            label="Upload Proof of Receipt / Attachment"
            moduleType="finance"
            title={editTitle}
            merchant={editTitle}
            amount={editAmount}
            orNumber={editRefNo}
            category={editCategory}
            value={editReceiptUrl}
            fileId={editProofFileId}
            onUploaded={(url, fid) => {
              setEditReceiptUrl(url);
              if (fid) setEditProofFileId(fid);
            }}
            onCleared={() => {
              setEditReceiptUrl("");
              setEditProofFileId(null);
            }}
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
