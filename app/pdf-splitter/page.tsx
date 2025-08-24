"use client"

import { ToolLayout, ProcessedFile } from "@/components/tool-layout"
import { Scissors } from "lucide-react"
import { PDFProcessor } from "@/lib/processors/pdf-processor"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Minus, FileText } from "lucide-react"

export default function PDFSplitterPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [splitMode, setSplitMode] = useState<"range" | "pages" | "size">("range")
  const [customRanges, setCustomRanges] = useState([{ from: 1, to: 7 }])
  const [equalParts, setEqualParts] = useState(2)
  const [mergeRanges, setMergeRanges] = useState(false)
  const [pdfPages, setPdfPages] = useState<any[]>([])

  useEffect(() => {
    if (files.length > 0 && files[0].originalFile.type === "application/pdf") {
      loadPDFPages(files[0].originalFile)
    }
  }, [files])

  const loadPDFPages = async (file: File) => {
    try {
      const { pages } = await PDFProcessor.getPDFInfo(file)
      setPdfPages(pages)
    } catch (error) {
      console.error("Failed to load PDF pages:", error)
    }
  }

  const handleProcess = async (filesToProcess: ProcessedFile[]) => {
    if (filesToProcess.length !== 1) {
      throw new Error("Please select exactly one PDF file to split")
    }

    setIsProcessing(true)
    
    try {
      const file = filesToProcess[0]
      file.status = "processing"
      file.progress = 0
      setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))

      let ranges: Array<{ from: number; to: number }> = []

      if (splitMode === "range") {
        ranges = customRanges
      } else if (splitMode === "pages") {
        // Split each page individually
        for (let i = 1; i <= pdfPages.length; i++) {
          ranges.push({ from: i, to: i })
        }
      } else if (splitMode === "size") {
        // Split into equal parts
        const totalPages = pdfPages.length
        const pagesPerPart = Math.ceil(totalPages / equalParts)
        for (let i = 0; i < equalParts; i++) {
          const from = i * pagesPerPart + 1
          const to = Math.min((i + 1) * pagesPerPart, totalPages)
          if (from <= totalPages) {
            ranges.push({ from, to })
          }
        }
      }

      // Progress simulation
      for (let i = 0; i <= 80; i += 20) {
        file.progress = i
        setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const splitResults = await PDFProcessor.splitPDF(file.originalFile, ranges)

      // Create ZIP with split PDFs
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      splitResults.forEach((pdfBytes, index) => {
        const range = ranges[index]
        const filename = `${file.name.replace(".pdf", "")}_pages_${range.from}-${range.to}.pdf`
        zip.file(filename, pdfBytes)
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })

      const updatedFile = {
        ...file,
        status: "completed" as const,
        progress: 100,
        processedBlob: zipBlob,
        processedSize: zipBlob.size
      }

      setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f))
    } catch (error) {
      const errorFile = {
        ...filesToProcess[0],
        status: "error" as const,
        error: error instanceof Error ? error.message : "Processing failed"
      }
      setFiles(prev => prev.map(f => f.id === errorFile.id ? errorFile : f))
    } finally {
      setIsProcessing(false)
    }
  }

  const addRange = () => {
    setCustomRanges(prev => [...prev, { from: 1, to: 1 }])
  }

  const removeRange = (index: number) => {
    if (customRanges.length > 1) {
      setCustomRanges(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateRange = (index: number, field: "from" | "to", value: number) => {
    setCustomRanges(prev => 
      prev.map((range, i) => 
        i === index ? { ...range, [field]: Math.max(1, value) } : range
      )
    )
  }

  return (
    <ToolLayout
      title="Split PDF"
      description="Split large PDF files into smaller documents by page ranges, file size, bookmarks, or equal parts. Extract specific pages or sections easily."
      icon={Scissors}
      files={files}
      onFilesChange={setFiles}
      onProcess={handleProcess}
      isProcessing={isProcessing}
      acceptedTypes={["application/pdf"]}
      maxFiles={1}
      allowBulk={false}
      processingOptions={
        <div className="space-y-4">
          <Tabs value={splitMode} onValueChange={(value) => setSplitMode(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="range" className="text-xs">
                <Scissors className="h-4 w-4 mr-1" />
                Range
              </TabsTrigger>
              <TabsTrigger value="pages" className="text-xs">
                <FileText className="h-4 w-4 mr-1" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="size" className="text-xs">
                <div className="h-4 w-4 mr-1 border border-current rounded" />
                Size
              </TabsTrigger>
            </TabsList>

            <TabsContent value="range" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Range mode:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={!mergeRanges ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMergeRanges(false)}
                    className="text-xs"
                  >
                    Custom ranges
                  </Button>
                  <Button
                    variant={mergeRanges ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMergeRanges(true)}
                    className="text-xs"
                  >
                    Fixed ranges
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Range 1</Label>
                {customRanges.map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label className="text-xs">from page</Label>
                    <Input
                      type="number"
                      min="1"
                      value={range.from}
                      onChange={(e) => updateRange(index, "from", parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-xs"
                    />
                    <Label className="text-xs">to</Label>
                    <Input
                      type="number"
                      min="1"
                      value={range.to}
                      onChange={(e) => updateRange(index, "to", parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-xs"
                    />
                    {customRanges.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRange(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRange}
                  className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Range
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="merge-ranges"
                  checked={mergeRanges}
                  onCheckedChange={setMergeRanges}
                />
                <Label htmlFor="merge-ranges" className="text-xs">
                  Merge all ranges in one PDF file.
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              <p className="text-sm text-gray-600">
                Split into individual pages (one page per PDF file)
              </p>
            </TabsContent>

            <TabsContent value="size" className="space-y-4">
              <div>
                <Label htmlFor="equal-parts" className="text-sm">Number of Parts</Label>
                <Input
                  id="equal-parts"
                  type="number"
                  min="2"
                  max="10"
                  value={equalParts}
                  onChange={(e) => setEqualParts(parseInt(e.target.value) || 2)}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    >
      {/* PDF Pages Preview */}
      {pdfPages.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>PDF Pages ({pdfPages.length})</span>
                <Badge variant="outline">Range 1</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {pdfPages.map((page) => (
                    <div
                      key={page.pageNumber}
                      className="relative border border-gray-200 rounded-lg overflow-hidden bg-white"
                    >
                      <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center">
                        <img
                          src={page.thumbnail}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 text-center">
                        {page.pageNumber}
                      </div>
                      {/* Range indicator */}
                      {customRanges.some(range => 
                        page.pageNumber >= range.from && page.pageNumber <= range.to
                      ) && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-500">...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ToolLayout>
  )
}