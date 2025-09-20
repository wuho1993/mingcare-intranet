import CareStaffEditClient from './CareStaffEditClient'

// Required for static export - generates empty params since this is a dynamic page
export function generateStaticParams() {
  return []
}

export default function CareStaffEdit({ params }: { params: { staff_id: string } }) {
  return <CareStaffEditClient params={params} />
}
