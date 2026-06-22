<template>
  <div>
    <h2 style="margin-bottom:16px">🛒 我的购物车</h2>
    <el-card v-if="cartStore.items.length > 0">
      <el-table :data="cartStore.items" style="width:100%">
        <el-table-column prop="name" label="菜品" />
        <el-table-column label="单价">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="数量" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" size="small" @change="cartStore.update(row.id, row.quantity)" />
          </template>
        </el-table-column>
        <el-table-column label="小计">
          <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }"><el-button type="danger" text @click="cartStore.remove(row.id)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
        <el-button @click="cartStore.clear()">清空购物车</el-button>
        <div>
          <span style="font-size:18px;color:#e6a23c;font-weight:bold;margin-right:16px">合计: ¥{{ cartStore.total.toFixed(2) }}</span>
          <el-button type="primary" size="large" @click="$router.push('/checkout')">去结算</el-button>
        </div>
      </div>
    </el-card>
    <el-empty v-else description="购物车是空的" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '../../stores/cart'
const cartStore = useCartStore()
onMounted(() => cartStore.fetchCart())
</script>
