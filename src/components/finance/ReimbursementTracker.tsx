import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HandCoins,
  Plus,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { DriveDropzone } from "@/components/ui/DriveDropzone";
import { Input } from "@/components/ui/Input";
import { MarkdownTextarea } from "@/components/ui/MarkdownTextarea";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ReimbursementRequest, ReimbursementStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Claims", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Disbursed", value: "disbursed" },
  { label: "Rejected", value: "rejected" },
];

const DEFAULT_CATEGORY = "Organization Activity";

const STATUS_CONFIG: Record<
  ReimbursementStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "destructive" | "secondary";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending Review",
    variant: "warning",
    icon: Clock,
  },
  approved: {
    label: "Approved // Unpaid",
    variant: "secondary",
    icon: CheckCircle2,
  },
  disbursed: {
    label: "Disbursed",
    variant: "success",
    icon: HandCoins,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

export const ReimbursementTracker: React.FC = () => {
  const { user, isPresident, hasPermission } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const canManageFinance =
    hasPermission("manage_finance") ||
    hasPermission("audit_finance") ||
    isPresident;

  const [activeFilter, setActiveFilter] = useState("all");
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] =
    useState<ReimbursementRequest | null>(null);
  const [disburseTarget, setDisburseTarget] =
    useState<ReimbursementRequest | null>(null);

  // Form states for filing claim
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [proofFileId, setProofFileId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Review states
  const [rejectionReason, setRejectionReason] = useState("");

  // Disburse states
  const [referenceNo, setReferenceNo] = useState("");
  const [disburseNotes, setDisburseNotes] = useState("");

  const { data: claims = [], isLoading } = useQuery<ReimbursementRequest[]>({
    queryKey: queryKeys.reimbursementsFiltered(activeFilter),
    queryFn: () => {
      const q = activeFilter !== "all" ? `?status_filter=${activeFilter}` : "";
      return api.get<ReimbursementRequest[]>(`/finance/reimbursements${q}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      amount: number;
      category: string;
      receiptUrl?: string | null;
      proofFileId?: string | null;
      notes: string;
    }) => api.post<ReimbursementRequest>("/finance/reimbursements", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements });
      toastSuccess(
        "Claim submitted. Queued for finance review.",
      );
      resetFileForm();
      setIsFileModalOpen(false);
    },
    onError: (err: any) => {
      toastError(
        err.message || "Failed to submit reimbursement claim.",
      );
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: ReimbursementStatus;
      reason?: string;
    }) =>
      api.patch<ReimbursementRequest>(`/finance/reimbursements/${id}/review`, {
        status,
        rejectionReason: reason || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements });
      toastSuccess(
        `Claim status updated to ${updated.status.toUpperCase()}.`,
      );
      setReviewTarget(null);
      setRejectionReason("");
    },
    onError: (err: any) => {
      toastError(err.message || "Failed to update review.");
    },
  });

  const disburseMutation = useMutation({
    mutationFn: ({
      id,
      refNo,
      notes,
    }: {
      id: string;
      refNo?: string;
      notes?: string;
    }) =>
      api.post<ReimbursementRequest>(
        `/finance/reimbursements/${id}/disburse`,
        {
          referenceNo: refNo || undefined,
          notes: notes || undefined,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance });
      queryClient.invalidateQueries({ queryKey: queryKeys.financeSummary });
      toastSuccess(
        "Disbursement recorded and ledger expense generated.",
      );
      setDisburseTarget(null);
      setReferenceNo("");
      setDisburseNotes("");
    },
    onError: (err: any) => {
      toastError(
        err.message || "Failed to finalize disbursement.",
      );
    },
  });

  const resetFileForm = () => {
    setTitle("");
    setAmount("");
    setCategory(DEFAULT_CATEGORY);
    setReceiptUrl("");
    setProofFileId(null);
    setNotes("");
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof amount !== "number" || amount <= 0) {
      toastError("Amount must be greater than zero.");
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      amount,
      category: category.trim(),
      receiptUrl: receiptUrl || null,
      proofFileId,
      notes: notes.trim(),
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  // Compute summary aggregates
  const totalPending = claims
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const totalApproved = claims
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const totalDisbursed = claims
    .filter((c) => c.status === "disbursed")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">
                Pending Approval
              </p>
              <p className="text-xl font-bold font-mono text-amber-500 mt-1">
                {formatCurrency(totalPending)}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">
                Approved // Ready for Payout
              </p>
              <p className="text-xl font-bold font-mono text-blue-500 mt-1">
                {formatCurrency(totalApproved)}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">
                Total Disbursed
              </p>
              <p className="text-xl font-bold font-mono text-emerald-500 mt-1">
                {formatCurrency(totalDisbursed)}
              </p>
            </div>
            <div
              className={
                "p-2.5 rounded-full bg-emerald-500/10 text-emerald-500"
              }
            >
              <HandCoins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Filter Switcher */}
      <div
        className={
          "flex flex-col sm:flex-row items-stretch sm:items-center " +
          "justify-between gap-3 pb-2 border-b border-border/40"
        }
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={
                "min-h-[44px] px-3.5 py-1.5 rounded-md text-xs font-medium " +
                "transition-colors whitespace-nowrap " +
                (activeFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground")
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setIsFileModalOpen(true)}
          className="min-h-[44px] gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          File Reimbursement
        </Button>
      </div>

      {/* Claims List Table / View */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <Card className="border-dashed border-border/80 p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground">
              No Reimbursement Claims Found
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {canManageFinance
                ? "There are currently no reimbursement claims matching this filter."
                : "You have not submitted any out-of-pocket claims yet."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const statusMeta = STATUS_CONFIG[claim.status];
            const StatusIcon = statusMeta.icon;
            const isClaimant = claim.claimantId === user?.id;

            return (
              <Card
                key={claim.id}
                className={
                  "border-border/60 hover:border-border/90 " +
                  "transition-all duration-200"
                }
              >
                <CardContent className="p-4 sm:p-5">
                  <div
                    className={
                      "flex flex-col sm:flex-row sm:items-center " +
                      "justify-between gap-4"
                    }
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusMeta.variant} className="gap-1.5">
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusMeta.label}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {claim.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-base font-semibold text-foreground truncate">
                        {claim.title}
                      </h4>

                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          Claimant:{" "}
                          <strong className="text-foreground font-medium">
                            {claim.claimantName || "Officer"}
                            {isClaimant && " (You)"}
                          </strong>
                        </span>
                        {claim.reviewerName && (
                          <span>
                            Reviewed by:{" "}
                            <strong className="text-foreground font-medium">
                              {claim.reviewerName}
                            </strong>
                          </span>
                        )}
                      </div>

                      {claim.notes && (
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 mt-1">
                          {claim.notes}
                        </p>
                      )}

                      {claim.rejectionReason && (
                        <div
                          className={
                            "mt-2 p-2.5 rounded-md bg-destructive/10 " +
                            "border border-destructive/20 text-xs " +
                            "text-destructive flex items-start gap-2"
                          }
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">
                              Rejection Reason:
                            </span>{" "}
                            {claim.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={
                        "flex flex-row sm:flex-col items-center " +
                        "sm:items-end justify-between sm:justify-center " +
                        "gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 " +
                        "border-border/40 shrink-0"
                      }
                    >
                      <span className="text-lg sm:text-xl font-bold font-mono text-foreground">
                        {formatCurrency(Number(claim.amount))}
                      </span>

                      <div className="flex items-center gap-2">
                        {claim.receiptUrl && (
                          <a
                            href={claim.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={
                              "min-h-[44px] min-w-[44px] inline-flex " +
                              "items-center justify-center rounded-md " +
                              "border border-border/80 px-3 text-xs " +
                              "font-medium text-foreground hover:bg-muted"
                            }
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Receipt
                          </a>
                        )}

                        {canManageFinance && claim.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReviewTarget(claim)}
                            className="min-h-[44px]"
                          >
                            Review Claim
                          </Button>
                        )}

                        {canManageFinance && claim.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => setDisburseTarget(claim)}
                            className="min-h-[44px] gap-1.5"
                          >
                            <HandCoins className="w-4 h-4" />
                            Disburse
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* File Reimbursement Modal */}
      <Dialog
        open={isFileModalOpen}
        onOpenChange={setIsFileModalOpen}
        title="File Reimbursement Claim"
        description="Submit out-of-pocket expenses incurred for organization activities."
      >
        <form onSubmit={handleFileSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Expense Title / Purpose *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Venue sound system rental / Marker pens"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Amount (PHP) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Category *
              </label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="e.g. Logistics, Food, Materials"
              />
            </div>
          </div>

          <DriveDropzone
            label="Upload Proof of Official Receipt (OR)"
            moduleType="finance"
            title={title}
            merchant={title}
            amount={typeof amount === "number" ? amount : undefined}
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
            label="Justification & Breakdown Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Details on why this out-of-pocket expense was made..."
            minHeight="min-h-[85px]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFileModalOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="min-h-[44px]"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Review Modal (Finance Officer) */}
      <Dialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => !open && setReviewTarget(null)}
        title="Review Reimbursement Claim"
        description={
          reviewTarget
            ? `Review claim "${reviewTarget.title}" for ${formatCurrency(
                Number(reviewTarget.amount),
              )}`
            : ""
        }
      >
        {reviewTarget && (
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-muted/40 space-y-1.5 text-xs">
              <div>
                <span className="text-muted-foreground">Claimant:</span>{" "}
                <strong>{reviewTarget.claimantName || "Officer"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                <strong>{reviewTarget.category}</strong>
              </div>
              {reviewTarget.receiptUrl && (
                <div>
                  <a
                    href={reviewTarget.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Uploaded Receipt Proof
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Rejection Reason (Required only if rejecting)
              </label>
              <Input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete receipt, unapproved event"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="destructive"
                disabled={reviewMutation.isPending}
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toastError("Please provide a rejection reason.");
                    return;
                  }
                  reviewMutation.mutate({
                    id: reviewTarget.id,
                    status: "rejected",
                    reason: rejectionReason.trim(),
                  });
                }}
                className="min-h-[44px]"
              >
                Reject Claim
              </Button>
              <Button
                variant="default"
                disabled={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    id: reviewTarget.id,
                    status: "approved",
                  })
                }
                className="min-h-[44px]"
              >
                Approve Claim
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Disburse Modal (Finance Officer) */}
      <Dialog
        open={Boolean(disburseTarget)}
        onOpenChange={(open) => !open && setDisburseTarget(null)}
        title="Disburse Approved Claim"
        description="Mark claim as disbursed. An expense will be automatically created in the finance ledger."
      >
        {disburseTarget && (
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-muted/40 space-y-1.5 text-xs">
              <div>
                <span className="text-muted-foreground">Claim:</span>{" "}
                <strong>{disburseTarget.title}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>{" "}
                <strong className="text-foreground font-mono">
                  {formatCurrency(Number(disburseTarget.amount))}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Payee:</span>{" "}
                <strong>{disburseTarget.claimantName || "Officer"}</strong>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Disbursement Reference / GCash Reference No.
              </label>
              <Input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. GCASH-REF-889102 or CHECK-0012"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Disbursement Notes
              </label>
              <Input
                type="text"
                value={disburseNotes}
                onChange={(e) => setDisburseNotes(e.target.value)}
                placeholder="e.g. Sent via GCash to claimant's registered mobile"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisburseTarget(null)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={disburseMutation.isPending}
                onClick={() =>
                  disburseMutation.mutate({
                    id: disburseTarget.id,
                    refNo: referenceNo.trim(),
                    notes: disburseNotes.trim(),
                  })
                }
                className="min-h-[44px]"
              >
                {disburseMutation.isPending
                  ? "Recording Payout..."
                  : "Confirm & Disburse"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
