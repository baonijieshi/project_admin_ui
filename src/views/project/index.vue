<template>
  <div class="version-page">
    <!-- 顶部工具栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">版本管理</h2>
        <span class="page-subtitle">{{ totalVersionCount }} 个版本</span>
      </div>
      <div class="header-actions">
        <el-segmented v-model="viewMode" :options="viewOptions" size="default" />
        <el-button :loading="feishuPulling" @click="handlePullFeishu">
          <el-icon><Download /></el-icon>拉取飞书需求
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建版本</el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="queryParams.name"
        placeholder="搜索版本名称"
        clearable
        :prefix-icon="Search"
        style="width: 220px"
        @input="debounceFetch"
        @clear="handleSearch"
      />
      <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 130px" @change="handleSearch">
        <el-option label="未开始" value="未开始" />
        <el-option label="进行中" value="进行中" />
        <el-option label="已完成" value="已完成" />
        <el-option label="已暂停" value="已暂停" />
        <el-option label="已归档" value="已归档" />
      </el-select>
      <UserCascader v-model="queryParams.manager" :user-list="pmUserList" value-key="label" placeholder="产品经理" width="150px" @change="handleSearch" />
      <UserCascader v-if="viewMode === 'time'" v-model="queryParams.testLeader" :user-list="testUserList" value-key="label" placeholder="测试负责人" width="150px" @change="handleSearch" />
      <el-button v-if="hasFilter" link type="primary" @click="handleReset">清除筛选</el-button>
    </div>

    <!-- ═══ 时间视图 ═══ -->
    <template v-if="viewMode === 'time'">
      <div v-if="yearGroups.length > 0" v-loading="loading" class="version-grouped">
        <div v-for="yg in yearGroups" :key="yg.year" class="year-group">
          <div class="year-group__header" role="button" tabindex="0" :aria-expanded="expandedYears.has(yg.year)" @click="toggleYear(yg.year)" @keydown.enter="toggleYear(yg.year)">
            <el-icon class="collapse-icon" :class="{ 'is-open': expandedYears.has(yg.year) }"><ArrowRight /></el-icon>
            <span class="year-group__label">{{ yg.year === '未规划' ? '未规划' : `${yg.year} 年` }}</span>
            <el-badge :value="yg.total" :max="999" class="year-group__badge" />
          </div>
          <el-collapse-transition>
            <div v-show="expandedYears.has(yg.year)" class="quarter-list">
              <div v-for="qg in yg.quarters" :key="qg.quarter" class="quarter-group">
                <div class="quarter-group__header" role="button" tabindex="0" :aria-expanded="expandedQuarters.has(`${yg.year}-${qg.quarter}`)" @click="toggleQuarter(yg.year, qg.quarter)" @keydown.enter="toggleQuarter(yg.year, qg.quarter)">
                  <el-icon class="collapse-icon collapse-icon--sm" :class="{ 'is-open': expandedQuarters.has(`${yg.year}-${qg.quarter}`) }"><ArrowRight /></el-icon>
                  <span class="quarter-group__label">{{ qg.quarter }}</span>
                  <span class="quarter-group__count">{{ qg.count }} 个版本</span>
                </div>
                <el-collapse-transition>
                  <div v-show="expandedQuarters.has(`${yg.year}-${qg.quarter}`)" class="version-timeline">
                    <div v-if="quarterLoading[`${yg.year}-${qg.quarter}`]" v-loading="true" style="height: 80px" />
                    <template v-else>
                      <VersionCard v-for="ver in (quarterVersions[`${yg.year}-${qg.quarter}`] || [])" :key="ver.id" :version="ver" @click="handleDetail(ver)" @edit="handleEdit(ver)" @delete="handleDelete(ver)" @archive="handleArchive(ver)" @go-bug="goToBugPage(ver)" />
                      <div v-if="(quarterTotals[`${yg.year}-${qg.quarter}`] || 0) > PAGE_SIZE" class="lazy-pagination">
                        <el-pagination :current-page="quarterPages[`${yg.year}-${qg.quarter}`] || 1" :page-size="PAGE_SIZE" :total="quarterTotals[`${yg.year}-${qg.quarter}`] || 0" layout="prev, pager, next" small background @current-change="(p) => handleQuarterPage(yg.year, qg.quarter, p)" />
                      </div>
                    </template>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
      <div v-else-if="!loading" class="empty-state">
        <el-empty :image-size="120" description="">
          <template #description>
            <p class="empty-title">{{ hasFilter ? '没有匹配的版本' : '还没有版本' }}</p>
            <p class="empty-desc">{{ hasFilter ? '试试调整筛选条件' : '创建第一个版本来开始管理迭代' }}</p>
          </template>
          <el-button v-if="!hasFilter" type="primary" @click="handleAdd">新建版本</el-button>
          <el-button v-else @click="handleReset">清除筛选</el-button>
        </el-empty>
      </div>
    </template>

    <!-- ═══ 人员视图 ═══ -->
    <template v-if="viewMode === 'person'">
      <div v-if="personGroups.length > 0" v-loading="loading" class="version-grouped">
        <div v-for="pg in personGroups" :key="pg.id ?? 'unassigned'" class="year-group">
          <div class="year-group__header" role="button" tabindex="0" :aria-expanded="expandedPersons.has(pg.id)" @click="togglePerson(pg)" @keydown.enter="togglePerson(pg)">
            <el-icon class="collapse-icon" :class="{ 'is-open': expandedPersons.has(pg.id) }"><ArrowRight /></el-icon>
            <div class="person-avatars">
              <el-avatar v-for="(av, idx) in (pg.avatars || [pg.avatar])" :key="idx" :size="28" :src="av || ''">{{ ((pg.names || [pg.name])[idx] || '?').charAt(0) }}</el-avatar>
            </div>
            <span class="year-group__label">{{ pg.name }}</span>
            <el-badge :value="pg.count" :max="999" class="year-group__badge" />
          </div>
          <el-collapse-transition>
            <div v-show="expandedPersons.has(pg.id)" class="person-versions">
              <div v-if="personLoading[pg.id]" v-loading="true" style="height: 80px" />
              <template v-else>
                <VersionCard v-for="ver in (personVersions[pg.id] || [])" :key="ver.id" :version="ver" @click="handleDetail(ver)" @edit="handleEdit(ver)" @delete="handleDelete(ver)" @archive="handleArchive(ver)" @go-bug="goToBugPage(ver)" />
                <div v-if="(personTotals[pg.id] || 0) > PAGE_SIZE" class="lazy-pagination">
                  <el-pagination :current-page="personPages[pg.id] || 1" :page-size="PAGE_SIZE" :total="personTotals[pg.id] || 0" layout="prev, pager, next" small background @current-change="(p) => handlePersonPage(pg, p)" />
                </div>
              </template>
            </div>
          </el-collapse-transition>
        </div>
      </div>
      <div v-else-if="!loading" class="empty-state">
        <el-empty :image-size="120" description="">
          <template #description>
            <p class="empty-title">{{ hasFilter ? '没有匹配的版本' : '还没有版本' }}</p>
            <p class="empty-desc">{{ hasFilter ? '试试调整筛选条件' : '创建第一个版本来开始管理迭代' }}</p>
          </template>
          <el-button v-if="!hasFilter" type="primary" @click="handleAdd">新建版本</el-button>
          <el-button v-else @click="handleReset">清除筛选</el-button>
        </el-empty>
      </div>
    </template>

    <!-- 弹窗 -->
    <VersionDialog v-model:visible="dialogVisible" :editing-id="editingId" :initial-form="editingForm" :story-options="storyOptions" :project-options="projectOptions" :pm-user-list="pmUserList" :dev-user-list="devUserList" :test-user-list="testUserList" @saved="handleSaved" />
    <VersionDetailDialog v-model:visible="detailVisible" :version="detailVersion" @refresh-list="handleRefreshFromDetail" />
  </div>
