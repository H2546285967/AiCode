<template>
  <div>
    <h2 style="margin-bottom:16px">👤 个人中心</h2>
    <el-card v-if="user">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ user.phone || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ user.address || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ user.created_at }}</el-descriptions-item>
      </el-descriptions>
      <el-button type="primary" style="margin-top:16px" @click="showEdit = true">编辑资料</el-button>
    </el-card>

    <el-dialog v-model="showEdit" title="编辑资料" width="360px">
      <el-form :model="editForm" label-width="70px">
        <el-form-item label="手机号"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="editForm.address" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
const userStore = useUserStore()
const user = ref(null)
const showEdit = ref(false)
const loading = ref(false)
const editForm = ref({ phone: '', address: '' })

onMounted(async () => {
  await userStore.fetchProfile()
  user.value = userStore.user
  if (user.value) { editForm.value.phone = user.value.phone || ''; editForm.value.address = user.value.address || '' }
})

async function handleUpdate() {
  loading.value = true
  try { await userStore.updateProfile(editForm.value); ElMessage.success('更新成功'); showEdit.value = false } catch { ElMessage.error('更新失败') }
  loading.value = false
}
</script>
