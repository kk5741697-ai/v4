"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { FileType } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"

const mergeOptions = [
  {
    key: "mergeMode",
    label: "Merge Mode",
    type: "select" as const,
    defaultValue: "sequential",
    selectOptions: [
      { value: "sequential", label: "Sequential Order" },
      { value: "interleave", label: "Interleave Pages" },
      { value: "custom", label: "Custom Order" },
    ],
  },
  {
    key: "addBookmarks",
    label: "Add Bookmarks",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "preserveMetadata",
    label: "Preserve Metadata",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function mergePDFs(files: any[], options: any) {
  try {
    if (files.length < 2) {
      return {
        success: false,
        error: "At least 2 PDF files are required for merging",
      }
    }

    // Extract actual File objects
    const fileObjects = files.map((f) => f.file)

    // Process PDF merging using real PDF-lib
    const mergedPdfBytes = await PDFProcessor.mergePDFs(fileObjects, options)

    // Create download blob
    const blob = new Blob([mergedPdfBytes], { type: "application/pdf" })
    const downloadUrl = URL.createObjectURL(blob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge PDFs",
    }
  }
}

export default function PDFMergerPage() {
  return (
    <PDFToolLayout
      title="PDF Merger"
      description="Combine multiple PDF files into one document with custom page ordering and bookmark preservation. Perfect for merging reports, presentations, and documents."
      icon={FileType}
      toolType="merge"
      processFunction={mergePDFs}
      options={mergeOptions}
      maxFiles={10}
      allowPageSelection={true}
      allowPageReorder={true}
    />
  )
}
