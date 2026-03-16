<template>
  <div class="story-container">
    <!-- 搜索筛选 -->
    <el-card class="filter-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="需求标题">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入需求标题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="所属产品">
          <el-select v-model="queryParams.product" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="p in productOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryParams.priority" placeholder="全部" clearable style="width: 100px">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="激活" value="激活" />
            <el-option label="开发中" value="开发中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已关闭" value="已关闭" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新建需求
          </el-button>
          <span class="total">共 {{ total }} 条需求</span>
        </div>
      </template>

      <el-table :data="stories" style="width: 100%" row-key="id">
        <el-table-column type="index" label="" width="60" />
        <el-table-column prop="title" label="需求标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="所属产品" min-width="110" />
        <el-table-column prop="priority" label="优先级" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="指派给" min-width="90" />
        <el-table-column prop="estimate" label="预估工时" min-width="90" align="center" />
        <el-table-column prop="created_at" label="创建时间" min-width="160" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <StoryDialog
      v-model:visible="dialogVisible"
      :editing-id="editingId"
      :initial-form="editingForm"
      :product-list="productList"
      :user-list="userList"
      @saved="fetchList"
    />

    <StoryDetailDialog
      v-model:visible="detailVisible"
      :row="detailRow"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getStoryList, deleteStory } from '@/api/story';
import { getProductList } from '@/api/product';
import { getUserList } from '@/api/user';
import StoryDialog from './components/StoryDialog.vue';
import StoryDetailDialog from './components/StoryDetailDialog.vue';

// 数据
const stories = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

const productOptions = ref([]);
const productList = ref([]);
const userList = ref([]);

const queryParams = ref({
  title: '', product: '', priority: '', status: '',
});

// 加载选项
const fetchOptions = async () => {
  try {
    const [prodRes, userRes] = await Promise.all([
      getProductList({ page: 1, pageSize: 999 }),
      getUserList(),
    ]);
    const prods = prodRes.data.list || [];
    productList.value = prods.map((p) => ({ id: p.id, name: p.name }));
    productOptions.value = prods.map((p) => p.name);
    userList.value = (userRes.data || []).map((u) => ({
      id: u.id,
      label: u.first_name || u.username,
      avatar: u.avatar || '',
    }));
  } catch {
    // 加载选项失败
  }
};

// 加载列表
const fetchList = async () => {
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const res = await getStoryList(params);
    stories.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch {
    // 获取需求列表失败
  }
};

onMounted(() => {
  fetchOptions();
  fetchList();
});

const handleSearch = () => { currentPage.value = 1; fetchList(); };
const handleReset = () => {
  queryParams.value = {
    title: '', product: '', priority: '', status: '',
  };
  currentPage.value = 1;
  fetchList();
};

// Tag 类型
const priorityType = (p) => ({ 高: 'danger', 中: 'warning', 低: 'info' }[p] || 'info');
const statusType = (s) => ({
  激活: 'primary', 开发中: 'warning', 已完成: 'success', 已关闭: 'info',
}[s] || 'info');

// 弹窗
const dialogVisible = ref(false);
const editingId = ref(null);
const editingForm = ref(null);

const handleAdd = () => {
  editingId.value = null;
  editingForm.value = null;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  editingId.value = row.id;
  editingForm.value = {
    title: row.title,
    product: row.product || null,
    priority: row.priority,
    status: row.status,
    assignee: row.assignee || null,
    estimate: row.estimate || '',
    description: row.description || '',
  };
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除需求「'.concat(row.title, '」？'), '提示', { type: 'warning' })
    .then(async () => {
      await deleteStory(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};

// 详情
const detailVisible = ref(false);
const detailRow = ref(null);

const handleDetail = (row) => {
  detailRow.value = row;
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.story-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-desc {
  white-space: pre-wrap;
  line-height: 1.6;
}

.detail-actions {
  margin-bottom: 16px;
}
</style>
