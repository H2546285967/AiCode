<template>
  <div>
    <h2 style="margin-bottom:16px">📊 仪表盘</h2>
    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6" v-for="item in stats" :key="item.label">
        <el-card>
          <div style="text-align:center;padding:16px">
            <div style="font-size:32px;font-weight:bold;color:#409eff">{{ item.value }}</div>
            <div style="color:#999;margin-top:8px">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card><template #header>近7天订单趋势</template>
          <div v-if="dailyOrders.length">
            <div v-for="d in dailyOrders" :key="d.date" style="display:flex;align-items:center;margin:8px 0">
              <span style="width:100px;font-size:13px">{{ d.date }}</span>
              <el-progress :percentage="Math.min(100, d.count * 20)" :stroke-width="16" />
              <span style="margin-left:8px;font-size:13px">{{ d.count }}单</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header>分类销量排行</template>
          <div v-for="c in categorySales" :key="c.name" style="display:flex;align-items:center;margin:8px 0">
            <span style="width:80px;font-size:13px">{{ c.name }}</span>
            <el-progress :percentage="Math.min(100, c.total)" :stroke-width="16" />
            <span style="margin-left:8px;font-size:13px">{{ c.total }}份</span>
          </div>
          <el-empty v-if="!categorySales.length" description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
const stats = ref([])
const dailyOrders = ref([])
const categorySales = ref([])

onMounted(async () => {
  const res = await request.get('/admin/dashboard')
  const d = res.data
  stats.value = [
    { label: '用户数', value: d.userCount }, { label: '订单数', value: d.orderCount },
    { label: '菜品数', value: d.dishCount }, { label: '营业额', value: `¥${d.revenue}` }
  ]
  dailyOrders.value = d.dailyOrders || []
  categorySales.value = d.categorySales || []
})
</script>
