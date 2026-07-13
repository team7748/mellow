export function parseCSV<T = any>(csvText: string): T[] {
  if (!csvText || typeof csvText !== "string") return []

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "")
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const result: T[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const obj: any = {}
      headers.forEach((header, index) => {
        // convert to camelCase for the keys if needed, or leave as is.
        // the CSV has snake_case headers. We will camelCase them.
        const key = toCamelCase(header.trim())
        let value = values[index].trim()
        
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1)
        }
        // Unescape double quotes
        value = value.replace(/""/g, '"')

        // Attempt numeric conversion for any valid number strings
        if (value !== "" && !isNaN(Number(value))) {
            obj[key] = Number(value)
        } else {
            obj[key] = value
        }
      })
      result.push(obj as T)
    }
  }
  return result
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let currentVal = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentVal += '"'
        i++ // skip the escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal)
      currentVal = ""
    } else {
      currentVal += char
    }
  }
  result.push(currentVal)
  return result
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}