</template>

<script setup>
import {
  ref, reactive, computed, watch, onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, Search, ArrowRight, Download,
} from '@element-plus/icons-vue';
import {
  getVersionGrouped, getVersionByQuarter,
  getVersionPersonGrouped, getVersionByPerson,
  deleteVersion, pullFeishuVersions, archiveVersion,
} from '@/api/version';
import { getUserList } from '@/api/user';
import { getStoryList } from '@/api/story';
import { getProjectList } from '@/api/project';
import UserCascader from '@/components/UserCascader.vue';
import VersionCard from './components/VersionCard.vue';
import VersionDialog from './components/VersionDialog.vue';
import VersionDetailDialog from './components/VersionDetailDialog.vue';

const router = useRouter();
const route = useRoute();
const PAGE_SIZE = 20;

// ── 视图模式 ──
const viewMode = ref('time');
const viewOptions = [
  { label: '时间视图', value: 'time' },
  { label: '人员视图', value: 'person' },
];

// ── 筛选 ──
const queryParams = reactive({
  name: '', status: '', manager: null, testLeader: null,
});
const hasFilter = computed(
  () => queryParams.name || queryParams.status || queryParams.manager || queryParams.testLeader,
);
const filterParams = computed(() => {
  const p = {};
  if (queryParams.name) p.name = queryParams.name;
  if (queryParams.status) p.status = queryParams.status;
  if (queryParams.manager) p.manager = queryParams.manager;
  if (queryParams.testLeader) p.testLeader = queryParams.testLeader;
  return p;
});

