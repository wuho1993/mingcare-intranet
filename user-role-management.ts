// 前端 TypeScript: 用戶角色管理
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 1. 取得用戶角色
export async function getUserRole(userId?: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) return null

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      console.error('獲取用戶角色失敗:', error)
      return null
    }

    return data?.role || 'user'
  } catch (error) {
    console.error('用戶角色查詢錯誤:', error)
    return null
  }
}

// 2. 檢查用戶權限
export async function checkUserPermission(requiredRoles: string[]): Promise<boolean> {
  try {
    const userRole = await getUserRole()
    if (!userRole) return false

    return requiredRoles.includes(userRole)
  } catch (error) {
    console.error('權限檢查錯誤:', error)
    return false
  }
}

// 3. 設定用戶角色（僅管理員可用）
export async function setUserRole(userId: string, role: 'admin' | 'manager' | 'user') {
  try {
    // 檢查當前用戶是否為 admin
    const isAdmin = await checkUserPermission(['admin'])
    if (!isAdmin) {
      throw new Error('權限不足：僅管理員可設定用戶角色')
    }

    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('設定用戶角色失敗:', error)
    return { success: false, error }
  }
}

// 4. 管理員用戶管理界面
export async function getAllUsersWithRoles() {
  try {
    const isAdmin = await checkUserPermission(['admin'])
    if (!isAdmin) {
      throw new Error('權限不足：僅管理員可查看用戶列表')
    }

    // 聯合查詢 auth.users 和 user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        updated_at
      `)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('獲取用戶列表失敗:', error)
    return { success: false, error }
  }
}

// 使用範例
async function handleCustomerUpdate() {
  // 檢查是否有管理權限
  const canEdit = await checkUserPermission(['admin', 'manager'])
  
  if (!canEdit) {
    alert('權限不足：僅管理員和經理可修改客戶資料')
    return
  }

  // 執行更新操作
  // ...
}