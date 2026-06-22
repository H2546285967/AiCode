<template>
  <div class="dish-card" @click="$emit('click')">
    <div class="dish-image">{{ dish.name.charAt(0) }}</div>
    <div class="dish-info">
      <h4>{{ dish.name }}</h4>
      <p class="desc">{{ dish.description }}</p>
      <div class="meta">
        <span class="tag">{{ dish.category_name }}</span>
        <span class="sales">已售 {{ dish.sales || 0 }}</span>
      </div>
      <div class="bottom">
        <span class="price">¥{{ dish.price }}</span>
        <el-button type="primary" size="small" round @click.stop="$emit('add')">加入</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ dish: Object })
defineEmits(['click', 'add'])
</script>

<style scoped>
.dish-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all .3s; background: #fff }
.dish-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.1) }
.dish-image { height: 140px; background: linear-gradient(135deg, #409eff, #337ecc); display: flex; align-items: center; justify-content: center; font-size: 48px; color: #fff; font-weight: bold }
.dish-info { padding: 12px 16px }
.dish-info h4 { margin: 0 0 6px; font-size: 16px }
.desc { color: #999; font-size: 13px; margin: 0 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.meta { display: flex; justify-content: space-between; margin-bottom: 8px }
.tag { background: #ecf5ff; color: #409eff; padding: 2px 8px; border-radius: 4px; font-size: 12px }
.sales { color: #999; font-size: 12px }
.bottom { display: flex; justify-content: space-between; align-items: center }
.price { color: #e6a23c; font-size: 20px; font-weight: bold }
</style>
