<template>
  <el-dialog v-model="store.visible" title="购物车" width="420px" top="8vh">
    <div v-if="store.items.length === 0" style="text-align:center;padding:40px 0;color:#999">购物车是空的</div>
    <div v-else class="cart-list">
      <div v-for="item in store.items" :key="item.id" class="cart-item">
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-price">¥{{ item.price }}</span>
        </div>
        <el-input-number v-model="item.quantity" :min="1" size="small" @change="store.update(item.id, item.quantity)" />
      </div>
    </div>
    <template #footer>
      <div class="cart-footer">
        <span style="color:#e6a23c;font-size:18px;font-weight:bold">合计: ¥{{ store.total.toFixed(2) }}</span>
        <div>
          <el-button @click="store.clear()" :disabled="!store.items.length">清空</el-button>
          <el-button type="primary" @click="goCheckout" :disabled="!store.items.length">去结算</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
const store = useCartStore()
const router = useRouter()
function goCheckout() { store.hide(); router.push('/checkout') }
</script>

<style scoped>
.cart-list { max-height: 400px; overflow-y: auto }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0 }
.item-info { display: flex; flex-direction: column }
.item-name { font-size: 15px; font-weight: 500 }
.item-price { color: #e6a23c; margin-top: 4px }
.cart-footer { display: flex; justify-content: space-between; align-items: center }
</style>
