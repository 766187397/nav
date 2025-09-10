<template>
  <div class="nav-home">
    <!-- 搜索功能 -->
    <div class="search-section">
      <SearchEngine />
    </div>

    <!-- 网站导航 -->
    <WebsiteNav />
  </div>
</template>

<script setup lang="ts">
  import SearchEngine from "@/components/SearchEngine.vue";
  import WebsiteNav from "@/components/WebsiteNav.vue";
</script>

<style scoped>
  .nav-home {
    min-height: 100vh;
    background: #ffffff;
  }

  .search-section {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #f8fafc;
  }

  @media (max-width: 768px) {
    .search-section {
      padding: 1rem;
      min-height: 60vh;
    }
  }
</style>
