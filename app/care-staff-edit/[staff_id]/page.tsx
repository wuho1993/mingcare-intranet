import { notFound } from 'next/navigation'
import CareStaffEditClient from './CareStaffEditClient'

// Required for static export - generates empty params since this is a dynamic page
// This ensures compatibility with Next.js static export
export async function generateStaticParams() {
  // Return empty array for dynamic client-side routing
  return []
}

export default function CareStaffEdit({ params }: { params: { staff_id: string } }) {
  // Validate params exist
  if (!params.staff_id) {
    notFound()
  }
  
  return <CareStaffEditClient params={params} />
}
