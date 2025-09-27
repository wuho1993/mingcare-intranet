import CareStaffEditClient from './CareStaffEditClient'

export async function generateStaticParams() {
  return [] as Array<{ staff_id: string }>
}

export default function CareStaffEditPage({ 
  params 
}: { 
  params: { staff_id: string } 
}) {
  return <CareStaffEditClient params={params} />
}
