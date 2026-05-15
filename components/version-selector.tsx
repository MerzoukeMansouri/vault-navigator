"use client";

import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowRightLeft, Calendar, Hash } from "lucide-react";
import { motion } from "framer-motion";

interface VersionSelectorProps {
  versions: Array<{ version: number; created_time: string }>;
  currentVersion: number;
  onCompare: (v1: number, v2: number) => void;
  isLoading?: boolean;
}

export function VersionSelector({
  versions,
  currentVersion,
  onCompare,
  isLoading = false,
}: VersionSelectorProps) {
  const [selectedVersion, setSelectedVersion] = React.useState<number | null>(
    null
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleCompare = () => {
    if (selectedVersion && selectedVersion !== currentVersion) {
      onCompare(currentVersion, selectedVersion);
    }
  };

  const canCompare = selectedVersion && selectedVersion !== currentVersion;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Version */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Version</div>
              <div className="flex items-center gap-2 p-2 rounded bg-background border">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{currentVersion}</span>
              </div>
              {versions.find((v) => v.version === currentVersion) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(
                    versions.find((v) => v.version === currentVersion)?.created_time || ""
                  )}
                </p>
              )}
            </div>

            {/* Compare With */}
            <div className="space-y-2">
              <label htmlFor="compare-version-select" className="text-sm font-medium">Compare With</label>
              <select
                id="compare-version-select"
                value={selectedVersion?.toString() || ""}
                onChange={(e) =>
                  setSelectedVersion(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full px-3 py-2 rounded border bg-background text-sm"
              >
                <option value="">Select version</option>
                {versions
                  .filter((v) => v.version !== currentVersion)
                  .map((v) => (
                    <option key={v.version} value={v.version.toString()}>
                      v{v.version} - {formatDate(v.created_time)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Compare Button */}
            <div className="flex items-end">
              <Button
                onClick={handleCompare}
                disabled={!canCompare || isLoading}
                className="w-full gap-2"
                size="sm"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Compare Versions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
