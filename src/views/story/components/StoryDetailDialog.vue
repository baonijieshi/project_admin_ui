<template>
  <el-dialog
    :model-value="visible"
    title="需求详情"
    width="90%"
    align-center
    destroy-on-close
    class="story-detail-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @open="onOpen"
  >
    <template v-if="row">
      <div class="detail-actions">
        <el-button type="primary" @click="handleCreateProject">
          <el-icon><FolderAdd /></el-icon>创建关联项目
        </el-button>
      </div>

      <div class="detail-layout">
        <!-- 左侧：元数据 -->
        <div class="detail-meta">
          <div class="meta-item">
            <span class="meta-label">需求标题</span>
            <span class="meta-value">{{ row.title }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">所属产品</span>
            <span class="meta-value">{{ row.product_name || '-' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">优先级</span>
            <el-tag :type="priorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">状态</span>
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">指派给</span>
            <span class="meta-value">{{ row.assignee_name || '未指派' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">预估工时</span>
            <span class="meta-value">{{ row.estimate || '未填写' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">创建时间</span>
            <span class="meta-value">{{ row.created_at }}</span>
          </div>
        </div>

        <!-- 中间：描述内容 -->
        <div class="detail-desc" @mouseup="onTextSelect">
          <div class="desc-title">需求描述</div>
          <div
            v-if="row.description"
            ref="descRef"
            class="desc-content"
            v-html="highlightedDesc"
          />
          <div v-else class="desc-empty">暂无描述</div>

          <!-- 划线气泡 -->
          <div
            v-if="selectionPopup.visible"
            class="selection-popup"
            :style="{ top: selectionPopup.y + 'px', left: selectionPopup.x + 'px' }"
          >
            <el-button size="small" type="warning" @click="openCommentInput">
              <el-icon><EditPen /></el-icon>划线评论
            </el-button>
          </div>
        </div>

        <!-- 右侧：评论面板 -->
        <div class="comment-panel">
          <div class="comment-panel-title">
            评论
            <el-badge :value="comments.length" :max="99" type="primary" />
          </div>

          <div class="comment-input-area">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="2"
              placeholder="发表评论..."
              resize="none"
            />
            <el-button
              type="primary"
              size="small"
              style="margin-top: 6px; width: 100%"
              :disabled="!newComment.trim()"
              @click="submitComment(null)"
            >发表</el-button>
          </div>

          <div class="comment-list">
            <div
              v-for="c in comments"
              :key="c.id"
              class="comment-item"
              :class="{ 'is-quote': c.quote_text, 'is-active': activeQuoteId === c.quote_id }"
              @click="scrollToQuote(c)"
            >
              <div v-if="c.quote_text" class="comment-quote">
                <el-icon><ChatLineSquare /></el-icon>
                <span>{{ c.quote_text }}</span>
              </div>
              <div class="comment-body">
                <div class="comment-author-info">
                  <img
                    v-if="c.author_avatar"
                    :src="c.author_avatar"
                    class="comment-avatar"
                    alt="avatar"
                  >
                  <div v-else class="comment-avatar comment-avatar-default">
                    {{ (c.author_name || '匿')[0] }}
                  </div>
                  <span class="comment-author">{{ c.author_name || '匿名' }}</span>
                </div>
                <span class="comment-time">{{ formatTime(c.created_at) }}</span>
              </div>
              <div class="comment-content">{{ c.content }}</div>
              <div class="comment-actions">
                <el-button
                  size="small"
                  link
                  type="primary"
                  @click.stop="toggleReply(c)"
                >回复</el-button>
                <el-button
                  class="comment-delete"
                  size="small"
                  link
                  type="danger"
                  @click.stop="deleteComment(c.id)"
                >删除</el-button>
              </div>

              <!-- 回复列表 -->
              <div v-if="c.replies && c.replies.length" class="reply-list">
                <div v-for="r in c.replies" :key="r.id" class="reply-item">
                  <div class="comment-body">
                    <div class="comment-author-info">
                      <img
                        v-if="r.author_avatar"
                        :src="r.author_avatar"
                        class="comment-avatar reply-avatar"
                        alt="avatar"
                      >
                      <div v-else class="comment-avatar reply-avatar comment-avatar-default">
                        {{ (r.author_name || '匿')[0] }}
                      </div>
                      <span class="comment-author">{{ r.author_name || '匿名' }}</span>
                    </div>
                    <span class="comment-time">{{ formatTime(r.created_at) }}</span>
                  </div>
                  <div class="comment-content reply-content">{{ r.content }}</div>
                  <el-button
                    class="comment-delete"
                    size="small"
                    link
                    type="danger"
                    @click.stop="deleteComment(r.id)"
                  >删除</el-button>
                </div>
              </div>

              <!-- 回复输入框 -->
              <div v-if="replyingTo === c.id" class="reply-input" @click.stop>
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  placeholder="回复评论..."
                  resize="none"
                  size="small"
                />
                <div class="reply-input-actions">
                  <el-button size="small" @click.stop="replyingTo = null">取消</el-button>
                  <el-button
                    size="small"
                    type="primary"
                    :disabled="!replyContent.trim()"
                    @click.stop="submitReply(c.id)"
                  >回复</el-button>
                </div>
              </div>
            </div>
            <div v-if="!comments.length" class="comment-empty">暂无评论</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 划线评论输入弹窗 -->
    <el-dialog
      v-model="quoteDialogVisible"
      title="划线评论"
      width="420px"
      append-to-body
      destroy-on-close
    >
      <div class="quote-preview">
        <el-icon><ChatLineSquare /></el-icon>
        <span>{{ pendingQuote.text }}</span>
      </div>
      <el-input
        v-model="pendingQuote.comment"
        type="textarea"
        :rows="3"
        placeholder="请输入评论内容..."
        style="margin-top: 12px"
      />
      <template #footer>
        <el-button @click="quoteDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!pendingQuote.comment.trim()"
          @click="submitComment(pendingQuote)"
        >提交</el-button>
      </template>
    </el-dialog>

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewList"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </el-dialog>
</template>

<script setup>
import {
  ref, watch, nextTick, computed,
} from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getStoryComments, createStoryComment, deleteStoryComment,
} from '@/api/story';

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
});

const emit = defineEmits(['update:visible']);

const router = useRouter();
const descRef = ref(null);
const previewVisible = ref(false);
const previewList = ref([]);
const previewIndex = ref(0);

// ---- 评论 ----
const comments = ref([]);
const newComment = ref('');
const activeQuoteId = ref(null);

const fetchComments = async () => {
  if (!props.row || !props.row.id) return;
  try {
    const res = await getStoryComments(props.row.id);
    comments.value = res.data || [];
  } catch (e) {
    // 获取评论失败
  }
};

const onOpen = () => {
  fetchComments();
};

const submitComment = async (quoteData) => {
  const content = quoteData ? quoteData.comment : newComment.value;
  if (!content.trim()) return;
  try {
    await createStoryComment(props.row.id, {
      content: content.trim(),
      quote_text: quoteData ? quoteData.text : '',
      quote_id: quoteData ? quoteData.id : '',
    });
    newComment.value = '';
    quoteDialogVisible.value = false;
    await fetchComments();
  } catch (e) {
    ElMessage.error('评论失败');
  }
};

// ---- 回复 ----
const replyingTo = ref(null);
const replyContent = ref('');

const toggleReply = (c) => {
  replyingTo.value = replyingTo.value === c.id ? null : c.id;
  replyContent.value = '';
};

const submitReply = async (parentId) => {
  if (!replyContent.value.trim()) return;
  try {
    await createStoryComment(props.row.id, {
      content: replyContent.value.trim(),
      parent_id: parentId,
    });
    replyContent.value = '';
    replyingTo.value = null;
    await fetchComments();
  } catch (e) {
    ElMessage.error('回复失败');
  }
};

const deleteComment = (id) => {
  ElMessageBox.confirm('确定删除该评论？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteStoryComment(id);
      await fetchComments();
    })
    .catch(() => {});
};

const formatTime = (t) => {
  if (!t) return '';
  return t.slice(0, 16).replace('T', ' ');
};

// ---- 划线 ----
const selectionPopup = ref({
  visible: false, x: 0, y: 0,
});
const pendingQuote = ref({
  text: '', id: '', comment: '',
});
const quoteDialogVisible = ref(false);

const onTextSelect = () => {
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  if (!text || !descRef.value || !descRef.value.contains(sel.anchorNode)) {
    selectionPopup.value.visible = false;
    return;
  }
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const containerRect = descRef.value.getBoundingClientRect();
  selectionPopup.value = {
    visible: true,
    x: rect.left - containerRect.left + rect.width / 2 - 50,
    y: rect.top - containerRect.top - 40,
  };
  pendingQuote.value = {
    text,
    id: 'q_'.concat(String(Date.now())),
    comment: '',
  };
};

const openCommentInput = () => {
  selectionPopup.value.visible = false;
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
  quoteDialogVisible.value = true;
};

// ---- 高亮渲染 ----
const autoLink = (html) => html.replace(
  /(?<!['"=])(https?:\/\/[^\s<>"']+)/g,
  '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
);

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildHighlightedHtml = (html, commentList) => {
  let result = html;
  commentList.forEach((c) => {
    if (!c.quote_text) return;
    const re = new RegExp('('.concat(escapeRegex(c.quote_text), ')'), 'g');
    result = result.replace(
      re,
      '<mark class="story-highlight" data-quote-id="'.concat(c.quote_id, '" title="', c.content, '">$1</mark>'),
    );
  });
  return result;
};

const highlightedDesc = computed(() => {
  const desc = props.row ? props.row.description : '';
  if (!desc) return '';
  return buildHighlightedHtml(autoLink(desc), comments.value);
});

const renderHighlights = async () => {
  await nextTick();
  if (!descRef.value) return;
  const imgs = descRef.value.querySelectorAll('img');
  const urls = Array.from(imgs).map((img) => img.src);
  imgs.forEach((img, i) => {
    img.style.cursor = 'zoom-in';
    img.onclick = () => {
      previewList.value = urls;
      previewIndex.value = i;
      previewVisible.value = true;
    };
  });
  descRef.value.querySelectorAll('.story-highlight').forEach((el) => {
    el.onclick = () => {
      activeQuoteId.value = el.dataset.quoteId;
    };
  });
};

const scrollToQuote = (c) => {
  if (!c.quote_id) return;
  activeQuoteId.value = c.quote_id;
  const el = descRef.value
    ? descRef.value.querySelector('[data-quote-id="'.concat(c.quote_id, '"]'))
    : null;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

watch(highlightedDesc, () => {
  renderHighlights();
});

watch(() => props.visible, (val) => {
  if (!val) {
    selectionPopup.value.visible = false;
    activeQuoteId.value = null;
    comments.value = [];
    replyingTo.value = null;
    replyContent.value = '';
  }
});

const priorityType = (p) => ({ 高: 'danger', 中: 'warning', 低: 'info' }[p] || 'info');
const statusType = (s) => ({
  激活: 'primary', 开发中: 'warning', 已完成: 'success', 已关闭: 'info',
}[s] || 'info');

const handleCreateProject = () => {
  emit('update:visible', false);
  router.push({
    path: '/project',
    query: {
      storyId: props.row.id, storyTitle: props.row.title,
    },
  });
};
</script>

<style src="@wangeditor/editor/dist/css/style.css" />

<style>
.story-detail-dialog .el-dialog__body {
  padding: 16px 20px;
  height: calc(80vh - 55px);
  max-height: calc(80vh - 55px);
  overflow: hidden;
  box-sizing: border-box;
}
</style>

<style scoped lang="scss">
.detail-actions {
  margin-bottom: 16px;
}

.detail-layout {
  display: flex;
  gap: 0;
  height: calc(80vh - 130px);
}

.detail-meta {
  flex: 0 0 180px;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid #e4e7ed;
  padding-right: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.meta-label {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  margin-bottom: 4px;
}

.meta-value {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.detail-desc {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding: 0 20px;
  position: relative;
  user-select: text;
}

.desc-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.desc-content {
  padding: 4px 0;
  line-height: 1.8;
  font-size: 14px;
  color: #303133;

  :deep(.story-highlight) {
    background: #fff3b0;
    border-bottom: 2px solid #f5a623;
    cursor: pointer;
    border-radius: 2px;
    transition: background 0.2s;

    &:hover {
      background: #ffe066;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    cursor: zoom-in;

    &:hover {
      opacity: 0.85;
    }
  }

  :deep(p) { margin: 6px 0; }
  :deep(h1) { font-size: 1.8em; margin: 16px 0 8px; font-weight: 700; }
  :deep(h2) { font-size: 1.5em; margin: 14px 0 7px; font-weight: 700; }
  :deep(h3) { font-size: 1.25em; margin: 12px 0 6px; font-weight: 600; }
  :deep(ul) { padding-left: 20px; margin: 6px 0; list-style-type: disc; }
  :deep(ol) { padding-left: 20px; margin: 6px 0; list-style-type: decimal; }
  :deep(li) { margin: 3px 0; }
  :deep(strong) { font-weight: 700; }
  :deep(em) { font-style: italic; }

  :deep(blockquote) {
    border-left: 4px solid #dcdfe6;
    padding: 4px 12px;
    color: #909399;
    margin: 8px 0;
    background: #f9f9f9;
  }

  :deep(pre) {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background: none;
      padding: 0;
      font-size: 13px;
    }
  }

  :deep(a) {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;

    th,
    td {
      border: 1px solid #dcdfe6;
      padding: 6px 12px;
    }

    th {
      background: #f5f7fa;
      font-weight: 600;
    }
  }

  :deep(code) {
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 13px;
    color: #c7254e;
  }
}

.desc-empty {
  color: #909399;
  font-size: 13px;
  padding: 12px;
}

.selection-popup {
  position: absolute;
  z-index: 100;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 4px 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
}

.comment-panel {
  flex: 0 0 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e4e7ed;
  padding-left: 16px;
}

.comment-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-input-area {
  flex-shrink: 0;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  position: relative;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: #c6e2ff;
    background: #f0f7ff;
  }

  &.is-active {
    border-color: #f5a623;
    background: #fffbf0;
  }

  &.is-quote {
    border-left: 3px solid #f5a623;
  }
}

.comment-quote {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  background: #fafafa;
  border-radius: 3px;
  padding: 4px 6px;
  margin-bottom: 6px;
  line-height: 1.5;

  span {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.comment-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-avatar-default {
  background: #409eff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.comment-author {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 11px;
  color: #c0c4cc;
}

.comment-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  word-break: break-all;
}

.comment-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.2s;

  .comment-item:hover & {
    opacity: 1;
  }
}

.comment-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.reply-list {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  position: relative;
  padding: 6px 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.reply-avatar {
  width: 20px !important;
  height: 20px !important;
  font-size: 11px !important;
}

.reply-content {
  font-size: 12px;
  padding-left: 26px;
}

.reply-input {
  margin-top: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
}

.comment-empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 20px 0;
}

.quote-preview {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #fffbf0;
  border-left: 3px solid #f5a623;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
</style>
