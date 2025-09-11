import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/home/Index.vue";
import Admin from "@/views/Admin.vue";
import Error from "@/views/error/Index.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      meta: {
        title: "快捷导航",
      },
    },
    {
      path: "/admin",
      name: "admin",
      component: Admin,
      meta: {
        title: "管理导航",
      },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: Error,
      meta: {
        title: "404 Not Found",
      },
    },
  ],
});

// 全局前置守卫，处理页面标题和登录验证
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || "快捷导航";
  next();
});

export default router;
