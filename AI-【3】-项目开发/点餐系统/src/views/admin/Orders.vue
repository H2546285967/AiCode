<template>
  <div>
    <h2 style="margin-bottom:16px">📋 订单管理</h2>
    <div style="margin-bottom:16px">
      <el-radio-group v-model="statusFilter" @change="load">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="confirmed">已确认</el-radio-button>
        <el-radio-button value="delivering">配送中</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="cancelled">已取消</el-radio-button>
      </el-radio-group>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="order_no" label="订单号" width="200" />
      <el-table-column prop="username" label="用户" width="100" />
      <el-table-column label="商品" min-width="200">
        <template #default="{row}">
          <div v-if="row.items">{{ row.items.map(i => `${i.dish_name}×${i.quantity}`).join('、') }}</div>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="100"><template #default="{row}">¥{{ row.total?.toFixed(2) }}</template></el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="(row.status === 'pending' ? 'warning' : row.status === 'completed' ? 'success' : row.status === 'cancelled' ? 'danger' : '')">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="160"><template #default="{row}">{{ row.created_at }}</template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{row}">
          <el-select v-model="row.status" size="small" @change="updateStatus(row.id, row.status)" style="width:110px">
            <el-option value="pending" label="待处理" />
            <el-option value="confirmed" label="已确认" />
            <el-option value="delivering" label="配送中" />
            <el-option value="completed" label="已完成" />
            <el-option value="cancelled" label="已取消" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-if="total > 10" :total="total" :page-size="10" layout="prev,pager,next" @current-change="load" style="margin-top:16px" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminGetOrders, updateOrderStatus } from '../../api/order'

const list = ref([]), total = ref(0), loading = ref(false), statusFilter = ref('all')

async function load(page = 1) {
  loading.value = true
  const params = { page, limit: 10 }
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  const res = await adminGetOrders(params)
  list.value = res.data.list; total.value = res.data.total
  loading.value = false
}

async function updateStatus(id, status) {
  await updateOrderStatus(id, status)
  ElMessage.success('状态已更新')
}

load()
</script>
