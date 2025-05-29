import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UploadCloud, AlertCircle, FileX, FileCheck, Loader2 } from "lucide-react";
import brain from "brain";

interface CsvUploadProps {
  setError?: (error: string | null) => void;
  setIsLoading?: (isLoading: boolean) => void;
}

interface UploadResponse {
  processed_rows: number;
  successful_uploads: number;
  failed_rows: number;
  errors: string[];
}

export function CsvUpload({ setError, setIsLoading }: CsvUploadProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [targetTable, setTargetTable] = useState<string>("asx_games");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setIsLoading?.(true);
    setError?.(null);
    setUploadResult(null);

    try {
      // Start progress simulation
      const progressInterval = simulateProgress();

      // Create FormData for the file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target_table", targetTable);

      // Upload the file
      const response = await fetch(
        "/api/admin/upload-game-data", 
        {
          method: "POST",
          body: formData,
          credentials: "include"
        }
      );

      // Clear progress simulation
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        
        if (result.successful_uploads > 0) {
          toast.success(`Successfully uploaded ${result.successful_uploads} records`);
        } else {
          toast.error(`Upload completed with 0 successful records`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload CSV");
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError?.(error instanceof Error ? error.message : "Failed to upload CSV");
      toast.error("Failed to upload CSV");
    } finally {
      setUploading(false);
      setIsLoading?.(false);
    }
  };

  // Simulate upload progress
  const simulateProgress = () => {
    return setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 10;
        const nextProgress = Math.min(prev + increment, 95); // Cap at 95% until complete
        return nextProgress;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Game Data CSV</CardTitle>
          <CardDescription>
            Upload CSV files containing game matchup data for upcoming games.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <Label htmlFor="table-select">Target Table</Label>
              <Select
                value={targetTable}
                onValueChange={setTargetTable}
              >
                <SelectTrigger id="table-select">
                  <SelectValue placeholder="Select target table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asx_games">ASX Games</SelectItem>
                  <SelectItem value="nyse_games">NYSE Games</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Select the exchange table where this data should be stored.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="flex flex-col items-center justify-center w-full">
                <label
                  htmlFor="csv-file"
                  className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV file with game data (max 10MB)
                    </p>
                    {file && (
                      <p className="mt-2 text-sm font-medium text-primary">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>Upload CSV</>
                )}
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Upload Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold">{uploadResult.processed_rows}</div>
                  <div className="text-sm text-muted-foreground">Rows Processed</div>
                </div>
                <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-green-600">{uploadResult.successful_uploads}</div>
                  <div className="text-sm text-muted-foreground">Successfully Uploaded</div>
                </div>
                <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-red-600">{uploadResult.failed_rows}</div>
                  <div className="text-sm text-muted-foreground">Failed Rows</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-600 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Upload Errors ({uploadResult.errors.length})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowErrors(!showErrors)}
                    >
                      {showErrors ? "Hide Errors" : "Show Errors"}
                    </Button>
                  </div>
                  
                  {showErrors && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTitle className="mb-2">The following errors occurred during upload:</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  {uploadResult.successful_uploads > 0 ? (
                    <FileCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <FileX className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm">
                    {uploadResult.successful_uploads > 0
                      ? "Upload completed with some success"
                      : "Upload completed with no successful records"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setUploadResult(null);
                  }}
                >
                  Upload Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>CSV Format Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your CSV file should include the following columns (in any order):
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left font-medium">Column</th>
                    <th className="py-2 px-4 text-left font-medium">Description</th>
                    <th className="py-2 px-4 text-left font-medium">Required</th>
                    <th className="py-2 px-4 text-left font-medium">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">exchange</td>
                    <td className="py-2 px-4">Exchange code (ASX or NYSE)</td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">ASX</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">game_date</td>
                    <td className="py-2 px-4">Date of the game</td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">2025-05-15</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">company_a_ticker</td>
                    <td className="py-2 px-4">Ticker symbol for company A</td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">AAPL</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">company_a_name</td>
                    <td className="py-2 px-4">Full name for company A</td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">Apple Inc.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">company_b_ticker</td>
                    <td className="py-2 px-4">Ticker symbol for company B</td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">MSFT</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">company_b_name</td>
                    <td className="py-2 px-4">Full name for company B</td>
                    <td className="py-2 px-4">Yes</td>
                    <td className="py-2 px-4">Microsoft Corporation</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">sector</td>
                    <td className="py-2 px-4">Industry sector</td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">Technology</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">reasoning</td>
                    <td className="py-2 px-4">Reason for pairing</td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">Major tech competitors</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">next_day_clue</td>
                    <td className="py-2 px-4">Clue about next day's game</td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">Energy sector coming tomorrow!</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">status</td>
                    <td className="py-2 px-4">Game status</td>
                    <td className="py-2 px-4">No</td>
                    <td className="py-2 px-4">scheduled</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
