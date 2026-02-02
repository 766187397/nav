<template>
  <div class="hot-suggestions-editor">
    <div class="editor-header">
      <h3>热门搜索建议</h3>
      <p class="editor-hint">每行一个关键词，或用逗号分隔多个关键词</p>
    </div>
    <div class="editor-body">
      <textarea
        v-model="suggestionsText"
        class="suggestions-textarea"
        rows="2"
        placeholder="输入热门搜索关键词，例如：Vue3教程, React开发, TypeScript"
        @input="handleInput"></textarea>
      <div class="editor-actions">
        <button @click="saveSuggestions" class="btn btn-primary" :disabled="saveStatus === 'saving'">
          <span v-if="saveStatus === 'saving'">⏳ 保存中...</span>
          <span v-else-if="saveStatus === 'success'">✅ 保存成功</span>
          <span v-else>💾 保存</span>
        </button>
        <button @click="resetSuggestions" class="btn btn-secondary" :disabled="saveStatus === 'saving'">
          🔄 重置
        </button>
      </div>
      <div v-if="errorMessage" class="error-message">
        ❌ {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import localforage from "localforage";
import websitesData from "@/data/websites.json";

const suggestionsText = ref("");
const saveStatus = ref<"idle" | "saving" | "success" | "error">("idle");
const errorMessage = ref("");

const loadSuggestions = async () => {
  try {
    const cachedSuggestions = await localforage.getItem<string[]>("hotSuggestions");
    if (cachedSuggestions && Array.isArray(cachedSuggestions)) {
      suggestionsText.value = cachedSuggestions.join(", ");
    } else {
      const defaultSuggestions = (websitesData as { hotSuggestions: string[] }).hotSuggestions || [];
      suggestionsText.value = defaultSuggestions.join(", ");
      await localforage.setItem("hotSuggestions", defaultSuggestions);
    }
  } catch (error) {
    console.error("加载热门搜索建议失败:", error);
    const defaultSuggestions = (websitesData as { hotSuggestions: string[] }).hotSuggestions || [];
    suggestionsText.value = defaultSuggestions.join(", ");
    await localforage.setItem("hotSuggestions", defaultSuggestions);
  }
};

const handleInput = () => {
  saveStatus.value = "idle";
  errorMessage.value = "";
};

const saveSuggestions = async () => {
  try {
    saveStatus.value = "saving";
    errorMessage.value = "";

    const suggestions = parseSuggestions(suggestionsText.value);

    if (suggestions.length === 0) {
      errorMessage.value = "请至少输入一个热门搜索关键词";
      saveStatus.value = "error";
      return;
    }

    await localforage.setItem("hotSuggestions", suggestions);

    saveStatus.value = "success";

    setTimeout(() => {
      saveStatus.value = "idle";
    }, 2000);
  } catch (error) {
    console.error("保存热门搜索建议失败:", error);
    errorMessage.value = "保存失败，请重试";
    saveStatus.value = "error";

    setTimeout(() => {
      saveStatus.value = "idle";
    }, 5000);
  }
};

const resetSuggestions = async () => {
  try {
    const defaultSuggestions = (websitesData as { hotSuggestions: string[] }).hotSuggestions || [];
    suggestionsText.value = defaultSuggestions.join(", ");
    await localforage.setItem("hotSuggestions", defaultSuggestions);
    saveStatus.value = "success";

    setTimeout(() => {
      saveStatus.value = "idle";
    }, 2000);
  } catch (error) {
    console.error("重置热门搜索建议失败:", error);
    errorMessage.value = "重置失败，请重试";
    saveStatus.value = "error";

    setTimeout(() => {
      saveStatus.value = "idle";
    }, 5000);
  }
};

const parseSuggestions = (text: string): string[] => {
  return text
    .split(/[,，\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

onMounted(() => {
  loadSuggestions();
});
</script>

<style scoped>
.hot-suggestions-editor {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.editor-header {
  margin-bottom: 1rem;
}

.editor-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-weight: 600;
  font-size: 1.125rem;
}

.editor-hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.editor-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestions-textarea {
  width: 100%;
  min-height: 60px;
  max-height: 180px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.suggestions-textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.suggestions-textarea::placeholder {
  color: #9ca3af;
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  text-align: center;
}

@media (max-width: 768px) {
  .hot-suggestions-editor {
    padding: 1rem;
    border-radius: 8px;
  }

  .editor-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .suggestions-textarea {
    font-size: 0.875rem;
    padding: 0.875rem;
  }
}
</style>
