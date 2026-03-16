<template>
  <div class="product-container">
    <!-- 顶部操作栏 -->
    <div class="product-header">
      <div class="header-left">
        <h2 class="page-title">产品管理</h2>
        <span class="product-count">共 {{ filteredList.length }} 个产品</span>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>新建产品
      </el-button>
    </div>

    <!-- 产品卡片列表 -->
    <div class="product-grid">
      <div
        v-for="item in filteredList"
        :key="item.id"
        class="product-card"
      >
        <!-- 卡片顶部色带 -->
        <div class="card-accent" :style="{ background: getAccentColor(item) }" />
        <div class="card-body">
          <div class="card-top">
            <div class="card-title-row">
              <h3 class="card-title">{{ item.name }}</h3>
              <el-tag
                :type="item.status === '活跃' ? 'success' : 'info'"
                size="small"
                effect="light"
              >{{ item.status }}</el-tag>
            </div>
            <p v-if="item.code" class="card-code">{{ item.code }}</p>
            <p class="card-desc">{{ item.description || '暂无描述' }}</p>
          </div>

          <div class="card-stats">
            <div class="stat-item">
              <el-icon class="stat-icon" color="#409eff"><Document /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ item.story_count || 0 }}</span>
                <span class="stat-label">需求</span>
              </div>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon" color="#67c23a"><User /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ item.owner_name || '未指派' }}</span>
                <span class="stat-label">负责人</span>
              </div>
            </div>
            <div v-if="item.line" class="stat-item">
              <el-icon class="stat-icon" color="#e6a23c"><Collection /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ item.line }}</span>
                <span class="stat-label">产品线</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-time">{{ item.created_at }}</span>
            <div class="card-actions">
              <el-button size="small" link type="primary" @click="handleEdit(item)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button size="small" link type="danger" @click="handleDelete(item)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!filteredList.length" class="empty-state">
        <el-empty description="暂无产品，点击上方按钮创建" />
      </div>
    </div>

    <ProductDialog
      v-model:visible="dialogVisible"
      :editing-id="editingId"
      :initial-form="editingForm"
      :user-options="userOptions"
      @saved="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getProductList, deleteProduct,
} from '@/api/product';
import { getUserList } from '@/api/user';
import ProductDialog from './components/ProductDialog.vue';

const products = ref([]);
const userOptions = ref([]);

const filteredList = computed(() => products.value);

const accentColors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#b37feb'];
const getAccentColor = (item) => {
  const idx = (item.id || 0) % accentColors.length;
  return accentColors[idx];
};

const fetchList = async () => {
  try {
    const res = await getProductList();
    products.value = res.data.list || [];
  } catch {
    // 获取产品列表失败
  }
};

const fetchUsers = async () => {
  try {
    const res = await getUserList();
    userOptions.value = (res.data || []).map((u) => ({
      id: u.id,
      label: u.first_name || u.username,
      avatar: u.avatar || '',
    }));
  } catch {
    // 获取用户列表失败
  }
};

onMounted(() => {
  fetchList();
  fetchUsers();
});

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
    name: row.name,
    code: row.code || '',
    line: row.line || '',
    owner: row.owner || null,
    status: row.status,
    description: row.description || '',
  };
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除产品「'.concat(row.name, '」？'), '提示', { type: 'warning' })
    .then(async () => {
      await deleteProduct(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};
</script>

<style scoped lang="scss">
.product-container {
  padding: 20px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }

  .product-count {
    font-size: 13px;
    color: #909399;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.card-accent {
  height: 4px;
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.card-top {
  flex: 1;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.card-code {
  margin: 0 0 8px;
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-stats {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 16px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.stat-value {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.stat-label {
  font-size: 11px;
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-time {
  font-size: 12px;
  color: #c0c4cc;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}
</style>
