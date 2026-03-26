<template>
  <div class="mock-view">
    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.path"
            placeholder="搜索接口地址..."
            clearable
            style="width: 240px"
            @input="debounceFetch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input
            v-model="queryParams.snow_id"
            placeholder="Snow ID"
            clearable
            style="width: 180px"
            @input="debounceFetch"
          />
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新建 Mock
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        :data="mockList"
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        row-class-name="mock-row"
        @row-click="(row) => handleDetail(row)"
      >
        <el-table-column prop="snow_id" label="Snow ID" width="180">
          <template #default="{ row }">
            <span class="snow-id">{{ row.snow_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用名称" width="130" show-overflow-tooltip />
        <el-table-column prop="path" label="接口地址" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="path-code">{{ row.path }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" show-overflow-tooltip />
        <el-table-column prop="create_time" label="创建时间" width="165">
          <template #default="{ row }">
            <span class="time-text">{{ row.create_time }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><Box /></el-icon>
            <p>暂无 Mock 数据</p>
          </div>
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="fetchList"
          @size-change="fetchList"
        />
      </div>
    </el-card>

    <MockDialog
      v-model:visible="dialogVisible"
      :editing-snow-id="editingSnowId"
      :initial-form="editingForm"
      @saved="fetchList"
    />

    <MockDetailDrawer
      v-model:visible="detailVisible"
      :mock="detailMock"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Box } from '@element-plus/icons-vue';
import { getMockList, deleteMock } from '@/api/mock';
import MockDialog from './components/MockDialog.vue';
import MockDetailDrawer from './components/MockDetailDrawer.vue';

const mockList = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const queryParams = ref({ path: '', snow_id: '' });

const dialogVisible = ref(false);
const editingSnowId = ref(null);
const editingForm = ref(null);
const detailVisible = ref(false);
const detailMock = ref(null);

const debounceTimer = ref(null);
function debounceFetch() {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    currentPage.value = 1;
    fetchList();
  }, 300);
}

async function fetchList() {
  loading.value = true;
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value };
    if (queryParams.value.path) params.path = queryParams.value.path;
    if (queryParams.value.snow_id) params.snow_id = queryParams.value.snow_id;
    const res = await getMockList(params);
    const d = res.data;
    mockList.value = d?.list || d?.results || [];
    total.value = d?.total || mockList.value.length;
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingSnowId.value = null;
  editingForm.value = null;
  dialogVisible.value = true;
}

function handleEdit(row) {
  editingSnowId.value = row.snow_id;
  editingForm.value = {
    app_name: row.app_name,
    path: row.path,
    re_data: typeof row.re_data === 'string' ? row.re_data : JSON.stringify(row.re_data),
  };
  dialogVisible.value = true;
}

function handleDetail(row) {
  detailMock.value = row;
  detailVisible.value = true;
}

async function handleDelete(row) {
  await ElMessageBox.confirm(
    `确定删除 Mock「${row.app_name} - ${row.path}」吗？`,
    '删除确认',
    { type: 'warning' },
  );
  await deleteMock(row.snow_id);
  ElMessage.success('已删除');
  fetchList();
}

onMounted(() => { fetchList(); });
</script>

<style scoped lang="scss">
.mock-view {
  padding: 20px;
}

.main-card {
  :deep(.el-card__body) { padding: 16px; }
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.snow-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #606266;
}

.path-code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 13px;
  color: #303133;
}

.empty-text { color: #c0c4cc; font-size: 13px; }
.time-text { font-size: 13px; color: #606266; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #909399;
  p { margin-top: 12px; font-size: 14px; }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.mock-row {
  cursor: pointer;
  &:hover td { background: #f5f7fa !important; }
}
</style>