// ── 基础数据 ──
const pmUserList = ref([]);
const devUserList = ref([]);
const testUserList = ref([]);
const storyOptions = ref([]);
const projectOptions = ref([]);
const loading = ref(false);
const totalVersionCount = ref(0);

const mapUser = (u) => ({
  id: u.id, label: u.first_name || u.username, avatar: u.avatar || '', dept: u.dept || '',
});

const mapVersion = (v) => ({
  id: v.id,
  name: v.name,
  status: v.status,
  progress: v.progress || 0,
  startDate: v.start_date,
  endDate: v.end_date,
  manager: v.manager_name,
  managerAvatar: v.manager_avatar,
  devLeader: v.dev_leader_name,
  devLeaderAvatar: v.dev_leader_avatar,
  testLeader: (v.test_leader_names || []).join('、'),
  testLeaderAvatar: (v.test_leader_avatars || [])[0] || '',
  testLeaderNames: v.test_leader_names || [],
  testLeaderAvatars: v.test_leader_avatars || [],
  testLeaderIds: v.test_leader_ids || [],
  storyTitle: v.story_title,
  projectNames: v.project_names || [],
  projectIds: v.project_ids || [],
  taskTotal: v.task_total || 0,
  taskDone: v.task_done || 0,
  bugCount: v.bug_count || 0,
  desc: v.description || '',
  story: v.story,
  managerId: v.manager,
  devLeaderId: v.dev_leader,
  isArchived: v.is_archived || false,
});

// ── 时间视图：后端分组 + 懒加载 ──
const yearGroups = ref([]);
const expandedYears = reactive(new Set());
const expandedQuarters = reactive(new Set());
const quarterVersions = reactive({});
const quarterTotals = reactive({});
const quarterPages = reactive({});
const quarterLoading = reactive({});

const fetchGrouped = async () => {
  loading.value = true;
  try {
    const res = await getVersionGrouped(filterParams.value);
    yearGroups.value = res.data.groups || [];
    totalVersionCount.value = res.data.total || 0;
    // 自动展开最新的年份和季度
    if (yearGroups.value.length > 0) {
      const firstYear = yearGroups.value[0];
      expandedYears.add(firstYear.year);
      if (firstYear.quarters && firstYear.quarters.length > 0) {
        const firstQ = firstYear.quarters[0];
        const key = `${firstYear.year}-${firstQ.quarter}`;
        expandedQuarters.add(key);
        fetchQuarterVersions(firstYear.year, firstQ.quarter);
      }
    }
  } finally { loading.value = false; }
};

const fetchQuarterVersions = async (year, quarter, page = 1) => {
  const key = `${year}-${quarter}`;
  quarterLoading[key] = true;
  try {
    const res = await getVersionByQuarter({
      ...filterParams.value, year, quarter, page, pageSize: PAGE_SIZE,
    });
    quarterVersions[key] = (res.data.list || []).map(mapVersion);
    quarterTotals[key] = res.data.total || 0;
    quarterPages[key] = page;
  } finally { quarterLoading[key] = false; }
};

const toggleYear = (year) => {
  if (expandedYears.has(year)) expandedYears.delete(year);
  else expandedYears.add(year);
};
const toggleQuarter = (year, quarter) => {
  const key = `${year}-${quarter}`;
  if (expandedQuarters.has(key)) { expandedQuarters.delete(key); return; }
  expandedQuarters.add(key);
  if (!quarterVersions[key]) fetchQuarterVersions(year, quarter);
};
const handleQuarterPage = (year, quarter, page) => fetchQuarterVersions(year, quarter, page);

// ── 人员视图：后端分组 + 懒加载 ──
const personGroups = ref([]);
const expandedPersons = reactive(new Set());
const personVersions = reactive({});
const personTotals = reactive({});
const personPages = reactive({});
const personLoading = reactive({});

