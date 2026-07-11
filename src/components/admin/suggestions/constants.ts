import {
  Sigma,
  ImageIcon,
  Table2,
  Code2,
  Heading1,
  Type,
  Sparkles,
  FileText,
} from 'lucide-react'
import React from 'react'

export const blockTypeIcons: Record<string, React.ElementType> = {
  math: Sigma,
  image: ImageIcon,
  data: Table2,
  code: Code2,
  heading: Heading1,
  text: Type,
  divider: Sparkles,
  pdf: FileText,
}

export const blockTypeLabels: Record<string, string> = {
  math: 'ম্যাথ',
  image: 'ছবি',
  data: 'ডাটা',
  code: 'কোড',
  heading: 'হেডিং',
  text: 'টেক্সট',
  divider: 'বিভাজক',
  pdf: 'পিডিএফ',
}
