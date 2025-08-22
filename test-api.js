// Test script to verify the billing-salary-management API
const testData = {
  "customer_id": "MC0055",
  "care_staff_name": "馬秀蘭",
  "service_date": "2025-08-20",
  "start_time": "14:00",
  "end_time": "20:00",
  "service_type": "PC-到⼾看顧(輔助⼈員)",
  "service_address": "九龍黃大仙東頭邨旺東樓601室",
  "service_fee": 780,
  "staff_salary": 630,
  "phone": "93876426",
  "customer_name": "陳婆婆(李小姐)",
  "service_hours": 6,
  "project_category": "MC街客",
  "project_manager": "Candy Ho"
}

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/billing-salary-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', result)
    
    if (response.ok) {
      console.log('✅ API call successful!')
    } else {
      console.log('❌ API call failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Error calling API:', error)
  }
}

testAPI()
