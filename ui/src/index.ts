import { definePlugin } from "@halo-dev/console-shared";
import { initTheme } from "./composables/useTheme";

// Initialize theme system
initTheme();

// 路由级懒加载：按需加载视图组件，减小首屏 bundle 体积
const Dashboard = () => import("./views/Dashboard.vue");
const Pomodoro = () => import("./views/Pomodoro.vue");
const Habits = () => import("./views/Habits.vue");
const Tasks = () => import("./views/Tasks.vue");
const Statistics = () => import("./views/Statistics.vue");
const Settings = () => import("./views/Settings.vue");

export default definePlugin({
  components: {},
  routes: [
    {
      parentName: "Root",
      route: {
        path: "/habit-tracker",
        children: [
          {
            path: "",
            name: "HabitDashboard",
            component: Dashboard,
            meta: {
              title: "仪表盘",
              searchable: true,
              menu: {
                name: "仪表盘",
                group: "tool",
                icon: "dashboard",
                priority: 50,
              },
            },
          },
          {
            path: "pomodoro",
            name: "HabitPomodoro",
            component: Pomodoro,
            meta: {
              title: "番茄钟",
              searchable: true,
              menu: {
                name: "番茄钟",
                group: "tool",
                icon: "timer",
                priority: 51,
              },
            },
          },
          {
            path: "habits",
            name: "HabitHabits",
            component: Habits,
            meta: {
              title: "习惯打卡",
              searchable: true,
              menu: {
                name: "习惯打卡",
                group: "tool",
                icon: "check-circle",
                priority: 52,
              },
            },
          },
          {
            path: "tasks",
            name: "HabitTasks",
            component: Tasks,
            meta: {
              title: "任务管理",
              searchable: true,
              menu: {
                name: "任务管理",
                group: "tool",
                icon: "task",
                priority: 53,
              },
            },
          },
          {
            path: "stats",
            name: "HabitStats",
            component: Statistics,
            meta: {
              title: "数据统计",
              searchable: true,
              menu: {
                name: "数据统计",
                group: "tool",
                icon: "chart",
                priority: 54,
              },
            },
          },
          {
            path: "settings",
            name: "HabitSettings",
            component: Settings,
            meta: {
              title: "设置",
              searchable: true,
              menu: {
                name: "设置",
                group: "tool",
                icon: "settings",
                priority: 55,
              },
            },
          },
        ],
      },
    },
  ],
});
