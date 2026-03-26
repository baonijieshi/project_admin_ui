<template>
  <div class="story-container">
    <!-- 页头：标题 + 统计 -->
    <div class="page-header">
      <div class="page-title">
        <span class="title-text">需求列表</span>
        <span class="total-badge">共 {{ total }} 条</span>
      </div>
      <div class="status-stats">
        <span
          v-for="s in statusStats"
          :key="s.label"
          class="stat-item"
          :class="'stat-' + s.key"
          @click="filterByStatus(s.value)"
        >
          <span class="stat-dot" />
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-count">{{ s.count }}</span>
        </span>
      </div>
    </div>

    <!-- 主卡片 -->
    <el-card class="main-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 左：筛选 -->
        <div class="toolbar-filters">
          <el-input
            v-model="queryParams.title"
            placeholder="搜索需求标题..."
            clearable
            class="filter-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="queryParams.product"
            placeholder="所属产品"
            clearable
            class="filter-select"
            @change="handleSearch"
          >
            <el-option v-for="p in productOptions" :key="p" :label="p" :value="p" />
          </el-select>
          <el-select
            v-model="queryParams.priority"
            placeholder="优先级"
            clearable
            class="filter-select filter-select--sm"
            @change="handleSearch"
          >
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
          <el-select
            v-model="queryParams.status"
            placeholder="状态"
            clearable
            class="filter-select filter-select--sm"
            @change="handleSearch"
          >
            <el-option label="激活" value="激活" />
            <el-option label="开发中" value="开发中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已关闭" value="已关闭" />
          </el-select>
          <el-button v-if="hasActiveFilter" link type="primary" class="reset-btn" @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>清除筛选
          </el-button>
        </div>

        <!-- 右：操作 -->
        <div class="toolbar-actions">
          <el-button @click="handleFeishuImport">
            <el-icon><Upload /></el-icon>飞书导入
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新建需求
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        :data="stories"
        style="width: 100%"
        row-key="id"
        :empty-text="' '"
        stripe
        @row-click="handleRowClick"
      >
        <el-table-column type="index" width="48" align="center" class-name="index-col" />
        <el-table-column prop="title" label="需求标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="story-title-link" @click.stop="handleDetail(row)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="所属产品" width="130" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="90" align="center">
          <template #default="{ row }">
            <span class="priority-tag" :class="'priority-' + row.priority">
              {{ row.priority }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="'status-' + row.status">
              {{ row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="指派给" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="assignee-cell">
              <template v-if="row.assignee_name">
                <img
                  v-if="row.assignee_avatar"
                  :src="row.assignee_avatar"
                  class="assignee-avatar assignee-avatar--img"
                  alt="avatar"
                >
                <span v-else class="assignee-avatar">{{ row.assignee_name[0] }}</span>
                <span>{{ row.assignee_name }}</span>
              </template>
              <span v-else>-</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="estimate" label="预估工时" width="90" align="center">
          <template #default="{ row }">
            <span class="estimate-text">{{ row.estimate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button size="small" circle text @click.stop="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button size="small" circle text type="danger" @click.stop="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><DocumentAdd /></el-icon>
            <p class="empty-title">暂无需求</p>
            <p class="empty-desc">{{ hasActiveFilter ? '没有符合筛选条件的需求，试试清除筛选' : '点击「新建需求」开始创建第一条需求' }}</p>
            <div class="empty-actions">
              <el-button v-if="hasActiveFilter" @click="handleReset">清除筛选</el-button>
              <el-button v-else type="primary" @click="handleAdd">
                <el-icon><Plus /></el-icon>新建需求
              </el-button>
            </div>
          </div>
        </template>
      </el-table>

      <!-- 分页 -->
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

    <FeishuImportDialog
      v-model:visible="feishuImportVisible"
      :product-list="productList"
      :user-list="userList"
      @imported="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Plus, Upload, Edit, Delete, RefreshLeft, DocumentAdd,
} from '@element-plus/icons-vue';
import { getStoryList, deleteStory } from '@/api/story';
import { getProductList } from '@/api/product';
import { getUserList } from '@/api/user';
import StoryDialog from './components/StoryDialog.vue';
import StoryDetailDialog from './components/StoryDetailDialog.vue';
import FeishuImportDialog from './components/FeishuImportDialog.vue';

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

const hasActiveFilter = computed(() => Object.values(queryParams.value).some((v) => v !== ''));

// 状态统计
const statusStats = computed(() => {
  const map = {
    激活: 0, 开发中: 0, 已完成: 0, 已关闭: 0,
  };
  stories.value.forEach((s) => {
    if (map[s.status] !== undefined) {
      map[s.status] += 1;
    }
  });
  return [
    {
      key: 'active', label: '激活', value: '激活', count: map['激活'],
    },
    {
      key: 'dev', label: '开发中', value: '开发中', count: map['开发中'],
    },
    {
      key: 'done', label: '已完成', value: '已完成', count: map['已完成'],
    },
    {
      key: 'closed', label: '已关闭', value: '已关闭', count: map['已关闭'],
    },
  ];
});

const filterByStatus = (val) => {
  queryParams.value.status = queryParams.value.status === val ? '' : val;
  handleSearch();
};

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
      dept: u.dept || '',
    }));
  } catch { /* ignore */ }
};

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
  } catch { /* ignore */ }
};

