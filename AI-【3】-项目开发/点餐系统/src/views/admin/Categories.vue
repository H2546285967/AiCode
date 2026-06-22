<template>
  <div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <h2>📁 分类管理</h2>
      <el-button type="primary" @click="showForm = true; formData = {}">添加分类</el-button>
    </div>
    <el-table :data="list" border stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button text @click="edit(row)">编辑</el-button>
          <el-button text type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showForm" :title="formData.id ? '编辑分类' : '添加分类'" width="360px">
      <el-form :model="formData" label-width="60px">
        <el-form-item label="名称"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="formData.sort" :min="0" /></el-form-item>
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
import { adminGetCategories, createCategory, updateCategory, deleteCategory } from '../../api/category'

const list = ref([]), showForm = ref(false), saving = ref(false), formData = ref({})

async function load() { list.value = (await adminGetCategories()).data || [] }
function edit(row) { formData.value = { ...row }; showForm.value = true }

async function handleSave() {
  saving.value = true
  try {
    if (formData.value.id) { await updateCategory(formData.value.id, formData.value); ElMessage.success('更新成功') }
    else { await createCategory(formData.value); ElMessage.success('添加成功') }
    showForm.value = false; await load()
  } catch { ElMessage.error('操作失败') }
  saving.value = false
}

async function handleDelete(id) {
  try { await ElMessageBox.confirm('确定删除？'); await deleteCategory(id); ElMessage.success('删除成功'); await load() } catch {}
}

onMounted(load)
</script>
