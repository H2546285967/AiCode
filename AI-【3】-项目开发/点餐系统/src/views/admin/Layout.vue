<template>
  <el-container style="min-height:100vh">
    <el-aside width="220px" style="background:#304156">
      <h2 style="color:#fff;padding:20px;text-align:center;font-size:16px">☕ 管理后台</h2>
      <el-menu :default-active="route.path" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
        <el-menu-item index="/admin/dashboard"><el-icon><DataAnalysis /></el-icon><span>仪表盘</span></el-menu-item>
        <el-menu-item index="/admin/dishes"><el-icon><Goods /></el-icon><span>菜品管理</span></el-menu-item>
        <el-menu-item index="/admin/categories"><el-icon><Collection /></el-icon><span>分类管理</span></el-menu-item>
        <el-menu-item index="/admin/orders"><el-icon><List /></el-icon><span>订单管理</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff;display:flex;justify-content:flex-end;align-items:center;border-bottom:1px solid #e6e6e6">
        <el-button text @click="logout">退出管理</el-button>
      </el-header>
      <el-main style="background:#f0f2f5"><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
function logout() { localStorage.removeItem('adminToken'); router.push('/admin/login') }
</script>
