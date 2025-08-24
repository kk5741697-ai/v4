"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { Scissors } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const splitOptions = [
  {
    key: "splitMode",
    label: "Split Mode",
    type: "select" as const,
    defaultValue: "pages",
    selectOptions: [
      { value: "pages", label: "Split by Page Ranges" },
      { value: "size", label: "Split by File Size" },
      { value: "bookmarks", label: "Split by Bookmarks" },
      { value: "equal", label: "Split into Equal Parts" },
    ],
  },
  {
    key: "maxFileSize",
    label: "Max File Size (MB)",
    type: "number" as const,
    defaultValue: 10,
  },
  {
    key: "equalParts",
    label: "Number of Parts",
    type: "number" as const,
    defaultValue: 2,
  },
  {
    key: "preserveBookmarks",
    label: "Preserve Bookmarks",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function splitPDF(files: any[], options: any) {
  try {
    if (files.length !== 1) {
      return {
        success: false,
        error: "Please select exactly one PDF file to split",
      }
    }

    const file = files[0].file
    let ranges: Array<{ from: number; to: number }> = []

    // Determine split ranges based on mode and options
    if (options.rangeMode === "custom" && options.customRanges) {
      ranges = options.customRanges
    } else if (options.splitMode === "equal") {
      const totalPages = files[0].pages.length
      const pagesPerPart = Math.ceil(totalPages / options.equalParts)
      for (let i = 0; i < options.equalParts; i++) {
        const from = i * pagesPerPart + 1
        const to = Math.min((i + 1) * pagesPerPart, totalPages)
        if (from <= totalPages) {
          ranges.push({ from, to })
        }
      }
    } else {
      // Default: split each page individually
      for (let i = 1; i <= files[0].pages.length; i++) {
        ranges.push({ from: i, to: i })
      }
    }

    // Process PDF splitting using real PDF-lib
    const splitResults = await PDFProcessor.splitPDF(file, ranges)

    // Create ZIP file with all split PDFs
    const zip = new JSZip()

    splitResults.forEach((pdfBytes, index) => {
      const range = ranges[index]
      const filename = `${file.name.replace(".pdf", "")}_pages_${range.from}-${range.to}.pdf`
      zip.file(filename, pdfBytes)
    })

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const downloadUrl = URL.createObjectURL(zipBlob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to split PDF",
    }
  }
}

export default function PDFSplitterPage() {
  return (
    <PDFToolLayout
      title="PDF Splitter"
      description="Split large PDF files into smaller documents by page ranges, file size, bookmarks, or equal parts. Extract specific pages or sections easily."
      icon={Scissors}
      toolType="split"
      processFunction={splitPDF}
      options={splitOptions}
      maxFiles={1}
      allowPageSelection={true}
    />
  )
}
