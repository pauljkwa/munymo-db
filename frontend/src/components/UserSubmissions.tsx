import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, ThumbsUp, ThumbsDown, Calendar } from "lucide-react";
import brain from "brain";

interface Submission {
  id: string;
  user_id: string;
  exchange: string;
  company_a_ticker: string;
  company_a_name: string;
  company_b_ticker: string;
  company_b_name: string;
  reasoning: string;
  status: string;
  submitted_at: string;
  moderation_reason?: string;
  moderated_at?: string;
}

interface UserSubmissionsProps {
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function UserSubmissions({ setError, setIsLoading }: UserSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending_review");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Fetch submissions on component mount and when filter changes
  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      let queryParams: Record<string, string> = {};
      if (filterStatus !== "all") queryParams.status = filterStatus;

      const response = await brain.list_game_submissions(queryParams);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setError("Failed to load submissions. Please try again.");
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = (submission: Submission, approve: boolean) => {
    setCurrentSubmission(submission);
    setModerationReason("");
    
    if (approve) {
      // Set tomorrow's date as default for scheduling
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split("T")[0]);
      setShowScheduleDialog(true);
    } else {
      setShowReviewDialog(true);
    }
  };

  const handleRejectSubmission = async () => {
    if (!currentSubmission) return;
    
    try {
      setIsLoading(true);
      const response = await brain.update_game_submission(
        { submission_id: currentSubmission.id },
        {
          status: "rejected",
          reason: moderationReason,
        }
      );
      
      // Update the submission in the list
      setSubmissions(
        submissions.map((sub) =>
          sub.id === currentSubmission.id
            ? { ...sub, status: "rejected", moderation_reason: moderationReason, moderated_at: new Date().toISOString() }
            : sub
        )
      );
      
      toast.success("Submission rejected");
      setShowReviewDialog(false);
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAndSchedule = async () => {
    if (!currentSubmission || !scheduledDate) return;
    
    try {
      setIsLoading(true);
      const response = await brain.update_game_submission(
        { submission_id: currentSubmission.id },
        {
          status: "approved",
          reason: "Approved and scheduled",
          scheduled_date: scheduledDate,
        }
      );
      
      // Update the submission in the list
      setSubmissions(
        submissions.map((sub) =>
          sub.id === currentSubmission.id
            ? { ...sub, status: "approved", moderation_reason: "Approved and scheduled", moderated_at: new Date().toISOString() }
            : sub
        )
      );
      
      toast.success("Submission approved and scheduled");
      setShowScheduleDialog(false);
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve submission");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter submissions by search term
  const filteredSubmissions = submissions.filter(
    (submission) =>
      !searchTerm ||
      submission.company_a_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.company_b_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.company_a_ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.company_b_ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            className="w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                value={filterStatus} 
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No submissions found matching your filters.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Company A</TableHead>
                <TableHead>Company B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                  <TableCell>{submission.exchange}</TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.company_a_ticker}</div>
                    <div className="text-sm text-muted-foreground">{submission.company_a_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.company_b_ticker}</div>
                    <div className="text-sm text-muted-foreground">{submission.company_b_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(submission.status)}`}>
                      {formatStatus(submission.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {submission.status === "pending_review" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleReviewSubmission(submission, true)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleReviewSubmission(submission, false)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="moderation-reason">Reason for Rejection</Label>
              <Textarea
                id="moderation-reason"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={4}
                placeholder="Provide a reason for rejecting this submission"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRejectSubmission} variant="destructive">
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve & Schedule Game</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="scheduled-date">Choose Game Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                The game will be scheduled for the selected date and made available to players.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleApproveAndSchedule}>
              Approve & Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to get badge color based on status
function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pending_review":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper function to format status for display
function formatStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "pending_review":
      return "Pending Review";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
