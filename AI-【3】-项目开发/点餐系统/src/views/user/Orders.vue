<template>
  <div>
    <h2 style="margin-bottom:16px">📦 我的订单</h2>
    <el-timeline v-if="orders.length">
      <el-timeline-item v-for="o in orders" :key="o.id" :timestamp="o.created_at" placement="top">
        <el-card>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <span>订单号: {{ o.order_no }}</span>
              <el-tag :type="statusMap[o.status]?.type || 'info'" style="margin-left:12px">{{ statusMap[o.status]?.label || o.status }}</el-tag>
            </div>
            <span style="color:#e6a23c;font-weight:bold">¥{{ o.total.toFixed(2) }}</span>
          </div>
          <div v-if="o.items" style="margin-top:8px;color:#999;font-size:13px">
            {{ o.items.map(i => `${i.dish_name}×${i.quantity}`).join('、') }}
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无订单" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders } from '../../api/order'

const orders = ref([])
const statusMap = { pending: { label: '待处理', type: 'warning' }, confirmed: { label: '已确认', type: 'primary' }, delivering: { label: '配送中', type: '' }, completed: { label: '已完成', type: 'success' }, cancelled: { label: '已取消', type: 'danger' } }

onMounted(async () => { orders.value = (await getOrders()).data || [] })
</script>
