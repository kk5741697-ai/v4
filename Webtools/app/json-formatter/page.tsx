"use client"

import { TextToolLayout } from "@/components/text-tool-layout"
import { FileText } from "lucide-react"

const jsonExamples = [
  {
    name: "Simple Object",
    content: '{"name":"John","age":30,"city":"New York"}',
  },
  {
    name: "Array",
    content: '[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]',
  },
  {
    name: "Nested Object",
    content: '{"user":{"profile":{"name":"John","settings":{"theme":"dark","notifications":true}}}}',
  },
]

const jsonOptions = [
  {
    key: "indent",
    label: "Indentation",
    type: "select" as const,
    defaultValue: "2",
    selectOptions: [
      { value: "2", label: "2 spaces" },
      { value: "4", label: "4 spaces" },
      { value: "tab", label: "Tab" },
    ],
  },
  {
    key: "sortKeys",
    label: "Sort Keys",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "removeComments",
    label: "Remove Comments",
    type: "checkbox" as const,
    defaultValue: false,
  },
]

function processJSON(input: string, options: any = {}) {
  try {
    // Parse JSON
    const parsed = JSON.parse(input)

    // Sort keys if requested
    const processedData = options.sortKeys ? sortObjectKeys(parsed) : parsed

    // Determine indentation
    let indent: string | number = 2
    if (options.indent === "tab") {
      indent = "\t"
    } else {
      indent = Number.parseInt(options.indent) || 2
    }

    // Stringify with formatting
    const output = JSON.stringify(processedData, null, indent)

    // Calculate stats
    const stats = {
      "Original Size": `${input.length} chars`,
      "Formatted Size": `${output.length} chars`,
      Objects: countObjects(parsed),
      Arrays: countArrays(parsed),
    }

    return { output, stats }
  } catch (error) {
    return {
      output: "",
      error: error instanceof Error ? error.message : "Invalid JSON format",
    }
  }
}

function validateJSON(input: string) {
  try {
    JSON.parse(input)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid JSON format",
    }
  }
}

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  } else if (obj !== null && typeof obj === "object") {
    const sorted: any = {}
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key])
      })
    return sorted
  }
  return obj
}

function countObjects(obj: any): number {
  let count = 0
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    count = 1
    Object.values(obj).forEach((value) => {
      count += countObjects(value)
    })
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => {
      count += countObjects(item)
    })
  }
  return count
}

function countArrays(obj: any): number {
  let count = 0
  if (Array.isArray(obj)) {
    count = 1
    obj.forEach((item) => {
      count += countArrays(item)
    })
  } else if (obj !== null && typeof obj === "object") {
    Object.values(obj).forEach((value) => {
      count += countArrays(value)
    })
  }
  return count
}

export default function JSONFormatterPage() {
  return (
    <TextToolLayout
      title="JSON Formatter"
      description="Beautify, validate, and format JSON data with syntax highlighting and error detection. Perfect for developers working with APIs and data structures."
      icon={FileText}
      placeholder="Paste your JSON here..."
      outputPlaceholder="Formatted JSON will appear here..."
      processFunction={processJSON}
      validateFunction={validateJSON}
      options={jsonOptions}
      examples={jsonExamples}
      fileExtensions={[".json", ".txt"]}
    />
  )
}
