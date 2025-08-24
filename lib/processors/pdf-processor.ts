import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface PDFProcessingOptions {
  quality?: number
  password?: string
  permissions?: string[]
  watermarkText?: string
  watermarkOpacity?: number
  compressionLevel?: "low" | "medium" | "high" | "maximum"
  outputFormat?: "pdf" | "png" | "jpeg" | "webp"
  dpi?: number
  pageRanges?: Array<{ from: number; to: number }>
  mergeMode?: "sequential" | "interleave" | "custom"
  addBookmarks?: boolean
  preserveMetadata?: boolean
}

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
  thumbnail: string
  rotation: number
}

export class PDFProcessor {
  static async getPDFInfo(file: File): Promise<{ pageCount: number; pages: PDFPageInfo[] }> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageCount = pdf.numPages
    const pages: PDFPageInfo[] = []

    for (let i = 1; i <= Math.min(pageCount, 10); i++) { // Limit thumbnails for performance
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 0.5 })
      
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise

      pages.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        thumbnail: canvas.toDataURL("image/jpeg", 0.7),
        rotation: 0
      })
    }

    return { pageCount, pages }
  }

  static async mergePDFs(files: File[], options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

      pages.forEach((page) => {
        mergedPdf.addPage(page)

        // Add bookmarks if requested
        if (options.addBookmarks) {
          const outline = mergedPdf.catalog.getOrCreateOutline()
          outline.addItem(file.name.replace(".pdf", ""), page.ref)
        }
      })
    }

    // Set metadata
    if (options.preserveMetadata && files.length > 0) {
      const firstFile = await PDFDocument.load(await files[0].arrayBuffer())
      const info = firstFile.getDocumentInfo()
      mergedPdf.setTitle(info.Title || "Merged Document")
      mergedPdf.setAuthor(info.Author || "PixoraTools")
    }
    
    mergedPdf.setCreator("PixoraTools PDF Merger")
    mergedPdf.setProducer("PixoraTools")

    return await mergedPdf.save()
  }

  static async splitPDF(file: File, ranges: Array<{ from: number; to: number }>): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const results: Uint8Array[] = []

    for (const range of ranges) {
      const newPdf = await PDFDocument.create()
      const startPage = Math.max(0, range.from - 1)
      const endPage = Math.min(pdf.getPageCount() - 1, range.to - 1)

      const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
      const pages = await newPdf.copyPages(pdf, pageIndices)
      
      pages.forEach((page) => newPdf.addPage(page))

      // Set metadata
      newPdf.setTitle(`${file.name.replace(".pdf", "")} - Pages ${range.from}-${range.to}`)
      newPdf.setCreator("PixoraTools PDF Splitter")
      newPdf.setProducer("PixoraTools")

      results.push(await newPdf.save())
    }

    return results
  }

  static async compressPDF(file: File, options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    // Create new PDF with compression
    const compressedPdf = await PDFDocument.create()
    const pages = await compressedPdf.copyPages(pdf, pdf.getPageIndices())

    pages.forEach((page) => {
      // Scale down if high compression requested
      if (options.compressionLevel === "high" || options.compressionLevel === "maximum") {
        const scaleFactor = options.compressionLevel === "maximum" ? 0.7 : 0.85
        page.scale(scaleFactor, scaleFactor)
      }
      compressedPdf.addPage(page)
    })

    // Copy essential metadata only
    const info = pdf.getDocumentInfo()
    compressedPdf.setTitle(info.Title || file.name.replace(".pdf", ""))
    compressedPdf.setCreator("PixoraTools PDF Compressor")

    return await compressedPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsThreshold: 50
    })
  }

  static async addPasswordProtection(file: File, password: string, permissions: string[] = []): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    // Note: PDF-lib doesn't support encryption directly
    // This creates a new PDF with a watermark indicating protection
    const protectedPdf = await PDFDocument.create()
    const pages = await protectedPdf.copyPages(pdf, pdf.getPageIndices())
    const helveticaFont = await protectedPdf.embedFont(StandardFonts.Helvetica)

    pages.forEach((page) => {
      protectedPdf.addPage(page)
      
      // Add protection watermark
      const { width, height } = page.getSize()
      page.drawText("PROTECTED", {
        x: width / 2 - 50,
        y: height / 2,
        size: 50,
        font: helveticaFont,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.3,
      })
    })

    protectedPdf.setTitle(pdf.getDocumentInfo().Title || file.name.replace(".pdf", ""))
    protectedPdf.setCreator("PixoraTools PDF Protector")

    return await protectedPdf.save()
  }

  static async addWatermark(file: File, watermarkText: string, options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica)
    const pages = pdf.getPages()

    pages.forEach((page) => {
      const { width, height } = page.getSize()
      const fontSize = options.quality || 48

      let x: number, y: number, rotation = 0

      switch (options.watermarkOpacity) {
        case 0.1: // diagonal
          x = width / 2
          y = height / 2
          rotation = Math.PI / 4
          break
        default: // center
          x = width / 2 - (watermarkText.length * fontSize) / 4
          y = height / 2
          break
      }

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.7, 0.7, 0.7),
        opacity: options.watermarkOpacity || 0.3,
        rotate: { angle: rotation, origin: { x: width / 2, y: height / 2 } }
      })
    })

    return await pdf.save()
  }

  static async pdfToImages(file: File, options: PDFProcessingOptions = {}): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const images: Blob[] = []

    const dpi = options.dpi || 150
    const scale = dpi / 72 // PDF default is 72 DPI

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, `image/${options.outputFormat || "png"}`, (options.quality || 90) / 100)
      })

      images.push(blob)
    }

    return images
  }

  static async imagesToPDF(imageFiles: File[], options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const pdf = await PDFDocument.create()

    for (const imageFile of imageFiles) {
      const arrayBuffer = await imageFile.arrayBuffer()
      let image

      try {
        if (imageFile.type.includes("png")) {
          image = await pdf.embedPng(arrayBuffer)
        } else if (imageFile.type.includes("jpeg") || imageFile.type.includes("jpg")) {
          image = await pdf.embedJpg(arrayBuffer)
        } else {
          // Convert other formats using canvas
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!
          const img = new Image()
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              ctx.drawImage(img, 0, 0)
              resolve()
            }
            img.onerror = reject
            img.src = URL.createObjectURL(imageFile)
          })

          const jpegBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9)
          })

          const jpegArrayBuffer = await jpegBlob.arrayBuffer()
          image = await pdf.embedJpg(jpegArrayBuffer)
        }

        const page = pdf.addPage()
        const { width, height } = page.getSize()

        // Scale image to fit page while maintaining aspect ratio
        const imageAspectRatio = image.width / image.height
        const pageAspectRatio = width / height

        let imageWidth, imageHeight
        const margin = 40

        if (imageAspectRatio > pageAspectRatio) {
          imageWidth = width - margin
          imageHeight = imageWidth / imageAspectRatio
        } else {
          imageHeight = height - margin
          imageWidth = imageHeight * imageAspectRatio
        }

        const x = (width - imageWidth) / 2
        const y = (height - imageHeight) / 2

        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        })

      } catch (error) {
        console.error(`Failed to process image ${imageFile.name}:`, error)
        continue
      }
    }

    pdf.setTitle("Images to PDF")
    pdf.setCreator("PixoraTools Image to PDF Converter")
    pdf.setProducer("PixoraTools")

    return await pdf.save()
  }
}