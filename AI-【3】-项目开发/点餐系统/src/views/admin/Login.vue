<template>
  <div class="admin-login">
    <el-card style="width:380px;padding:20px">
      <h2 style="text-align:center;margin-bottom:20px">管理后台登录</h2>
      <el-form :model="form" label-width="70px" @keyup.enter="handleLogin">
        <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin } from '../../api/auth'
import { setAdminToken } from '../../utils/storage'

const router = useRouter()
const form = ref({ username: 'admin', password: 'admin123' })
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const res = await adminLogin(form.value)
    setAdminToken(res.data.token)
    ElMessage.success('登录成功')
    router.push('/admin/dashboard')
  } catch { ElMessage.error('账号或密码错误') }
  loading.value = false
}
</script>

<style scoped>
.admin-login { display: flex; justify-content: center; align-items: center; min-height: 80vh }
</style>
