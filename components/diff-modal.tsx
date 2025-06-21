"use client";

import React from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  oldContent: string;
  newContent: string;
  children?: React.ReactNode;
}

const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  fileName,
  oldContent,
  newContent,
  children,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto h-full relative">
          {/* @ts-ignore */}
          <ReactDiffViewer
            oldValue={oldContent}
            newValue={newContent}
            splitView={true}
            useDarkTheme={true}
          />
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiffModal; 