import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface RecordData {
  type: string;
  data: any;
}

const RECORD_TYPES = [
  { value: "profiles", label: "User Profile" },
  { value: "selling_items", label: "Selling Item" },
  { value: "projects", label: "Project" },
  { value: "events", label: "Event" },
  { value: "messages", label: "Message" },
  { value: "connections", label: "Connection" },
  { value: "notifications", label: "Notification" },
  { value: "call_sessions", label: "Call Session" },
  { value: "comments", label: "Comment" },
];

export default function AdminLookupPage() {
  const [searchId, setSearchId] = useState("");
  const [recordType, setRecordType] = useState("profiles");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ["admin-lookup", recordType, searchId],
    queryFn: async () => {
      if (!searchId.trim()) {
        throw new Error("Please enter an ID to search");
      }

      try {
        const { data, error: err } = await supabase
          .from(recordType)
          .select("*")
          .eq("id", searchId.trim())
          .single();

        if (err) {
          throw new Error(`Record not found: ${err.message}`);
        }

        return { type: recordType, data };
      } catch (err: any) {
        throw new Error(err.message || "Failed to fetch record");
      }
    },
    enabled: searchTriggered && !!searchId.trim(),
  });

  const handleSearch = () => {
    if (!searchId.trim()) {
      toast.error("Please enter an ID");
      return;
    }
    setSearchTriggered(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const renderRecordContent = (data: any) => {
    const entries = Object.entries(data);

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b pb-3 last:border-b-0"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-sm mt-1 break-words">
                  {value === null || value === undefined ? (
                    <span className="text-muted-foreground italic">null</span>
                  ) : typeof value === "object" ? (
                    <pre className="bg-secondary p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : typeof value === "boolean" ? (
                    <Badge
                      variant={value ? "default" : "secondary"}
                      className="w-fit"
                    >
                      {value ? "True" : "False"}
                    </Badge>
                  ) : (
                    String(value)
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Database Lookup</h1>
          <p className="text-muted-foreground mt-2">
            Search for and view records from the database by ID
          </p>
        </div>

        {/* Search Panel */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Record ID</label>
                <Input
                  placeholder="Enter ID to search..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Record Type</label>
                <Select value={recordType} onValueChange={setRecordType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchId.trim()}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searchTriggered && (
          <>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-12"
              >
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-destructive">Not Found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {error instanceof Error
                            ? error.message
                            : "Record not found. Please check the ID and try again."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {record && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Record Found
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {record.type} • ID: {searchId}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {record.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="view" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="view">View</TabsTrigger>
                        <TabsTrigger value="json">JSON</TabsTrigger>
                      </TabsList>
                      <TabsContent value="view" className="mt-4">
                        {renderRecordContent(record.data)}
                      </TabsContent>
                      <TabsContent value="json" className="mt-4">
                        <pre className="bg-secondary p-4 rounded-lg overflow-auto max-h-96 text-xs">
                          {JSON.stringify(record.data, null, 2)}
                        </pre>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* Info Box */}
        {!searchTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p className="text-sm">Enter an ID and select a record type to search</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
