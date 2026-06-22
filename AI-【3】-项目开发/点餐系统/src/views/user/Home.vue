<template>
  <div>
    <el-space wrap style="margin-bottom:16px">
      <el-tag :type="activeCategory === '' ? 'primary' : 'info'" @click="activeCategory=''" style="cursor:pointer">全部</el-tag>
      <el-tag v-for="c in categories" :key="c.id" :type="activeCategory == c.id ? 'primary' : 'info'" @click="activeCategory=c.id" style="cursor:pointer">{{ c.name }}</el-tag>
    </el-space>
    <div class="dish-grid" v-loading="loading">
      <DishCard v-for="d in dishes" :key="d.id" :dish="d" @add="addToCart(d)" />
      <el-empty v-if="!dishes.length && !loading" description="暂无菜品" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDishes } from '../../api/dish'
import { getCategories } from '../../api/category'
import { useCartStore } from '../../stores/cart'
import DishCard from '../../components/DishCard.vue'

const cartStore = useCartStore()
const dishes = ref([])
const categories = ref([])
const activeCategory = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  const params = {}
  if (activeCategory.value) params.category = activeCategory.value
  dishes.value = (await getDishes(params)).data || []
  loading.value = false
}

async function addToCart(dish) {
  if (!localStorage.getItem('token')) return ElMessage.warning('请先登录')
  await cartStore.add(dish.id)
  ElMessage.success(`已加入购物车: ${dish.name}`)
}

watch(activeCategory, load)
onMounted(async () => {
  categories.value = (await getCategories()).data || []
  await load()
})
</script>

<style scoped>
.dish-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px }
</style>
