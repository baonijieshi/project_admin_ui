<template>
  <div>
    <el-drawer
      :model-value="visible"
      title="Bug 详情"
      size="700px"
      destroy-on-close
      @update:model-value="$emit('update:visible', $event)"
    >
      <div v-if="bug" class="drawer-body">

        <!-- 标题行 -->
        <div class="bug-header">
          <span :class="['sev-bar', `sev-${bug.severity}`]" />
          <span class="bug-title">{{ bug.title }}</span>
          <span :class="['status-pill', `status-${bug.status}`]">{{ bug.status }}</span>
        </div>

        <!-- 基本信息 -->
        <div class="section">
          <div class="section-title">基本信息</div>
          <div class="desc-list">
            <div class="desc-row">
              <span class="desc-label">Bug 类型</span>
              <span class="desc-value">{{ bug.bug_type || '-' }}</span>
              <span class="desc-label">所属模块</span>
              <span class="desc-value">{{ bug.module || '-' }}</span>
            </div>
            <div class="desc-row">
              <span class="desc-label">严重程度</span>
              <span class="desc-value">
                <span :class="['sev-tag', `sev-tag-${bug.severity}`]">{{ bug.severity }}</span>
              </span>
              <span class="desc-label">优先级</span>
              <span class="desc-value">
                <span :class="['pri-tag', `pri-${bug.priority?.toLowerCase()}`]">{{ bug.priority }}</span>
              </span>
            </div>
            <div class="desc-row">
              <span class="desc-label">指派给</span>
              <span class="desc-value">
                <span v-if="bug.assignee_name" class="user-cell">
                  <el-avatar :size="18" :src="bug.assignee_avatar || ''">
                    <span>{{ String(bug.assignee_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ bug.assignee_name }}
                </span>
                <span v-else>-</span>
              </span>
              <span class="desc-label">创建人</span>
              <span class="desc-value">
                <span v-if="bug.reporter_name" class="user-cell">
                  <el-avatar :size="18" :src="bug.reporter_avatar || ''">
                    <span>{{ String(bug.reporter_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ bug.reporter_name }}
                </span>
                <span v-else>-</span>
              </span>
            </div>
            <div class="desc-row">
              <span class="desc-label">创建时间</span>
              <span class="desc-value">{{ bug.created_at || '-' }}</span>
              <span class="desc-label">关联版本</span>
              <span class="desc-value">
                <span v-if="bug.version_name" class="ver-tag">{{ bug.version_name }}</span>
                <span v-else>-</span>
              </span>
            </div>
            <div v-if="bug.remark" class="desc-row">
              <span class="desc-label">备注</span>
              <span class="desc-value desc-value--span">{{ bug.remark }}</span>
            </div>
          </div>
        </div>

        <!-- 解决信息（有解决人时显示） -->
        <div v-if="bug.resolver_name" class="section">
          <div class="section-title">解决信息</div>
          <div class="desc-list">
            <div class="desc-row">
              <span class="desc-label">解决人</span>
              <span class="desc-value">
                <span class="user-cell">
                  <el-avatar :size="18" :src="bug.resolver_avatar || ''">
                    <span>{{ String(bug.resolver_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ bug.resolver_name }}
                </span>
              </span>
              <span class="desc-label">解决时间</span>
              <span class="desc-value">{{ bug.resolved_at || '-' }}</span>
            </div>
            <div v-if="bug.resolution" class="desc-row">
              <span class="desc-label">解决类型</span>
              <span class="desc-value">{{ bug.resolution }}</span>
              <span class="desc-label">产生原因</span>
              <span class="desc-value">{{ bug.cause || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 重现步骤 -->
        <div class="section">
          <div class="section-title">重现步骤</div>
          <div
            v-if="bug.steps_to_reproduce"
            ref="stepsRef"
            class="steps-content"
            v-html="bug.steps_to_reproduce"
          />
          <div v-else class="steps-empty">暂无重现步骤</div>
        </div>

      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="$emit('update:visible', false)">关闭</el-button>
          <div v-if="bug" class="footer-actions">
            <el-button type="primary" plain @click="$emit('edit', bug)">编辑</el-button>
            <el-button
              v-if="!['已解决', '已关闭'].includes(bug.status)"
              type="success"
              @click="$emit('resolve', bug)"
            >解决</el-button>
            <el-button
              v-else
              type="warning"
              @click="$emit('activate', bug)"
            >激活</el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <el-image-viewer
      v-if="previewVisible && previewList.length"
      :url-list="previewList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  visible: Boolean,
  bug: { type: Object, default: null },
});

defineEmits(['update:visible', 'edit', 'resolve', 'activate']);

const stepsRef = ref(null);
const previewVisible = ref(false);
const previewList = ref([]);
const previewIndex = ref(0);

watch(() => props.bug, async () => {
  await nextTick();
  if (!stepsRef.value) return;
  const imgs = stepsRef.value.querySelectorAll('img');
  const urls = Array.from(imgs).map((img) => img.src);
  imgs.forEach((img, i) => {
    img.style.cursor = 'zoom-in';
    img.onclick = () => {
      previewList.value = urls;
      previewIndex.value = i;
      previewVisible.value = true;
    };
  });
});
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 4px 0 24px;
  overflow-y: auto;
}

/* 标题行 */
.bug-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
}

.sev-bar {
  display: inline-block;
  width: 4px;
  min-height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 3px;

  &.sev-致命 { background: #f56c6c; }
  &.sev-严重 { background: #e6a23c; }
  &.sev-一般 { background: #409eff; }
  &.sev-轻微 { background: #67c23a; }
  &.sev-建议 { background: #c0c4cc; }
}

.bug-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.5;
  word-break: break-all;
}

.status-pill {
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  &.status-待处理 { background: #f2f3f5; color: #86909c; }
  &.status-处理中 { background: #fff7e8; color: #ff7d00; }
  &.status-已解决 { background: #e8ffea; color: #00b42a; }
  &.status-已关闭 { background: #f2f3f5; color: #4e5969; }
  &.status-已拒绝 { background: #ffece8; color: #f53f3f; }
  &.status-激活   { background: #e8f3ff; color: #165dff; }
}

/* 分区 */
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #86909c;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f2f3f5;
}

/* 描述列表 */
.desc-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.desc-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px 1fr;
  align-items: center;
  min-height: 36px;
  border-bottom: 1px solid #f7f8fa;

  &:last-child { border-bottom: none; }
}

.desc-label {
  font-size: 13px;
  color: #86909c;
  padding: 8px 12px 8px 0;
  white-space: nowrap;
}

.desc-value {
  font-size: 13px;
  color: #1d2129;
  padding: 8px 16px 8px 0;

  &--span {
    grid-column: 2 / -1;
  }
}

/* 严重程度 tag */
.sev-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;

  &.sev-tag-致命 { background: #ffece8; color: #f53f3f; }
  &.sev-tag-严重 { background: #fff7e8; color: #ff7d00; }
  &.sev-tag-一般 { background: #e8f3ff; color: #165dff; }
  &.sev-tag-轻微 { background: #e8ffea; color: #00b42a; }
  &.sev-tag-建议 { background: #f2f3f5; color: #86909c; }
}

/* 优先级 tag */
.pri-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;

  &.pri-p0 { background: #ffece8; color: #f53f3f; }
  &.pri-p1 { background: #fff7e8; color: #ff7d00; }
  &.pri-p2 { background: #e8f3ff; color: #165dff; }
  &.pri-p3 { background: #f2f3f5; color: #86909c; }
}

/* 版本 tag */
.ver-tag {
  display: inline-block;
  padding: 1px 8px;
  background: #e8f3ff;
  color: #165dff;
  border-radius: 3px;
  font-size: 12px;
}

/* 用户行 */
.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1d2129;
}

/* 重现步骤 */
.steps-content {
  font-size: 13px;
  line-height: 1.8;
  color: #1d2129;
  background: #f7f8fa;
  border-radius: 6px;
  padding: 12px 16px;

  :deep(img) {
    max-width: 100%;
    border-radius: 4px;
    cursor: zoom-in;
    &:hover { opacity: 0.85; }
  }
  :deep(p) { margin: 4px 0; }
  :deep(pre) {
    background: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
  :deep(code) {
    background: #fff;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: monospace;
  }
}

.steps-empty {
  font-size: 13px;
  color: #c9cdd4;
  padding: 12px 0;
}

/* footer */
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-actions {
  display: flex;
  gap: 8px;
}
</style>
