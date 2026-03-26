<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6" v-for="item in stats" :key="item.title">
        <el-card class="stat-card" shadow="hover" style="cursor: pointer" @click="router.push(item.path)">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
              <el-icon :size="24" color="#fff">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-title">{{ item.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待办 + Bug -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card shadow="hover" class="list-card">
          <template #header>
            <div class="section-header">
              <span>待办任务</span>
              <el-tag size="small" type="info">{{ todoTasks.length }} 项</el-tag>
            </div>
          </template>
          <div class="item-list">
            <div v-if="todoTasks.length === 0" class="empty-tip">暂无待办任务</div>
            <div
              v-for="task in todoTasks"
              :key="task.id"
              class="list-item clickable"
              @click="handleTaskClick(task)"
            >
              <div class="item-main">
                <el-tag :type="getPriorityType(task.priority)" size="small" class="item-tag">{{ task.priority }}</el-tag>
                <span class="item-title">{{ task.name }}</span>
              </div>
              <div class="item-meta">
                <span class="meta-project">{{ task.versionName || '未关联版本' }}</span>
                <span v-if="task.deadline" class="meta-date">{{ task.deadline }}</span>
                <el-tag
                  v-if="task.deadline && isTaskOverdue(task.deadline)"
                  type="danger"
                  size="small"
                >延期</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="section-header">
              <span>最新Bug</span>
              <el-tag size="small" type="danger" style="cursor:pointer" @click="router.push('/test/bug')">{{ recentBugs.length }} 个</el-tag>
            </div>
          </template>
          <el-table
            :data="recentBugs"
            style="width: 100%"

            size="small"
            row-class-name="clickable-row"
            @row-click="(row) => router.push({ path: '/test/bug', query: { openId: row.id } })"
          >
            <el-table-column prop="title" label="Bug标题" min-width="140" show-overflow-tooltip />
            <el-table-column prop="severity" label="严重程度" width="90" align="center" >
              <template #default="{ row }">
                <el-tag :type="getSeverityType(row.severity)" size="small">{{ row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="指派给" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 版本进度 -->
    <el-card shadow="hover" style="margin-top: 16px">
      <template #header>
        <div class="section-header">
          <span>版本进度</span>
          <el-link type="primary" :underline="false" @click="router.push('/project/versions')">查看全部</el-link>
        </div>
      </template>
      <el-row :gutter="16" class="project-grid">
        <div v-if="versionProgress.length === 0" class="empty-tip" style="padding: 20px">暂无版本</div>
        <el-col
          v-for="ver in versionProgress"
          :key="ver.id"
          :span="8"
          style="margin-bottom: 16px"
        >
          <div class="project-card clickable" @click="router.push({ path: '/project/versions', query: { versionId: ver.id } })">
            <div class="project-card-header">
              <span class="project-name">{{ ver.name }}</span>
              <el-tag :type="getProjectStatusType(ver.status)" size="small">{{ ver.status }}</el-tag>
            </div>
            <el-progress
              :percentage="ver.progress"
              :color="progressColor(ver.progress)"
              :stroke-width="8"
              style="margin: 10px 0 8px"
            />
            <div class="project-card-footer">
              <span class="meta-project">{{ ver.manager }}</span>
              <span class="task-stat">任务 {{ ver.taskDone }} / {{ ver.taskTotal }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { getProjectList } from '@/api/project';
import { getTaskList } from '@/api/task';
import { getBugList } from '@/api/bug';
import { getTestcaseList } from '@/api/testcase';
import { getVersionList } from '@/api/version';

const router = useRouter();
const store = useStore();

const stats = ref([
  {
    title: '项目总数', value: 0, icon: 'Folder', bgColor: '#409eff', path: '/project',
  },
  {
    title: '进行中任务', value: 0, icon: 'List', bgColor: '#67c23a', path: '/project/versions',
  },
  {
    title: '待修复Bug', value: 0, icon: 'Warning', bgColor: '#f56c6c', path: '/test/bug',
  },
  {
    title: '测试用例', value: 0, icon: 'DocumentChecked', bgColor: '#e6a23c', path: '/test/testcase',
  },
]);

const todoTasks = ref([]);
const recentBugs = ref([]);
const versionProgress = ref([]);

const fetchData = async () => {
  try {
    const userId = store.state.user?.id;
    const [projRes, taskInProgressRes, bugPendingRes, testcaseRes, todoRes, recentBugRes, versionListRes] = await Promise.all([
      getProjectList({ page: 1, pageSize: 1 }),
      getTaskList({ status: '进行中', page: 1, pageSize: 1 }),
      getBugList({ status: '待处理,处理中', page: 1, pageSize: 1 }),
      getTestcaseList({ page: 1, pageSize: 1 }),
      userId ? getTaskList({
        assigneeId: userId,
        excludeStatus: '已完成',
        page: 1,
        pageSize: 10,
      }) : Promise.resolve({
        data: {
          list: [],
          total: 0,
        },
      }),
      getBugList({ status: '待处理,处理中', page: 1, pageSize: 10 }),
      getVersionList({ page: 1, pageSize: 6 }),
    ]);

    stats.value[0].value = projRes.data.total || 0;
    stats.value[1].value = taskInProgressRes.data.total || 0;
    stats.value[2].value = bugPendingRes.data.total || 0;
    stats.value[3].value = testcaseRes.data.total || 0;

    todoTasks.value = (todoRes.data.list || []).map((t) => ({
      id: t.id,
      name: t.name,
      versionId: t.version,
      versionName: t.version_name || '',
      priority: t.priority,
      deadline: t.deadline,
    }));

    recentBugs.value = (recentBugRes.data.list || []).map((b) => ({
      id: b.id,
      title: b.title,
      severity: b.severity,
      status: b.status,
      assignee: b.assignee_name || '',
    }));

    versionProgress.value = (versionListRes.data.list || []).map((v) => ({
      id: v.id,
      name: v.name,
      manager: v.manager_name || '',
      progress: v.progress || 0,
      status: v.status,
      taskDone: v.task_done || 0,
      taskTotal: v.task_total || 0,
    }));
  } catch {
    // 获取首页数据失败
  }
};

onMounted(fetchData);

const handleTaskClick = (task) => {
  if (task.versionId) {
    router.push({ path: '/project/versions', query: { versionId: task.versionId } });
  }
};

const isTaskOverdue = (deadline) => new Date(deadline) < new Date(new Date().toDateString());

const getPriorityType = (p) => {
  const map = { 高: 'danger', 中: 'warning', 低: 'info' };
  return map[p] || 'info';
};

const getSeverityType = (s) => {
  const map = {
    致命: 'danger', 严重: 'danger', 一般: 'warning', 轻微: 'info',
  };
  return map[s] || 'info';
};

const getStatusType = (s) => {
  const map = { 待处理: 'info', 处理中: 'warning', 已解决: 'success' };
  return map[s] || 'info';
};

const getProjectStatusType = (s) => {
  const map = {
    未开始: 'info', 进行中: 'primary', 已完成: 'success', 已暂停: 'warning',
  };
  return map[s] || 'info';
};

const progressColor = (p) => {
  if (p < 30) return '#909399';
  if (p < 70) return '#409eff';
  return '#67c23a';
};
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;
}

.stat-card {
  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-info {
      flex: 1;
      min-width: 0;

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }

      .stat-title {
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.list-card {
  :deep(.el-card__body) {
    padding: 0;
    min-height: 280px;
    max-height: 320px;
    overflow-y: auto;
  }
}

.item-list {
  .empty-tip {
    padding: 24px;
    text-align: center;
    color: #c0c4cc;
    font-size: 13px;
  }

  .list-item {
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f9f9f9;
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: 8px;

      .item-tag {
        flex-shrink: 0;
      }

      .item-title {
        font-size: 13px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .item-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 2px;

      .meta-project {
        font-size: 12px;
        color: #909399;
      }

      .meta-date {
        font-size: 12px;
        color: #c0c4cc;
      }

      .meta-assignee {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.project-grid {
  .project-card {
    background: #f8f9fb;
    border-radius: 8px;
    padding: 14px 16px;
    border: 1px solid #ebeef5;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .project-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .project-name {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 160px;
      }
    }

    .project-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .meta-project {
        font-size: 12px;
        color: #909399;
      }

      .task-stat {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.project-card.clickable {
  cursor: pointer;
}

.list-item.clickable {
  cursor: pointer;
}

:deep(.clickable-row) {
  cursor: pointer;
}
</style>