const fetchPersonGrouped = async () => {
  loading.value = true;
  try {
    const res = await getVersionPersonGrouped(filterParams.value);
    personGroups.value = res.data.persons || [];
    totalVersionCount.value = res.data.total || 0;
    // 自动展开第一个人
    if (personGroups.value.length > 0) {
      const first = personGroups.value[0];
      expandedPersons.add(first.id);
      const vids = first.version_ids ? first.version_ids.join(',') : null;
      fetchPersonVersions(first.id, 1, vids);
    }
  } finally { loading.value = false; }
};

const fetchPersonVersions = async (personId, page = 1, versionIds = null) => {
  personLoading[personId] = true;
  try {
    const params = {
      ...filterParams.value, personId: personId ?? 'null', page, pageSize: PAGE_SIZE,
    };
    if (versionIds) params.versionIds = versionIds;
    const res = await getVersionByPerson(params);
    personVersions[personId] = (res.data.list || []).map(mapVersion);
    personTotals[personId] = res.data.total || 0;
    personPages[personId] = page;
  } finally { personLoading[personId] = false; }
};

const togglePerson = (pg) => {
  const key = pg.id;
  if (expandedPersons.has(key)) { expandedPersons.delete(key); return; }
  expandedPersons.add(key);
  if (!personVersions[key]) {
    const vids = pg.version_ids ? pg.version_ids.join(',') : null;
    fetchPersonVersions(pg.id, 1, vids);
  }
};
const handlePersonPage = (pg, page) => {
  const vids = pg.version_ids ? pg.version_ids.join(',') : null;
  fetchPersonVersions(pg.id, page, vids);
};

// ── 搜索 & 重置（带防抖）──
let debounceTimer = null;
const debounceFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => handleSearch(), 300);
};

const clearCaches = () => {
  expandedYears.clear(); expandedQuarters.clear(); expandedPersons.clear();
  Object.keys(quarterVersions).forEach((k) => { delete quarterVersions[k]; });
  Object.keys(quarterTotals).forEach((k) => { delete quarterTotals[k]; });
  Object.keys(quarterPages).forEach((k) => { delete quarterPages[k]; });
  Object.keys(personVersions).forEach((k) => { delete personVersions[k]; });
  Object.keys(personTotals).forEach((k) => { delete personTotals[k]; });
  Object.keys(personPages).forEach((k) => { delete personPages[k]; });
};

const handleSearch = () => {
  clearCaches();
  if (viewMode.value === 'time') fetchGrouped();
  else fetchPersonGrouped();
};

const handleReset = () => {
  queryParams.name = '';
  queryParams.status = '';
  queryParams.manager = null;
  queryParams.testLeader = null;
  handleSearch();
};

watch(viewMode, (val) => {
  clearCaches();
  if (val === 'time') fetchGrouped();
  else fetchPersonGrouped();
});

// ── 版本 CRUD ──
const dialogVisible = ref(false);
const editingId = ref(null);
const editingForm = ref(null);

const handleAdd = () => { editingId.value = null; editingForm.value = null; dialogVisible.value = true; };
const handleEdit = (ver) => {
  editingId.value = ver.id;
  editingForm.value = {
    name: ver.name,
    story: ver.story || null,
    projectIds: ver.projectIds || [],
    manager: ver.managerId || null,
    devLeader: ver.devLeaderId || null,
    testLeader: ver.testLeaderIds || [],
    status: ver.status,
    startDate: ver.startDate || '',
    endDate: ver.endDate || '',
    desc: ver.desc || '',
  };
  dialogVisible.value = true;
};
const handleDelete = (ver) => {
  ElMessageBox.confirm(`确定删除版本「${ver.name}」？此操作不可恢复。`, '提示', { type: 'warning' })
    .then(async () => { await deleteVersion(ver.id); ElMessage.success('已删除'); handleSearch(); })
    .catch(() => {});
};
const handleArchive = async (ver) => {
  try {
    const res = await archiveVersion(ver.id);
    ElMessage.success(res.message || '操作成功');
    handleSearch();
  } catch { ElMessage.error('操作失败'); }
};
const handleSaved = () => handleSearch();

// ── 详情 ──
const detailVisible = ref(false);
const detailVersion = ref(null);
const handleDetail = (ver) => { detailVersion.value = ver; detailVisible.value = true; };
const handleRefreshFromDetail = () => handleSearch();