onMounted(() => {
  fetchOptions();
  fetchList();
});

const handleSearch = () => {
  currentPage.value = 1;
  fetchList();
};
const handleReset = () => {
  queryParams.value = {
    title: '', product: '', priority: '', status: '',
  };
  currentPage.value = 1;
  fetchList();
};

const formatDate = (t) => {
  if (!t) return '-';
  return t.slice(0, 16).replace('T', ' ');
};

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
  ElMessageBox.confirm(`确定删除需求「${row.title}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteStory(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};

const feishuImportVisible = ref(false);
const handleFeishuImport = () => { feishuImportVisible.value = true; };

const detailVisible = ref(false);
const detailRow = ref(null);

const handleDetail = (row) => {
  detailRow.value = row;
  detailVisible.value = true;
};

const handleRowClick = (row) => {
  handleDetail(row);
};
</script>

<style scoped lang="scss">
.story-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

/* ── 页头 ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  letter-spacing: 0.2px;
}

.total-badge {
  font-size: 12px;
  color: #86909c;
  background: #f2f3f5;
  border-radius: 10px;
  padding: 2px 8px;
}

/* 状态统计条 */
.status-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: currentColor;
  }
}

.stat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.stat-label { color: #606266; }
.stat-count { font-weight: 600; }

.stat-active  { color: #409eff; .stat-dot { background: #409eff; } }
.stat-dev     { color: #e6a23c; .stat-dot { background: #e6a23c; } }
.stat-done    { color: #67c23a; .stat-dot { background: #67c23a; } }
.stat-closed  { color: #909399; .stat-dot { background: #909399; } }

/* ── 主卡片 ── */
.main-card {
  border-radius: 8px;
  border: 1px solid #e8eaed;

  :deep(.el-card__body) {
    padding: 0;
  }
}

/* ── 工具栏 ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-input {
  width: 220px;
}

.filter-select {
  width: 130px;

  &--sm {
    width: 100px;
  }
}

.reset-btn {
  font-size: 12px;
  padding: 0 4px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── 表格 ── */
:deep(.el-table) {
  font-size: 13px;

  .el-table__row {
    cursor: pointer;

    &:hover td {
      background: #f5f8ff !important;
    }
  }

  .index-col .cell {
    color: #c0c4cc;
    font-size: 12px;
  }
}

.story-title-link {
  color: #1677ff;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: #4096ff;
    text-decoration: underline;
  }
}

/* 优先级标签 */
.priority-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  min-width: 28px;
}

.priority-高 { background: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; }
.priority-中 { background: #fffbe6; color: #d46b08; border: 1px solid #ffe58f; }
.priority-低 { background: #f0f5ff; color: #2f54eb; border: 1px solid #adc6ff; }

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  min-width: 48px;
}

.status-激活   { background: #e6f4ff; color: #1677ff; }
.status-开发中 { background: #fff7e6; color: #d46b08; }
.status-已完成 { background: #f6ffed; color: #389e0d; }
.status-已关闭 { background: #f5f5f5; color: #8c8c8c; }

/* 指派人 */
.assignee-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.assignee-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--img {
    background: none;
    object-fit: cover;
  }
}

.estimate-text {
  color: #606266;
  font-size: 12px;
}

.time-text {
  color: #909399;
  font-size: 12px;
}

/* 行操作 */
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;

  :deep(.el-table__row):hover & {
    opacity: 1;
  }
}

:deep(.el-table__row:hover) .row-actions {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 6px;
}

.empty-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 20px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* 分页 */
.pagination-wrapper {
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
}
</style>
