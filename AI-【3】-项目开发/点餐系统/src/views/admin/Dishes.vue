<template>
  <div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <h2>🍲 菜品管理</h2>
      <el-button type="primary" @click="showForm = true; formData = {}">添加菜品</el-button>
    </div>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category_name" label="分类" width="100" />
      <el-table-column label="价格" width="100"><template #default="{row}">¥{{ row.price }}</template></el-table-column>
      <el-table-column prop="sales" label="销量" width="80" />
      <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '上架' : '下架' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{row}">
          <el-button text @click="edit(row)">编辑</el-button>
          <el-button text type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-if="total > 10" :total="total" :page-size="10" layout="prev,pager,next" @current-change="load" style="margin-top:16px" />

    <el-dialog v-model="showForm" :title="formData.id ? '编辑菜品' : '添加菜品'" width="480px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="分类" prop="category_id"><el-select v-model="formData.category_id" placeholder="请选择菜品分类" clearable style="width:100%">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select></el-form-item>
        <el-form-item label="价格" prop="price"><el-input-number v-model="formData.price" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="formData.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGetDishes, createDish, updateDish, deleteDish } from '../../api/dish'
import { adminGetCategories } from '../../api/category'

const list = ref([]), categories = ref([]), total = ref(0), loading = ref(false), saving = ref(false), showForm = ref(false)
const formRef = ref(null)
const formData = ref({ name: '', category_id: null, price: 0, description: '', status: 1 })
const rules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, type: 'number', min: 0.01, message: '价格必须大于 0', trigger: 'blur' }],
}

async function load(page = 1) {
  loading.value = true
  const res = await adminGetDishes({ page, limit: 10 })
  list.value = res.data.list; total.value = res.data.total
  loading.value = false
}

function edit(row) { formData.value = { ...row }; showForm.value = true }

async function handleSave() {
  // 前端表单校验
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (formData.value.id) { await updateDish(formData.value.id, formData.value); ElMessage.success('更新成功') }
    else { await createDish(formData.value); ElMessage.success('添加成功') }
    showForm.value = false; await load()
  } catch (err) {
    // 暴露后端真实错误，便于调试
    ElMessage.error(err.response?.data?.msg || '操作失败')
  }
  saving.value = false
}

async function handleDelete(id) {
  try { await ElMessageBox.confirm('确定删除此菜品？'); await deleteDish(id); ElMessage.success('删除成功'); await load() } catch {}
}

onMounted(async () => {
  try {
    categories.value = (await adminGetCategories()).data || []
  } catch (err) {
    ElMessage.error('分类加载失败: ' + (err.response?.data?.msg || err.message))
  }
  await load()
})
</script>
