"use client"

import { ToolLayout, ProcessedFile } from "@/components/tool-layout"
import { FileType } from "lucide-react"
import { PDFProcessor } from "@/lib/processors/pdf-processor"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { GripVertical, FileText, RotateCw } from "lucide-react"


export default function PDFMergerPage() {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [addBookmarks, setAddBookmarks] = useState(true)
  const [preserveMetadata, setPreserveMetadata] = useState(true)
  const [pdfPagesMap, setPdfPagesMap] = useState<Map<string, any[]>>(new Map())

  useEffect(() => {
    // Load PDF pages for preview
    files.forEach(async (file) => {
      if (file.originalFile.type === "application/pdf" && !pdfPagesMap.has(file.id)) {
        try {
          const { pages } = await PDFProcessor.getPDFInfo(file.originalFile)
          setPdfPagesMap(prev => new Map(prev.set(file.id, pages)))
        } catch (error) {
          console.error("Failed to load PDF pages:", error)
        }
      }
    })
  }, [files])

  const handleProcess = async (filesToProcess: ProcessedFile[]) => {
    if (filesToProcess.length < 2) {
      throw new Error("At least 2 PDF files are required for merging")
    }

    setIsProcessing(true)
    
    try {
      const file = filesToProcess[0] // We'll update the first file with the result
      file.status = "processing"
      file.progress = 0
      setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))

      // Progress simulation
      for (let i = 0; i <= 80; i += 20) {
        file.progress = i
        setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      const fileObjects = filesToProcess.map(f => f.originalFile)
      const mergedPdfBytes = await PDFProcessor.mergePDFs(fileObjects, {
        addBookmarks,
        preserveMetadata
      })

      const mergedBlob = new Blob([mergedPdfBytes], { type: "application/pdf" })

      const updatedFile = {
        ...file,
        status: "completed" as const,
        progress: 100,
        processedBlob: mergedBlob,
        processedSize: mergedBlob.size,
        name: "merged-document.pdf"
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

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(files)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFiles(items)
  }

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document with custom page ordering and bookmark preservation. Perfect for merging reports, presentations, and documents."
      icon={FileType}
      files={files}
      onFilesChange={setFiles}
      onProcess={handleProcess}
      isProcessing={isProcessing}
      acceptedTypes={["application/pdf"]}
      maxFiles={10}
      allowBulk={true}
      processingOptions={
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-bookmarks"
              checked={addBookmarks}
              onCheckedChange={setAddBookmarks}
            />
            <Label htmlFor="add-bookmarks" className="text-sm">
              Add Bookmarks
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preserve-metadata"
              checked={preserveMetadata}
              onCheckedChange={setPreserveMetadata}
            />
            <Label htmlFor="preserve-metadata" className="text-sm">
              Preserve Metadata
            </Label>
          </div>
        </div>
      }
    >
      {/* PDF Pages Preview */}
      {files.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>PDF Files Order</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="pdf-files">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {files.map((file, index) => (
                        <Draggable key={file.id} draggableId={file.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border border-gray-200 rounded-lg p-4 bg-white"
                            >
                              <div className="flex items-center space-x-4">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                                <FileText className="h-6 w-6 text-red-500" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{file.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {pdfPagesMap.get(file.id)?.length || 0} pages
                                  </p>
                                </div>
                                <Badge variant="outline">{index + 1}</Badge>
                              </div>
                              
                              {/* Page Thumbnails */}
                              {pdfPagesMap.get(file.id) && (
                                <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                  {pdfPagesMap.get(file.id)!.slice(0, 8).map((page) => (
                                    <div key={page.pageNumber} className="relative">
                                      <div className="aspect-[3/4] bg-gray-100 rounded border overflow-hidden">
                                        <img
                                          src={page.thumbnail}
                                          alt={`Page ${page.pageNumber}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 text-center">
                                        {page.pageNumber}
                                      </div>
                                    </div>
                                  ))}
                                  {pdfPagesMap.get(file.id)!.length > 8 && (
                                    <div className="aspect-[3/4] bg-gray-100 rounded border flex items-center justify-center">
                                      <span className="text-xs text-gray-500">
                                        +{pdfPagesMap.get(file.id)!.length - 8}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </div>
      )}
    </ToolLayout>
  )
}
