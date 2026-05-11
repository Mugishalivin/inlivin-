import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertCircle, CheckCircle, File, Image as ImageIcon, Video, ExternalLink } from "lucide-react";
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
  { value: "events", label: "Event/Announcement" },
  { value: "announcements", label: "Announcement" },
  { value: "messages", label: "Message" },
  { value: "connections", label: "Connection" },
  { value: "notifications", label: "Notification" },
  { value: "call_sessions", label: "Call Session" },
  { value: "comments", label: "Comment" },
];

// List of tables to search when auto-detecting
const SEARCHABLE_TABLES = [
  "profiles", "selling_items", "projects", "events", "announcements",
  "messages", "connections", "notifications", "call_sessions", "comments"
];

const getRecordTypeLabel = (tableType: string): string => {
  return RECORD_TYPES.find(t => t.value === tableType)?.label || tableType;
};

// Get the primary image for projects, events, announcements
const getPrimaryImage = (data: any, recordType: string): string | null => {
  if (!['projects', 'events', 'announcements'].includes(recordType)) {
    return null;
  }

  // Try common image field names in order of preference
  const imageFieldPriorities = [
    'image', 'image_url', 'cover_image', 'cover_url',
    'thumbnail', 'thumbnail_url', 'photo', 'photo_url',
    'featured_image', 'featured_image_url'
  ];

  for (const field of imageFieldPriorities) {
    if (data[field] && typeof data[field] === 'string') {
      return data[field];
    }
  }

  return null;
};

const MEDIA_FIELDS = [
  "image_url", "image", "photo", "avatar", "thumbnail",
  "video_url", "video", "media_url", "file_url", "url",
  "document_url", "doc_url", "pdf_url"
];

const getMediaItems = (data: any) => {
  const media: Array<{ type: 'image' | 'video' | 'document', url: string, label: string }> = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (value && typeof value === 'string' && MEDIA_FIELDS.some(field => key.toLowerCase().includes(field))) {
      if (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || 
          key.toLowerCase().includes('avatar') || key.toLowerCase().includes('thumbnail')) {
        media.push({ type: 'image', url: value, label: key });
      } else if (key.toLowerCase().includes('video')) {
        media.push({ type: 'video', url: value, label: key });
      } else if (key.toLowerCase().includes('document') || key.toLowerCase().includes('doc') || 
                 key.toLowerCase().includes('pdf') || key.toLowerCase().includes('file')) {
        media.push({ type: 'document', url: value, label: key });
      } else if (key === 'media_url' || key === 'url') {
        // Try to infer from URL extension
        if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          media.push({ type: 'image', url: value, label: key });
        } else if (value.match(/\.(mp4|webm|ogg|mov)$/i)) {
          media.push({ type: 'video', url: value, label: key });
        } else if (value.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/i)) {
          media.push({ type: 'document', url: value, label: key });
        }
      }
    }
  });
  
  return media;
};

export default function AdminLookupPage() {
  const [searchId, setSearchId] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ["admin-lookup-auto", searchId],
    queryFn: async () => {
      if (!searchId.trim()) {
        throw new Error("Please enter an ID to search");
      }

      const trimmedId = searchId.trim();

      try {
        // Try searching in each table until we find a match
        for (const tableName of SEARCHABLE_TABLES) {
          const { data, error: err } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", trimmedId);

          // If we got data and no error, return the first result
          if (!err && data && Array.isArray(data) && data.length > 0) {
            return { type: tableName, data: data[0] };
          }
        }

        // If no record found in any table
        throw new Error(`No record found with ID: ${trimmedId}`);
      } catch (err: any) {
        throw new Error(err.message || "Failed to search record");
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

  const renderRecordContent = (data: any, recordType: string) => {
    const entries = Object.entries(data);
    const mediaItems = getMediaItems(data);
    const primaryImage = getPrimaryImage(data, recordType);

    // Filter out the primary image from media gallery to avoid duplication
    const filteredMediaItems = primaryImage
      ? mediaItems.filter(item => item.url !== primaryImage)
      : mediaItems;

    return (
      <div className="space-y-6">
        {/* Featured Image for Projects/Events/Announcements */}
        {primaryImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold text-foreground uppercase">Preview</h3>
            <div className="relative rounded-lg overflow-hidden border-2 border-primary/30 bg-secondary/30 shadow-lg">
              <img
                src={primaryImage}
                alt={`${recordType} preview`}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Media Gallery */}
        {filteredMediaItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground uppercase">Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredMediaItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-lg overflow-hidden border border-border bg-secondary/30 hover:border-primary/50 transition-colors"
                >
                  {item.type === 'image' && (
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('div')?.classList.remove('hidden');
                      }}
                    />
                  )}
                  {item.type === 'video' && (
                    <video
                      src={item.url}
                      controls
                      className="w-full h-32 object-cover bg-black"
                    />
                  )}
                  {item.type === 'document' && (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <File className="w-8 h-8 text-blue-400" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-primary/80 hover:bg-primary text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="flex items-center gap-1">
                      {item.type === 'image' && <ImageIcon className="w-3 h-3 text-blue-400" />}
                      {item.type === 'video' && <Video className="w-3 h-3 text-green-400" />}
                      {item.type === 'document' && <File className="w-3 h-3 text-orange-400" />}
                      <span className="text-xs text-white truncate">{item.label}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Field Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase">Record Data</h3>
          {entries
            .filter(([key]) => {
              // Filter out media fields
              if (MEDIA_FIELDS.some(field => key.toLowerCase().includes(field))) {
                return false;
              }
              // Filter out primary image field when it's used for featured image
              if (primaryImage && ['projects', 'events', 'announcements'].includes(recordType)) {
                const imageFieldPriorities = [
                  'image', 'image_url', 'cover_image', 'cover_url',
                  'thumbnail', 'thumbnail_url', 'photo', 'photo_url',
                  'featured_image', 'featured_image_url'
                ];
                if (imageFieldPriorities.includes(key)) {
                  return false;
                }
              }
              return true;
            })
            .map(([key, value]) => (
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
            <div>
              <label className="text-sm font-medium">Record ID</label>
              <Input
                placeholder="Enter ID to search... (auto-detects record type)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="mt-2"
              />
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
                          {getRecordTypeLabel(record.type)} • ID: {searchId}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {getRecordTypeLabel(record.type)}
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
                        {renderRecordContent(record.data, record.type)}
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
            <p className="text-sm">Enter an ID to search across all record types</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
