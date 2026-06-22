<template>
  <div>
    <h2 style="margin-bottom:16px">📋 确认订单</h2>
    <el-card style="margin-bottom:16px">
      <template #header>订单商品</template>
      <el-table :data="cartStore.items" style="width:100%">
        <el-table-column prop="name" label="菜品" />
        <el-table-column label="单价"><template #default="{ row }">¥{{ row.price }}</template></el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="小计"><template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template></el-table-column>
      </el-table>
    </el-card>
    <el-card style="margin-bottom:16px">
      <template #header>配送信息</template>
      <el-form :model="form" label-width="80px">
        <el-form-item label="备注"><el-input v-model="form.remark" placeholder="选填" /></el-form-item>
      </el-form>
    </el-card>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:20px;color:#e6a23c;font-weight:bold">合计: ¥{{ cartStore.total.toFixed(2) }}</span>
      <el-button type="primary" size="large" @click="submitOrder" :loading="submitting">提交订单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../../stores/cart'
import { createOrder } from '../../api/order'

const router = useRouter()
const cartStore = useCartStore()
const form = ref({ remark: '' })
const submitting = ref(false)

async function submitOrder() {
  if (!cartStore.items.length) return ElMessage.warning('购物车为空')
  submitting.value = true
  try {
    const res = await createOrder({
      items: cartStore.items.map(i => ({ dish_id: i.dish_id || i.id, quantity: i.quantity })),
      remark: form.value.remark
    })
    ElMessage.success(`下单成功: ${res.data.order_no}`)
    cartStore.items = []
    router.push('/orders')
  } catch { ElMessage.error('下单失败') }
  submitting.value = false
}
</script>