const goToBugPage = (ver) => {
  router.push({ path: '/test/bug', query: { versionId: ver.id, versionName: ver.name } });
};

// ── 飞书拉取 ──
const feishuPulling = ref(false);
const handlePullFeishu = async () => {
  feishuPulling.value = true;
  try {
    const res = await pullFeishuVersions();
    ElMessage.success(res.message || '拉取完成');
    handleSearch();
  } catch { ElMessage.error('拉取失败，请稍后重试'); } finally { feishuPulling.value = false; }
};

// ── 初始化 ──
onMounted(async () => {
  fetchGrouped();
  try {
    const [userRes, storyRes, projectRes] = await Promise.all([
      getUserList(), getStoryList({ page: 1, pageSize: 999 }), getProjectList({ page: 1, pageSize: 999 }),
    ]);
    const users = (userRes.data || []).map(mapUser);
    pmUserList.value = users; devUserList.value = users; testUserList.value = users;
    storyOptions.value = storyRes.data?.list || storyRes.data || [];
    projectOptions.value = projectRes.data?.list || projectRes.data || [];
  } catch { /* ignore */ }
  // 支持从需求页跳转过来自动打开新建
  const { storyId, storyTitle, versionId } = route.query;
  if (storyId && storyTitle) {
    editingForm.value = {
      name: storyTitle,
      story: Number(storyId),
      manager: null,
      devLeader: null,
      testLeader: [],
      status: '未开始',
      startDate: '',
      endDate: '',
      desc: '',
    };
    dialogVisible.value = true;
    router.replace({ path: route.path });
  } else if (versionId) {
    // 从首页待办等入口跳转过来，自动打开版本详情
    const vid = Number(versionId);
    const tryOpen = () => {
      // 在已加载的季度数据中查找
      const allLoaded = Object.values(quarterVersions).flat();
      const found = allLoaded.find((v) => v.id === vid);
      if (found) { handleDetail(found); router.replace({ path: route.path }); return; }
      // 未找到则用 API 获取详情
      import('@/api/version').then(({ getVersionDetail }) => {
        getVersionDetail(vid, { tab: 'task' }).then((res) => {
          const v = res.data?.version;
          if (v) { handleDetail(mapVersion(v)); }
        });
      });
      router.replace({ path: route.path });
    };
    setTimeout(tryOpen, 500);
  }
});
</script>

<style scoped lang="scss">
.version-page {
  padding: 20px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: baseline; gap: 10px; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.page-subtitle { font-size: 13px; color: #909399; }
.filter-bar {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-shrink: 0; flex-wrap: wrap;
}
.version-grouped {
  flex: 1; overflow-y: auto; padding-right: 4px;
}

/* ── 年份 / 人员分组 ── */
.year-group {
  margin-bottom: 4px;
  &__header {
    display: flex; align-items: center; gap: 8px; padding: 10px 12px;
    cursor: pointer; border-radius: 6px; user-select: none; transition: background 0.15s;
    &:hover { background: #f5f7fa; }
  }
  &__label { font-size: 15px; font-weight: 600; color: #303133; }
  &__badge {
    :deep(.el-badge__content) { position: static; transform: none; font-size: 11px; height: 18px; line-height: 18px; padding: 0 6px; background: #ecf5ff; color: #409eff; border: none; }
  }
}
.quarter-list { padding-left: 20px; }
.quarter-group {
  margin-bottom: 2px;
  &__header {
    display: flex; align-items: center; gap: 6px; padding: 7px 10px;
    cursor: pointer; border-radius: 4px; user-select: none; transition: background 0.15s;
    &:hover { background: #f5f7fa; }
  }
  &__label { font-size: 13px; font-weight: 500; color: #606266; }
  &__count { font-size: 12px; color: #909399; margin-left: 4px; }
}
.version-timeline { padding: 4px 0 8px 24px; }
.person-versions { padding: 4px 0 8px 50px; }
.person-avatars {
  display: flex; gap: 2px;
  .el-avatar { background: linear-gradient(135deg, #409eff, #66b1ff); color: #fff; font-size: 11px; }
}
.collapse-icon {
  font-size: 14px; color: #909399; transition: transform 0.2s;
  &.is-open { transform: rotate(90deg); }
  &--sm { font-size: 12px; }
}
.lazy-pagination { display: flex; justify-content: center; padding: 8px 0; }
.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 15px; color: #606266; margin: 0 0 4px; }
.empty-desc { font-size: 13px; color: #909399; margin: 0; }
</style>
